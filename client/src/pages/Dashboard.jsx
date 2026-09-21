import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";
import {
  createProject,
  getProjects,
  deleteProject,
  updateProject,
  getMemberInvitations,
  respondToMemberInvitation,
  getProjectTasks,
  updateTask,
  getProjectActivity,
} from "../services/api";
import "./Dashboard.css";

function Dashboard() {
  const { user, token, logout } = useAuth();
  const navigate = useNavigate();

  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Create project states
  const [showForm, setShowForm] = useState(false);
  const [projectName, setProjectName] = useState("");
  const [description, setDescription] = useState("");
  const [creating, setCreating] = useState(false);
  const [invitations, setInvitations] = useState([]);
  const [invitationActionLoading, setInvitationActionLoading] = useState(false);
  const [activeView, setActiveView] = useState("dashboard");
  const [allTasks, setAllTasks] = useState([]);
  const [allActivity, setAllActivity] = useState([]);
  const [workspaceLoading, setWorkspaceLoading] = useState(false);

  // Edit project states
  const [showEditForm, setShowEditForm] = useState(false);
  const [editingProject, setEditingProject] = useState(null);
  const [editProjectName, setEditProjectName] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [updating, setUpdating] = useState(false);

  const openCreateProjectForm = () => {
    setError("");
    setProjectName("");
    setDescription("");
    setShowForm(true);
  };

  // Logout
  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  // Fetch projects from MongoDB
  const fetchProjects = async () => {
    try {
      setLoading(true);
      setError("");

      const data = await getProjects(token);

      setProjects(data.projects || []);
    } catch (error) {
      console.error("Failed to fetch projects:", error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  // Load projects when dashboard opens
  useEffect(() => {
    if (token) {
      fetchProjects();
    }
  }, [token]);

  useEffect(() => {
    const fetchWorkspaceData = async () => {
      if (!token || projects.length === 0) {
        setAllTasks([]);
        setAllActivity([]);
        return;
      }

      try {
        setWorkspaceLoading(true);
        const results = await Promise.all(
          projects.map(async (project) => {
            const [taskData, activityData] = await Promise.all([
              getProjectTasks(project._id, token),
              getProjectActivity(project._id, token),
            ]);

            return {
              tasks: (taskData.tasks || []).map((task) => ({
                ...task,
                projectName: project.name,
                projectId: project._id,
              })),
              activities: (activityData.activities || []).map((activity) => ({
                ...activity,
                projectName: project.name,
              })),
            };
          })
        );

        setAllTasks(results.flatMap((result) => result.tasks));
        setAllActivity(
          results
            .flatMap((result) => result.activities)
            .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
        );
      } catch (error) {
        console.error("Failed to fetch workspace data:", error);
      } finally {
        setWorkspaceLoading(false);
      }
    };

    fetchWorkspaceData();
  }, [projects, token]);

  const handleTaskStatusChange = async (task, status) => {
    try {
      await updateTask(task._id, { status }, token);
      setAllTasks((currentTasks) =>
        currentTasks.map((currentTask) =>
          currentTask._id === task._id ? { ...currentTask, status } : currentTask
        )
      );
    } catch (error) {
      setError(error.message);
    }
  };

  const formatActivityTime = (date) => {
    return new Date(date).toLocaleDateString(undefined, {
      month: "short",
      day: "numeric",
    });
  };

  const formatActivityAction = (activity) => {
    const target = activity.target ? ` “${activity.target}”` : "";
    const actions = {
      task_created: `created task${target}`,
      task_updated: `updated task${target}`,
      task_completed: `completed task${target}`,
      task_reopened: `reopened task${target}`,
      task_deleted: `deleted task${target}`,
      member_invited: `invited ${activity.target || "a member"}`,
      member_joined: "joined the project",
    };
    return actions[activity.action] || "updated the project";
  };

  useEffect(() => {
    const fetchInvitations = async () => {
      try {
        const data = await getMemberInvitations(token);
        setInvitations(data.invitations || []);
      } catch (error) {
        console.error("Failed to fetch invitations:", error);
        // Invitations are supplemental; do not block the dashboard when unavailable.
      }
    };

    if (token) {
      fetchInvitations();
    }
  }, [token]);

  const handleInvitationResponse = async (invitation, action) => {
    try {
      setInvitationActionLoading(true);
      setError("");
      await respondToMemberInvitation(
        invitation.projectId,
        invitation.membershipId,
        action,
        token
      );
      setInvitations((previousInvitations) =>
        previousInvitations.filter(
          (item) => item.membershipId !== invitation.membershipId
        )
      );
    } catch (error) {
      setError(error.message);
    } finally {
      setInvitationActionLoading(false);
    }
  };

  // Create new project
  const handleCreateProject = async (e) => {
    e.preventDefault();

    if (!projectName.trim()) {
      setError("Project name is required");
      return;
    }

    try {
      setCreating(true);
      setError("");

      const data = await createProject(
        {
          name: projectName.trim(),
          description: description,
        },
        token
      );

      // Add newly created project instantly
      setProjects((previousProjects) => [
        data.project,
        ...previousProjects,
      ]);

      // Reset form
      setProjectName("");
      setDescription("");

      // Close form
      setShowForm(false);
    } catch (error) {
      console.error("Failed to create project:", error);
      setError(error.message);
    } finally {
      setCreating(false);
    }
  };

  // Open edit modal
  const handleOpenEdit = (project) => {
    setError("");
    setEditingProject(project);
    setEditProjectName(project.name || "");
    setEditDescription(project.description || "");
    setShowEditForm(true);
  };

  // Update project
  const handleUpdateProject = async (e) => {
    e.preventDefault();

    if (!editProjectName.trim()) {
      setError("Project name is required");
      return;
    }

    if (!editingProject) {
      return;
    }

    try {
      setUpdating(true);
      setError("");

      const data = await updateProject(
        editingProject._id,
        {
          name: editProjectName,
          description: editDescription,
        },
        token
      );

      // Update project instantly in dashboard
      setProjects((previousProjects) =>
        previousProjects.map((project) =>
          project._id === editingProject._id
            ? data.project
            : project
        )
      );

      // Close modal
      setShowEditForm(false);
      setEditingProject(null);
      setEditProjectName("");
      setEditDescription("");
    } catch (error) {
      console.error("Failed to update project:", error);
      setError(error.message);
    } finally {
      setUpdating(false);
    }
  };

  // Delete project
  const handleDeleteProject = async (projectId) => {
    const confirmed = window.confirm(
      "Are you sure you want to delete this project?"
    );

    if (!confirmed) {
      return;
    }

    try {
      setError("");

      await deleteProject(projectId, token);

      // Remove deleted project immediately
      setProjects((previousProjects) =>
        previousProjects.filter(
          (project) => project._id !== projectId
        )
      );
    } catch (error) {
      console.error("Failed to delete project:", error);
      setError(error.message);
    }
  };

  return (
    <div className="dashboard">

      {/* Sidebar */}
      <aside className="sidebar">

        <div className="logo">
          Dev<span>Space</span>
        </div>

        <nav className="nav-menu">

          <button
            className={`nav-item ${activeView === "dashboard" ? "active" : ""}`}
            onClick={() => setActiveView("dashboard")}
          >
            <span>⌂</span>
            Dashboard
          </button>

          <button
            className={`nav-item ${activeView === "projects" ? "active" : ""}`}
            onClick={() => setActiveView("projects")}
          >
            <span>▣</span>
            Projects
          </button>

          <button
            className={`nav-item ${activeView === "tasks" ? "active" : ""}`}
            onClick={() => setActiveView("tasks")}
          >
            <span>✓</span>
            Tasks
          </button>

          <button
            className={`nav-item ${activeView === "activity" ? "active" : ""}`}
            onClick={() => setActiveView("activity")}
          >
            <span>◉</span>
            Activity
          </button>

        </nav>

        <div className="sidebar-bottom">

          <button className="nav-item">
            <span>⚙</span>
            Settings
          </button>

          <button
            className="nav-item logout-btn"
            onClick={handleLogout}
          >
            <span>↪</span>
            Logout
          </button>

        </div>

      </aside>

      {/* Main Content */}
      <main className="main-content">

        {/* Topbar */}
        <header className="topbar">

          <div>
            <p className="welcome-text">
              Welcome back
            </p>

            <h1>
              {user?.name || "Developer"} 👋
            </h1>
          </div>

          <div className="profile-section">
            <div className="avatar">
              {user?.name?.charAt(0)?.toUpperCase() || "D"}
            </div>
          </div>

        </header>

        {activeView === "dashboard" && (
          <>
            {/* Stats */}
            <section className="stats-grid">

          <div className="stat-card">

            <div className="stat-icon">
              ▣
            </div>

            <div>
              <p>Total Projects</p>
              <h2>{projects.length}</h2>
            </div>

          </div>

          <div className="stat-card">

            <div className="stat-icon">
              ✓
            </div>

            <div>
              <p>Tasks Completed</p>
              <h2>0</h2>
            </div>

          </div>

          <div className="stat-card">

            <div className="stat-icon">
              ◷
            </div>

            <div>
              <p>In Progress</p>
              <h2>{projects.length}</h2>
            </div>

          </div>

            </section>

            {invitations.length > 0 && (
              <section className="invitations-section">
            <div className="section-header">
              <div>
                <h2>Project Invitations</h2>
                <p>Accept an invitation to request entry. The team lead has the final approval.</p>
              </div>
              <span className="invitation-count">{invitations.length} pending</span>
            </div>

            <div className="invitations-list">
              {invitations.map((invitation) => (
                <div className="invitation-card" key={invitation.membershipId}>
                  <div>
                    <h3>{invitation.projectName}</h3>
                    <p>Invited by {invitation.owner?.name || invitation.owner?.username || "the team lead"}</p>
                  </div>
                  <div className="invitation-actions">
                    <button
                      className="accept-invitation-btn"
                      onClick={() => handleInvitationResponse(invitation, "accept")}
                      disabled={invitationActionLoading}
                    >
                      Accept & Request Entry
                    </button>
                    <button
                      className="decline-invitation-btn"
                      onClick={() => handleInvitationResponse(invitation, "reject")}
                      disabled={invitationActionLoading}
                    >
                      Decline
                    </button>
                  </div>
                </div>
              ))}
            </div>
              </section>
            )}
          </>
        )}

        {/* Projects */}
        {activeView === "dashboard" && (
          <section className="projects-section">

          <div className="section-header">

            <div>

              <h2>
                Your Projects
              </h2>

              <p>
                Manage and track your development projects
              </p>

            </div>

            <button
              className="create-project-btn"
              onClick={openCreateProjectForm}
            >
              + Create Project
            </button>

          </div>

          {/* Error Message */}
          {error && (
            <p className="dashboard-error">
              {error}
            </p>
          )}

          {/* Loading */}
          {loading ? (

            <div className="empty-projects">

              <h3>
                Loading projects...
              </h3>

            </div>

          ) : projects.length === 0 ? (

            /* Empty State */
            <div className="empty-projects">

              <div className="empty-icon">
                ▣
              </div>

              <h3>
                No projects yet
              </h3>

              <p>
                Start organizing your work by creating your
                first project.
              </p>

              <button
                className="create-project-btn"
                onClick={openCreateProjectForm}
              >
                + Create Your First Project
              </button>

            </div>

          ) : (

            /* Project Cards */
            <div className="projects-grid">

              {projects.map((project) => (

                <div
                  className="project-card"
                  key={project._id}
                  onClick={() =>
                    navigate(`/projects/${project._id}`)
                  }
                  style={{ cursor: "pointer" }}
                >

                  <div className="project-card-header">

                    <div className="project-icon">
                      ▣
                    </div>

                    <span className="project-status">
                      {project.status}
                    </span>

                  </div>

                  <h3>
                    {project.name}
                  </h3>

                  <p>
                    {project.description ||
                      "No description provided."}
                  </p>

                  <div className="project-footer">

                    <span>
                      Created{" "}
                      {new Date(
                        project.createdAt
                      ).toLocaleDateString()}
                    </span>

                    <div className="project-actions">

                      <button
                        className="edit-project-btn"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleOpenEdit(project);
                        }}
                      >
                        Edit
                      </button>

                      <button
                        className="delete-project-btn"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteProject(project._id);
                        }}
                      >
                        Delete
                      </button>

                    </div>

                  </div>

                </div>

              ))}

            </div>

          )}

          </section>
        )}

        {activeView === "projects" && (
          <section className="workspace-section projects-view">
            <div className="workspace-heading">
              <div>
                <span className="eyebrow">Portfolio view</span>
                <h2>Projects at a glance</h2>
                <p>Jump into a workspace or shape the next idea in your pipeline.</p>
              </div>
              <button className="create-project-btn" onClick={openCreateProjectForm}>
                + New project
              </button>
            </div>

            {projects.length === 0 ? (
              <div className="workspace-empty">
                <span className="empty-icon">▣</span>
                <h3>Your portfolio is waiting</h3>
                <p>Create a project to give your next build a home.</p>
              </div>
            ) : (
              <div className="portfolio-list">
                {projects.map((project) => (
                  <button
                    className="portfolio-row"
                    key={project._id}
                    onClick={() => navigate(`/projects/${project._id}`)}
                  >
                    <span className="portfolio-mark">{project.name.charAt(0).toUpperCase()}</span>
                    <span className="portfolio-copy">
                      <strong>{project.name}</strong>
                      <small>{project.description || "No description yet"}</small>
                    </span>
                    <span className="portfolio-status">{project.status}</span>
                    <span className="portfolio-arrow">→</span>
                  </button>
                ))}
              </div>
            )}
          </section>
        )}

        {activeView === "tasks" && (
          <section className="workspace-section tasks-view">
            <div className="workspace-heading">
              <div>
                <span className="eyebrow">Focus queue</span>
                <h2>Everything that needs your attention</h2>
                <p>Move work forward across every project from one calm list.</p>
              </div>
              <span className="view-count">{allTasks.length} tasks</span>
            </div>

            {workspaceLoading ? (
              <div className="workspace-empty"><h3>Gathering your work...</h3></div>
            ) : allTasks.length === 0 ? (
              <div className="workspace-empty"><span className="empty-icon">✓</span><h3>Your queue is clear</h3><p>Tasks created inside your project workspaces will appear here.</p></div>
            ) : (
              <div className="task-queue">
                {allTasks.map((task) => (
                  <article className="task-row" key={task._id}>
                    <button
                      className={`task-check ${task.status === "completed" ? "done" : ""}`}
                      aria-label={`Mark ${task.title} ${task.status === "completed" ? "incomplete" : "complete"}`}
                      onClick={() => handleTaskStatusChange(task, task.status === "completed" ? "todo" : "completed")}
                    >
                      {task.status === "completed" ? "✓" : ""}
                    </button>
                    <div className="task-copy">
                      <strong className={task.status === "completed" ? "completed-task" : ""}>{task.title}</strong>
                      <span>{task.projectName}</span>
                    </div>
                    <span className={`task-priority ${task.priority || "medium"}`}>{task.priority || "medium"}</span>
                    <span className="task-status">{task.status}</span>
                  </article>
                ))}
              </div>
            )}
          </section>
        )}

        {activeView === "activity" && (
          <section className="workspace-section activity-view">
            <div className="workspace-heading">
              <div>
                <span className="eyebrow">Signal feed</span>
                <h2>What changed across your space</h2>
                <p>A living record of progress, decisions, and team movement.</p>
              </div>
              <span className="view-count">{allActivity.length} updates</span>
            </div>

            {workspaceLoading ? (
              <div className="workspace-empty"><h3>Reading the latest updates...</h3></div>
            ) : allActivity.length === 0 ? (
              <div className="workspace-empty"><span className="empty-icon">◉</span><h3>No activity yet</h3><p>Your project updates will collect here as work begins.</p></div>
            ) : (
              <div className="activity-feed">
                {allActivity.map((activity) => (
                  <article className="activity-row" key={activity._id}>
                    <span className="activity-dot" />
                    <div className="activity-copy">
                      <strong>{activity.actor?.name || activity.actor?.username || "Someone"}</strong>
                      <span>{formatActivityAction(activity)}</span>
                      <small>{activity.projectName}</small>
                    </div>
                    <time>{formatActivityTime(activity.createdAt)}</time>
                  </article>
                ))}
              </div>
            )}
          </section>
        )}

      </main>

      {/* Create Project Modal */}
      {showForm && (

        <div
          className="modal-overlay"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setShowForm(false);
            }
          }}
        >

          <div className="project-modal">

            <div className="modal-header">

              <div>

                <h2>
                  Create Project
                </h2>

                <p>
                  Start a new workspace for your development
                  project.
                </p>

              </div>

              <button
                className="close-btn"
                onClick={() => setShowForm(false)}
              >
                ×
              </button>

            </div>

            <form onSubmit={handleCreateProject}>

              <div className="form-group">

                <label>
                  Project Name
                </label>

                <input
                  type="text"
                  placeholder="Enter project name"
                  value={projectName}
                  onChange={(e) =>
                    setProjectName(e.target.value)
                  }
                  required
                />

              </div>

              <div className="form-group">

                <label>
                  Description
                </label>

                <textarea
                  placeholder="Describe your project"
                  value={description}
                  onChange={(e) =>
                    setDescription(e.target.value)
                  }
                  rows="4"
                />

              </div>

              <div className="modal-actions">

                <button
                  type="button"
                  className="cancel-btn"
                  onClick={() => setShowForm(false)}
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="create-project-btn"
                  disabled={creating}
                >
                  {creating
                    ? "Creating..."
                    : "Create Project"}
                </button>

              </div>

            </form>

          </div>

        </div>

      )}

      {/* Edit Project Modal */}
      {showEditForm && (

        <div
          className="modal-overlay"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setShowEditForm(false);
              setEditingProject(null);
            }
          }}
        >

          <div className="project-modal">

            <div className="modal-header">

              <div>

                <h2>
                  Edit Project
                </h2>

                <p>
                  Update your project details.
                </p>

              </div>

              <button
                className="close-btn"
                onClick={() => {
                  setShowEditForm(false);
                  setEditingProject(null);
                }}
              >
                ×
              </button>

            </div>

            <form onSubmit={handleUpdateProject}>

              <div className="form-group">

                <label>
                  Project Name
                </label>

                <input
                  type="text"
                  placeholder="Enter project name"
                  value={editProjectName}
                  onChange={(e) =>
                    setEditProjectName(e.target.value)
                  }
                  required
                />

              </div>

              <div className="form-group">

                <label>
                  Description
                </label>

                <textarea
                  placeholder="Describe your project"
                  value={editDescription}
                  onChange={(e) =>
                    setEditDescription(e.target.value)
                  }
                  rows="4"
                />

              </div>

              <div className="modal-actions">

                <button
                  type="button"
                  className="cancel-btn"
                  onClick={() => {
                    setShowEditForm(false);
                    setEditingProject(null);
                  }}
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="create-project-btn"
                  disabled={updating}
                >
                  {updating
                    ? "Updating..."
                    : "Update Project"}
                </button>

              </div>

            </form>

          </div>

        </div>

      )}

    </div>
  );
}

export default Dashboard;