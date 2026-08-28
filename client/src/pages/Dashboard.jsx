import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";
import {
  createProject,
  getProjects,
  deleteProject,
} from "../services/api";
import "./Dashboard.css";

function Dashboard() {
  const { user, token, logout } = useAuth();
  const navigate = useNavigate();

  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [showForm, setShowForm] = useState(false);
  const [projectName, setProjectName] = useState("");
  const [description, setDescription] = useState("");
  const [creating, setCreating] = useState(false);

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
          name: projectName,
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

      // Remove deleted project immediately from dashboard
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

          <button className="nav-item active">
            <span>⌂</span>
            Dashboard
          </button>

          <button className="nav-item">
            <span>▣</span>
            Projects
          </button>

          <button className="nav-item">
            <span>✓</span>
            Tasks
          </button>

          <button className="nav-item">
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

        {/* Projects */}
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
              onClick={() => {
                setError("");
                setShowForm(true);
              }}
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
                onClick={() => {
                  setError("");
                  setShowForm(true);
                }}
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

                    <button
                      className="delete-project-btn"
                      onClick={() =>
                        handleDeleteProject(project._id)
                      }
                    >
                      Delete
                    </button>

                  </div>

                </div>

              ))}

            </div>

          )}

        </section>

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

    </div>
  );
}

export default Dashboard;
