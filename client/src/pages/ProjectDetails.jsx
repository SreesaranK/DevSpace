import { useNavigate, useParams } from "react-router-dom";
import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";

import {
  getProjects,
  getProjectTasks,
  createTask,
  updateTask,
  deleteTask,
  getProjectMembers,
  inviteProjectMember,
  reviewMemberRequest,
  getProjectActivity,
  getProjectMessages,
  sendProjectMessage,
} from "../services/api";

import "./ProjectDetails.css";

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
    member_rejected: "rejected a project membership request",
  };
  return actions[activity.action] || "updated the project";
};

const formatActivityTime = (date) => {
  const elapsed = Date.now() - new Date(date).getTime();
  const minutes = Math.floor(elapsed / 60000);
  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
};

function ProjectDetails() {
  const { projectId } = useParams();
  const navigate = useNavigate();
  const { token, user } = useAuth();

  // =========================
  // PROJECT STATES
  // =========================

  const [project, setProject] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // =========================
  // TAB STATE
  // =========================

  const [activeTab, setActiveTab] = useState("overview");

  const [members, setMembers] = useState([]);
  const [pendingMembers, setPendingMembers] = useState([]);
  const [membersLoading, setMembersLoading] = useState(false);
  const [memberIdentifier, setMemberIdentifier] = useState("");
  const [memberActionLoading, setMemberActionLoading] = useState(false);
  const [messages, setMessages] = useState([]);
  const [messagesLoading, setMessagesLoading] = useState(false);
  const [messageBody, setMessageBody] = useState("");
  const [messageType, setMessageType] = useState("group");
  const [messageRecipient, setMessageRecipient] = useState("");
  const [messageMentions, setMessageMentions] = useState([]);
  const [sendingMessage, setSendingMessage] = useState(false);
  const [activities, setActivities] = useState([]);
  const [activityLoading, setActivityLoading] = useState(false);

  // =========================
  // TASK STATES
  // =========================

  const [tasks, setTasks] = useState([]);
  const [tasksLoading, setTasksLoading] = useState(false);

  // =========================
  // CREATE TASK STATES
  // =========================

  const [showTaskModal, setShowTaskModal] = useState(false);

  const [taskTitle, setTaskTitle] = useState("");
  const [taskDescription, setTaskDescription] = useState("");
  const [taskPriority, setTaskPriority] = useState("medium");
  const [taskDueDate, setTaskDueDate] = useState("");

  const [creatingTask, setCreatingTask] = useState(false);

  // =========================
  // EDIT TASK STATES
  // =========================

  const [editingTask, setEditingTask] = useState(null);

  const [editTaskTitle, setEditTaskTitle] = useState("");
  const [editTaskDescription, setEditTaskDescription] =
    useState("");
  const [editTaskPriority, setEditTaskPriority] =
    useState("medium");
  const [editTaskStatus, setEditTaskStatus] =
    useState("todo");
  const [editTaskDueDate, setEditTaskDueDate] =
    useState("");

  const [updatingTask, setUpdatingTask] =
    useState(false);

  // =========================
  // FETCH PROJECT
  // =========================

  useEffect(() => {
    const fetchProject = async () => {
      try {
        setLoading(true);
        setError("");

        const data = await getProjects(token);

        const selectedProject = data.projects.find(
          (project) => project._id === projectId
        );

        if (!selectedProject) {
          setError("Project not found");
        } else {
          setProject(selectedProject);
        }
      } catch (error) {
        console.error(
          "Failed to fetch project:",
          error
        );

        setError(error.message);
      } finally {
        setLoading(false);
      }
    };

    if (token) {
      fetchProject();
    }
  }, [projectId, token]);

  // =========================
  // FETCH TASKS
  // =========================

  const fetchTasks = async () => {
    try {
      setTasksLoading(true);

      const data = await getProjectTasks(
        projectId,
        token
      );

      setTasks(data.tasks || []);
    } catch (error) {
      console.error(
        "Failed to fetch tasks:",
        error
      );

      setError(error.message);
    } finally {
      setTasksLoading(false);
    }
  };

  useEffect(() => {
    if (token && projectId) {
      fetchTasks();
    }
  }, [token, projectId]);

  const ownerId = project?.owner?._id || project?.owner;
  const isTeamLead = ownerId?.toString() === user?.id?.toString();

  const fetchMembers = async () => {
    try {
      setMembersLoading(true);
      const data = await getProjectMembers(projectId, token);
      setMembers(data.members || []);
      setPendingMembers(data.pending || []);
    } catch (error) {
      setError(error.message);
    } finally {
      setMembersLoading(false);
    }
  };

  useEffect(() => {
    if (token && projectId && (activeTab === "members" || activeTab === "messages")) {
      fetchMembers();
    }
  }, [activeTab, projectId, token]);

  const fetchActivity = async () => {
    try {
      setActivityLoading(true);
      const data = await getProjectActivity(projectId, token);
      setActivities(data.activities || []);
    } catch (error) {
      setError(error.message);
    } finally {
      setActivityLoading(false);
    }
  };

  useEffect(() => {
    if (token && projectId && activeTab === "activity") {
      fetchActivity();
    }
  }, [activeTab, projectId, token]);

  const fetchMessages = async () => {
    try {
      setMessagesLoading(true);
      const data = await getProjectMessages(projectId, token);
      setMessages(data.messages || []);
    } catch (error) {
      setError(error.message);
    } finally {
      setMessagesLoading(false);
    }
  };

  useEffect(() => {
    if (token && projectId && activeTab === "messages") {
      fetchMessages();
      const interval = setInterval(fetchMessages, 8000);
      return () => clearInterval(interval);
    }
  }, [activeTab, projectId, token]);

  const toggleMessageMention = (memberId) => {
    setMessageMentions((currentMentions) =>
      currentMentions.includes(memberId)
        ? currentMentions.filter((id) => id !== memberId)
        : [...currentMentions, memberId]
    );
  };

  const handleSendMessage = async (event) => {
    event.preventDefault();
    if (!messageBody.trim()) return;

    try {
      setSendingMessage(true);
      setError("");
      const data = await sendProjectMessage(
        projectId,
        {
          body: messageBody,
          type: messageType,
          recipient: messageType === "private" ? messageRecipient : null,
          mentions: messageType === "group" ? messageMentions : [],
        },
        token
      );
      setMessages((currentMessages) => [...currentMessages, data.message]);
      setMessageBody("");
      setMessageMentions([]);
      setMessageRecipient("");
    } catch (error) {
      setError(error.message);
    } finally {
      setSendingMessage(false);
    }
  };

  const handleInviteMember = async (event) => {
    event.preventDefault();
    if (!memberIdentifier.trim()) {
      setError("Enter a username or email address");
      return;
    }

    try {
      setMemberActionLoading(true);
      setError("");
      await inviteProjectMember(projectId, memberIdentifier.trim(), token);
      setMemberIdentifier("");
      await fetchMembers();
    } catch (error) {
      setError(error.message);
    } finally {
      setMemberActionLoading(false);
    }
  };

  const handleReviewMember = async (membershipId, action) => {
    try {
      setMemberActionLoading(true);
      setError("");
      await reviewMemberRequest(projectId, membershipId, action, token);
      await fetchMembers();
    } catch (error) {
      setError(error.message);
    } finally {
      setMemberActionLoading(false);
    }
  };

  // =========================
  // CREATE TASK
  // =========================

  const handleCreateTask = async (e) => {
    e.preventDefault();

    if (!taskTitle.trim()) {
      setError("Task title is required");
      return;
    }

    try {
      setCreatingTask(true);
      setError("");

      const data = await createTask(
        projectId,
        {
          title: taskTitle,
          description: taskDescription,
          priority: taskPriority,
          dueDate: taskDueDate || null,
        },
        token
      );

      // Add new task instantly
      setTasks((previousTasks) => [
        data.task,
        ...previousTasks,
      ]);

      // Reset form
      setTaskTitle("");
      setTaskDescription("");
      setTaskPriority("medium");
      setTaskDueDate("");

      // Close modal
      setShowTaskModal(false);
    } catch (error) {
      console.error(
        "Failed to create task:",
        error
      );

      setError(error.message);
    } finally {
      setCreatingTask(false);
    }
  };

  // =========================
  // OPEN EDIT TASK
  // =========================

  const handleOpenEditTask = (task) => {
    setError("");

    setEditingTask(task);

    setEditTaskTitle(task.title || "");
    setEditTaskDescription(
      task.description || ""
    );

    setEditTaskPriority(
      task.priority || "medium"
    );

    setEditTaskStatus(
      task.status || "todo"
    );

    setEditTaskDueDate(
      task.dueDate
        ? new Date(task.dueDate)
            .toISOString()
            .split("T")[0]
        : ""
    );

    setShowTaskModal(true);
  };

  // =========================
  // UPDATE TASK
  // =========================

  const handleUpdateTask = async (e) => {
    e.preventDefault();

    if (!editTaskTitle.trim()) {
      setError("Task title is required");
      return;
    }

    if (!editingTask) {
      return;
    }

    try {
      setUpdatingTask(true);
      setError("");

      const data = await updateTask(
        editingTask._id,
        {
          title: editTaskTitle,
          description: editTaskDescription,
          priority: editTaskPriority,
          status: editTaskStatus,
          dueDate: editTaskDueDate || null,
        },
        token
      );

      // Update task instantly
      setTasks((previousTasks) =>
        previousTasks.map((task) =>
          task._id === editingTask._id
            ? data.task
            : task
        )
      );

      closeTaskModal();
    } catch (error) {
      console.error(
        "Failed to update task:",
        error
      );

      setError(error.message);
    } finally {
      setUpdatingTask(false);
    }
  };

  // =========================
  // DELETE TASK
  // =========================

  const handleDeleteTask = async (taskId) => {
    const confirmed = window.confirm(
      "Are you sure you want to delete this task?"
    );

    if (!confirmed) {
      return;
    }

    try {
      setError("");

      await deleteTask(taskId, token);

      setTasks((previousTasks) =>
        previousTasks.filter(
          (task) => task._id !== taskId
        )
      );
    } catch (error) {
      console.error(
        "Failed to delete task:",
        error
      );

      setError(error.message);
    }
  };

  // =========================
  // CLOSE TASK MODAL
  // =========================

  const closeTaskModal = () => {
    setShowTaskModal(false);

    setEditingTask(null);

    setTaskTitle("");
    setTaskDescription("");
    setTaskPriority("medium");
    setTaskDueDate("");

    setEditTaskTitle("");
    setEditTaskDescription("");
    setEditTaskPriority("medium");
    setEditTaskStatus("todo");
    setEditTaskDueDate("");
  };

  // =========================
  // TASK STATISTICS
  // =========================

  const completedTasks = tasks.filter(
    (task) => task.status === "completed"
  ).length;

  const inProgressTasks = tasks.filter(
    (task) => task.status === "in-progress"
  ).length;

  // =========================
  // LOADING
  // =========================

  if (loading) {
    return (
      <div className="project-details-page">
        <p>Loading project...</p>
      </div>
    );
  }

  // =========================
  // ERROR
  // =========================

  if (error && !project) {
    return (
      <div className="project-details-page">
        <button
          className="back-button"
          onClick={() =>
            navigate("/dashboard")
          }
        >
          ← Back to Dashboard
        </button>

        <h2>{error}</h2>
      </div>
    );
  }

  return (
    <div className="project-details-page">

      {/* TOP NAVIGATION */}

      <div className="project-topbar">
        <button
          className="back-button"
          onClick={() =>
            navigate("/dashboard")
          }
        >
          ← Back to Projects
        </button>
      </div>

      {/* PROJECT HEADER */}

      <div className="project-header">

        <div>
          <p className="project-label">
            PROJECT WORKSPACE
          </p>

          <h1>
            {project.name}
          </h1>

          <p className="project-description">
            {project.description ||
              "No description provided for this project."}
          </p>
        </div>

        <span className="project-status">
          {project.status || "active"}
        </span>

      </div>

      {/* NAVIGATION TABS */}

      <div className="workspace-tabs">

        <button
          className={`workspace-tab ${
            activeTab === "overview"
              ? "active"
              : ""
          }`}
          onClick={() =>
            setActiveTab("overview")
          }
        >
          Overview
        </button>

        <button
          className={`workspace-tab ${
            activeTab === "tasks"
              ? "active"
              : ""
          }`}
          onClick={() =>
            setActiveTab("tasks")
          }
        >
          Tasks
        </button>

        <button
          className={`workspace-tab ${
            activeTab === "members" ? "active" : ""
          }`}
          onClick={() => setActiveTab("members")}
        >
          Members
        </button>

        <button
          className={`workspace-tab ${
            activeTab === "activity" ? "active" : ""
          }`}
          onClick={() => setActiveTab("activity")}
        >
          Activity
        </button>

        <button
          className={`workspace-tab ${
            activeTab === "messages" ? "active" : ""
          }`}
          onClick={() => setActiveTab("messages")}
        >
          Messages
        </button>

      </div>

      {/* ERROR MESSAGE */}

      {error && (
        <p className="dashboard-error">
          {error}
        </p>
      )}

      {/* ==================== */}
      {/* OVERVIEW TAB */}
      {/* ==================== */}

      {activeTab === "overview" && (

        <div className="workspace-content">

          <h2>
            Project Overview
          </h2>

          <div className="overview-grid">

            <div className="overview-card">
              <p>Team Members</p>
              <h3>{members.length || 1}</h3>
            </div>

            <div className="overview-card">
              <p>Total Tasks</p>
              <h3>{tasks.length}</h3>
            </div>

            <div className="overview-card">
              <p>Completed Tasks</p>
              <h3>
                {completedTasks}
              </h3>
            </div>

            <div className="overview-card">
              <p>In Progress</p>
              <h3>
                {inProgressTasks}
              </h3>
            </div>

          </div>

          <div className="workspace-empty">

            <h3>
              Your collaborative workspace is ready 🚀
            </h3>

            <p>
              Create tasks, invite team members and
              start collaborating on your project.
            </p>

          </div>

        </div>

      )}

      {/* ==================== */}
      {/* TASKS TAB */}
      {/* ==================== */}

      {activeTab === "tasks" && (

        <div className="workspace-content">

          <div className="tasks-header">

            <div>
              <h2>
                Project Tasks
              </h2>

              <p>
                Manage and track all tasks for this
                project.
              </p>
            </div>

            <button
              className="create-task-btn"
              onClick={() => {
                setError("");
                setEditingTask(null);
                setShowTaskModal(true);
              }}
            >
              + Create Task
            </button>

          </div>

          {/* TASK LOADING */}

          {tasksLoading ? (

            <div className="empty-tasks">
              <h3>
                Loading tasks...
              </h3>
            </div>

          ) : tasks.length === 0 ? (

            /* EMPTY TASK STATE */

            <div className="empty-tasks">

              <h3>
                No tasks yet
              </h3>

              <p>
                Create your first task and start
                organizing your project.
              </p>

              <button
                className="create-task-btn"
                onClick={() => {
                  setEditingTask(null);
                  setShowTaskModal(true);
                }}
              >
                + Create First Task
              </button>

            </div>

          ) : (

            /* TASK LIST */

            <div className="tasks-list">

              {tasks.map((task) => (

                <div
                  className="task-card"
                  key={task._id}
                >

                  <div className="task-card-top">

                    <div>

                      <h3>
                        {task.title}
                      </h3>

                      <p className="task-card-description">
                        {task.description ||
                          "No description provided."}
                      </p>

                    </div>

                    <div className="task-badges">
                      <span
                        className={`task-priority priority-${task.priority}`}
                      >
                        {task.priority}
                      </span>

                    </div>

                  </div>

                  <div className="task-footer">

                    <div className="task-footer-left">
                      <span className="task-date">

                        {task.dueDate
                          ? `Due: ${new Date(
                              task.dueDate
                            ).toLocaleDateString()}`
                          : "No due date"}

                      </span>

                      <span
                        className={`task-assignee ${
                          task.assignedToName ? "assigned" : "unassigned"
                        }`}
                      >
                        👤 {task.assignedToName || "Unassigned"}
                      </span>
                    </div>

                    <div className="task-actions">
                      <button
                        className="icon-task-btn notify-task-btn"
                        aria-label="Notify assignee"
                        title="Notify assignee"
                        onClick={() =>
                          window.alert(
                            `Notification sent for "${task.title}".`
                          )
                        }
                      >
                        🔔
                      </button>

                      <button
                        className="icon-task-btn assign-task-btn"
                        aria-label="Assign task"
                        title="Assign task"
                        onClick={() =>
                          window.prompt(
                            `Assign task: "${task.title}" to a person`,
                            ""
                          )
                        }
                      >
                        👤
                      </button>

                      <button
                        className="edit-task-btn"
                        onClick={() =>
                          handleOpenEditTask(task)
                        }
                      >
                        Edit
                      </button>

                      <button
                        className="delete-task-btn"
                        onClick={() =>
                          handleDeleteTask(task._id)
                        }
                      >
                        Delete
                      </button>

                    </div>

                  </div>

                </div>

              ))}

            </div>

          )}

        </div>

      )}

      {/* ==================== */}
      {/* MEMBERS TAB */}
      {/* ==================== */}

      {activeTab === "members" && (
        <div className="workspace-content members-content">
          <div className="members-header">
            <div>
              <h2>Project Members</h2>
              <p>See who is working on this project and what they are handling.</p>
            </div>
            <span className="member-count-badge">{members.length} active</span>
          </div>

          {isTeamLead && (
            <form className="invite-member-panel" onSubmit={handleInviteMember}>
              <div>
                <h3>Invite a collaborator</h3>
                <p>Members accept first, then the team lead approves their entry.</p>
              </div>
              <div className="invite-member-form">
                <input
                  type="text"
                  placeholder="Username or email address"
                  value={memberIdentifier}
                  onChange={(event) => setMemberIdentifier(event.target.value)}
                  aria-label="Username or email address"
                />
                <button className="create-task-btn" type="submit" disabled={memberActionLoading}>
                  {memberActionLoading ? "Sending..." : "Send Invite"}
                </button>
              </div>
            </form>
          )}

          {isTeamLead && pendingMembers.length > 0 && (
            <section className="pending-members-section">
              <div className="members-section-title">
                <h3>Approval queue</h3>
                <span>{pendingMembers.length} waiting</span>
              </div>
              <div className="pending-members-list">
                {pendingMembers.map((member) => (
                  <div className="pending-member-row" key={member._id}>
                    <div className="member-avatar">{member.user?.name?.charAt(0)?.toUpperCase() || "?"}</div>
                    <div>
                      <strong>{member.user?.name || "Member request"}</strong>
                      <p>@{member.user?.username || "unknown"} accepted the invitation and is waiting for approval.</p>
                    </div>
                    <div className="member-review-actions">
                      <button type="button" className="approve-member-btn" onClick={() => handleReviewMember(member._id, "approve")} disabled={memberActionLoading}>Approve</button>
                      <button type="button" className="reject-member-btn" onClick={() => handleReviewMember(member._id, "reject")} disabled={memberActionLoading}>Reject</button>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          {membersLoading ? (
            <div className="workspace-empty"><h3>Loading members...</h3></div>
          ) : members.length === 0 ? (
            <div className="workspace-empty">
              <h3>Your team starts here</h3>
              <p>Invite a collaborator to begin building this project together.</p>
            </div>
          ) : (
            <div className="members-grid">
              {members.map((member) => (
                <article className="member-card" key={member.membershipId}>
                  <div className="member-card-header">
                    <div className="member-avatar">{member.user?.name?.charAt(0)?.toUpperCase() || "?"}</div>
                    <div>
                      <h3>{member.user?.name}</h3>
                      <p>@{member.user?.username}</p>
                    </div>
                    <span className={`member-role ${member.role}`}>{member.role}</span>
                  </div>
                  <p className="member-email">{member.user?.email}</p>
                  <div className="member-workload">
                    <div><strong>{member.totalTasks}</strong><span>Assigned</span></div>
                    <div><strong>{member.completedTasks}</strong><span>Completed</span></div>
                    <div><strong>{member.totalTasks - member.completedTasks}</strong><span>Remaining</span></div>
                  </div>
                  <p className="member-joined">
                    {member.role === "lead" ? "Team lead" : `Joined ${new Date(member.joinedAt).toLocaleDateString()}`}
                  </p>
                </article>
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === "activity" && (
        <div className="workspace-content activity-content">
          <div className="activity-header">
            <div>
              <h2>Recent Activity</h2>
              <p>Follow the latest work completed by everyone on this project.</p>
            </div>
            <button className="activity-refresh-btn" onClick={fetchActivity} disabled={activityLoading}>
              {activityLoading ? "Refreshing..." : "Refresh"}
            </button>
          </div>

          {activityLoading ? (
            <div className="workspace-empty"><h3>Loading activity...</h3></div>
          ) : activities.length === 0 ? (
            <div className="workspace-empty">
              <h3>No activity yet</h3>
              <p>Task and team updates will appear here as the project gets moving.</p>
            </div>
          ) : (
            <div className="activity-list">
              {activities.map((activity) => (
                <article className="activity-item" key={activity._id}>
                  <div className={`activity-icon activity-${activity.action}`}>
                    {activity.action.startsWith("member_") ? "👥" : "✓"}
                  </div>
                  <div className="activity-copy">
                    <p>
                      <strong>{activity.actor?.name || activity.actor?.username || "A member"}</strong>{" "}
                      {formatActivityAction(activity)}
                    </p>
                    <span>{formatActivityTime(activity.createdAt)}</span>
                  </div>
                  <span className="activity-type">{activity.action.replaceAll("_", " ")}</span>
                </article>
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === "messages" && (
        <div className="workspace-content messages-content">
          <div className="messages-header">
            <div>
              <h2>Project Messages</h2>
              <p>Use the group room for teamwork, tag members, or ask the lead a private progress question.</p>
            </div>
            <span className="live-chat-badge">Project room</span>
          </div>

          {messagesLoading ? (
            <div className="workspace-empty"><h3>Loading messages...</h3></div>
          ) : (
            <div className="message-list">
              {messages.length === 0 ? (
                <div className="workspace-empty">
                  <h3>Start the conversation</h3>
                  <p>Share a progress update or tag a teammate to get their attention.</p>
                </div>
              ) : messages.map((message) => (
                <article className={`message-bubble ${message.type}`} key={message._id}>
                  <div className="message-meta">
                    <strong>{message.sender?.name || message.sender?.username || "Member"}</strong>
                    <span>{message.type === "private" ? `Private inquiry to ${message.recipient?.name || "member"}` : "Group chat"}</span>
                    <time>{formatActivityTime(message.createdAt)}</time>
                  </div>
                  <p>{message.body}</p>
                  {message.mentions?.length > 0 && (
                    <div className="message-tags">
                      {message.mentions.map((mention) => (
                        <span key={mention._id}>@{mention.username}</span>
                      ))}
                    </div>
                  )}
                </article>
              ))}
            </div>
          )}

          <form className="message-composer" onSubmit={handleSendMessage}>
            <div className="message-composer-toolbar">
              <div className="message-mode-toggle">
                <button
                  type="button"
                  className={messageType === "group" ? "selected" : ""}
                  onClick={() => setMessageType("group")}
                >
                  Group chat
                </button>
                {isTeamLead && (
                  <button
                    type="button"
                    className={messageType === "private" ? "selected private" : ""}
                    onClick={() => setMessageType("private")}
                  >
                    Private inquiry
                  </button>
                )}
              </div>
              {messageType === "private" && isTeamLead && (
                <select
                  value={messageRecipient}
                  onChange={(event) => setMessageRecipient(event.target.value)}
                  required
                  aria-label="Private inquiry recipient"
                >
                  <option value="">Choose a member</option>
                  {members.filter((member) => member.role !== "lead").map((member) => (
                    <option key={member.user?._id} value={member.user?._id}>
                      {member.user?.name} (@{member.user?.username})
                    </option>
                  ))}
                </select>
              )}
            </div>

            {messageType === "group" && members.length > 0 && (
              <div className="mention-picker">
                <span>Tag:</span>
                {members.filter((member) => member.role !== "lead").map((member) => (
                  <button
                    type="button"
                    key={member.user?._id}
                    className={messageMentions.includes(member.user?._id) ? "tag-selected" : ""}
                    onClick={() => toggleMessageMention(member.user?._id)}
                  >
                    @{member.user?.username}
                  </button>
                ))}
              </div>
            )}

            <div className="message-input-row">
              <textarea
                value={messageBody}
                onChange={(event) => setMessageBody(event.target.value)}
                placeholder={messageType === "private" ? "Ask this member for a progress update..." : "Write a message to the project..."}
                maxLength={2000}
                rows="3"
                required
              />
              <button className="send-message-btn" type="submit" disabled={sendingMessage || (messageType === "private" && !messageRecipient)}>
                {sendingMessage ? "Sending..." : "Send"}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ==================== */}
      {/* TASK MODAL */}
      {/* ==================== */}

      {showTaskModal && (

        <div
          className="task-modal-overlay"
          onClick={(e) => {

            if (
              e.target === e.currentTarget
            ) {
              closeTaskModal();
            }

          }}
        >

          <div className="task-modal">

            <div className="task-modal-header">

              <div>

                <h2>
                  {editingTask
                    ? "Edit Task"
                    : "Create Task"}
                </h2>

                <p>
                  {editingTask
                    ? "Update your task details."
                    : "Add a new task to this project."}
                </p>

              </div>

              <button
                className="close-task-modal"
                onClick={closeTaskModal}
              >
                ×
              </button>

            </div>

            {/* CREATE TASK FORM */}

            {!editingTask ? (

              <form
                onSubmit={handleCreateTask}
              >

                <div className="task-form-group">

                  <label>
                    Task Title
                  </label>

                  <input
                    type="text"
                    placeholder="Enter task title"
                    value={taskTitle}
                    onChange={(e) =>
                      setTaskTitle(
                        e.target.value
                      )
                    }
                    required
                  />

                </div>

                <div className="task-form-group">

                  <label>
                    Description
                  </label>

                  <textarea
                    placeholder="Describe this task"
                    value={taskDescription}
                    onChange={(e) =>
                      setTaskDescription(
                        e.target.value
                      )
                    }
                  />

                </div>

                <div className="task-form-row">

                  <div className="task-form-group">

                    <label>
                      Priority
                    </label>

                    <select
                      value={taskPriority}
                      onChange={(e) =>
                        setTaskPriority(
                          e.target.value
                        )
                      }
                    >

                      <option value="low">
                        Low
                      </option>

                      <option value="medium">
                        Medium
                      </option>

                      <option value="high">
                        High
                      </option>

                    </select>

                  </div>

                  <div className="task-form-group">

                    <label>
                      Due Date
                    </label>

                    <input
                      type="date"
                      value={taskDueDate}
                      onChange={(e) =>
                        setTaskDueDate(
                          e.target.value
                        )
                      }
                    />

                  </div>

                </div>

                <div className="task-modal-actions">

                  <button
                    type="button"
                    className="cancel-task-btn"
                    onClick={closeTaskModal}
                  >
                    Cancel
                  </button>

                  <button
                    type="submit"
                    className="save-task-btn"
                    disabled={creatingTask}
                  >
                    {creatingTask
                      ? "Creating..."
                      : "Create Task"}
                  </button>

                </div>

              </form>

            ) : (

              /* EDIT TASK FORM */

              <form
                onSubmit={handleUpdateTask}
              >

                <div className="task-form-group">

                  <label>
                    Task Title
                  </label>

                  <input
                    type="text"
                    value={editTaskTitle}
                    onChange={(e) =>
                      setEditTaskTitle(
                        e.target.value
                      )
                    }
                    required
                  />

                </div>

                <div className="task-form-group">

                  <label>
                    Description
                  </label>

                  <textarea
                    value={editTaskDescription}
                    onChange={(e) =>
                      setEditTaskDescription(
                        e.target.value
                      )
                    }
                  />

                </div>

                <div className="task-form-row">

                  <div className="task-form-group">

                    <label>
                      Priority
                    </label>

                    <select
                      value={editTaskPriority}
                      onChange={(e) =>
                        setEditTaskPriority(
                          e.target.value
                        )
                      }
                    >

                      <option value="low">
                        Low
                      </option>

                      <option value="medium">
                        Medium
                      </option>

                      <option value="high">
                        High
                      </option>

                    </select>

                  </div>

                  <div className="task-form-group">

                    <label>
                      Status
                    </label>

                    <select
                      value={editTaskStatus}
                      onChange={(e) =>
                        setEditTaskStatus(
                          e.target.value
                        )
                      }
                    >

                      <option value="todo">
                        To Do
                      </option>

                      <option value="in-progress">
                        In Progress
                      </option>

                      <option value="completed">
                        Completed
                      </option>

                    </select>

                  </div>

                </div>

                <div className="task-form-group">

                  <label>
                    Due Date
                  </label>

                  <input
                    type="date"
                    value={editTaskDueDate}
                    onChange={(e) =>
                      setEditTaskDueDate(
                        e.target.value
                      )
                    }
                  />

                </div>

                <div className="task-modal-actions">

                  <button
                    type="button"
                    className="cancel-task-btn"
                    onClick={closeTaskModal}
                  >
                    Cancel
                  </button>

                  <button
                    type="submit"
                    className="save-task-btn"
                    disabled={updatingTask}
                  >
                    {updatingTask
                      ? "Updating..."
                      : "Update Task"}
                  </button>

                </div>

              </form>

            )}

          </div>

        </div>

      )}

    </div>
  );
}

export default ProjectDetails;