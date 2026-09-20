const API_URL = "http://localhost:5000/api";

const readResponse = async (response, fallbackMessage) => {
  const contentType = response.headers.get("content-type") || "";
  const body = await response.text();
  let data = {};

  if (contentType.includes("application/json") && body) {
    try {
      data = JSON.parse(body);
    } catch {
      data = {};
    }
  }

  if (!response.ok) {
    throw new Error(data.message || `${fallbackMessage} (${response.status})`);
  }

  if (!body) {
    return {};
  }

  if (!contentType.includes("application/json")) {
    throw new Error("The server returned an invalid response. Please restart the API server.");
  }

  return data;
};

// ============================
// AUTH APIs
// ============================

// Register user
export const registerUser = async (userData) => {
  const response = await fetch(`${API_URL}/auth/register`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(userData),
  });

  return readResponse(response, "Registration failed");
};

// Login user
export const loginUser = async (loginData) => {
  const response = await fetch(`${API_URL}/auth/login`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(loginData),
  });

  return readResponse(response, "Login failed");
};


// ============================
// PROJECT APIs
// ============================

// Create project
export const createProject = async (projectData, token) => {
  const response = await fetch(`${API_URL}/projects`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(projectData),
  });

  return readResponse(response, "Failed to create project");
};


// Get logged-in user's projects
export const getProjects = async (token) => {
  const response = await fetch(`${API_URL}/projects`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  return readResponse(response, "Failed to fetch projects");
};


// Update a project
export const updateProject = async (
  projectId,
  projectData,
  token
) => {
  const response = await fetch(
    `${API_URL}/projects/${projectId}`,
    {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(projectData),
    }
  );

  return readResponse(response, "Failed to update project");
};


// Delete a project
export const deleteProject = async (projectId, token) => {
  const response = await fetch(
    `${API_URL}/projects/${projectId}`,
    {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );

  return readResponse(response, "Failed to delete project");
};

export const getProjectMembers = async (projectId, token) => {
  const response = await fetch(`${API_URL}/projects/${projectId}/members`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return readResponse(response, "Failed to fetch project members");
};

export const inviteProjectMember = async (projectId, identifier, token) => {
  const response = await fetch(`${API_URL}/projects/${projectId}/members/invite`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
    body: JSON.stringify({ identifier }),
  });
  return readResponse(response, "Failed to invite member");
};

export const reviewMemberRequest = async (projectId, memberId, action, token) => {
  const response = await fetch(`${API_URL}/projects/${projectId}/members/${memberId}/review`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
    body: JSON.stringify({ action }),
  });
  return readResponse(response, "Failed to review member request");
};

export const getMemberInvitations = async (token) => {
  const response = await fetch(`${API_URL}/projects/member-invitations`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return readResponse(response, "Failed to fetch invitations");
};

export const respondToMemberInvitation = async (projectId, memberId, action, token) => {
  const response = await fetch(`${API_URL}/projects/${projectId}/members/${memberId}/respond`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
    body: JSON.stringify({ action }),
  });
  return readResponse(response, "Failed to respond to invitation");
};

export const getProjectActivity = async (projectId, token) => {
  const response = await fetch(`${API_URL}/activity/project/${projectId}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return readResponse(response, "Failed to fetch project activity");
};

export const getProjectMessages = async (projectId, token) => {
  const response = await fetch(`${API_URL}/messages/project/${projectId}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return readResponse(response, "Failed to fetch project messages");
};

export const sendProjectMessage = async (projectId, messageData, token) => {
  const response = await fetch(`${API_URL}/messages/project/${projectId}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(messageData),
  });
  return readResponse(response, "Failed to send project message");
};


// ============================
// TASK APIs
// ============================

// Create a task for a project
export const createTask = async (
  projectId,
  taskData,
  token
) => {
  const response = await fetch(
    `${API_URL}/tasks/project/${projectId}`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(taskData),
    }
  );

  return readResponse(response, "Failed to create task");
};


// Get all tasks for a project
export const getProjectTasks = async (
  projectId,
  token
) => {
  const response = await fetch(
    `${API_URL}/tasks/project/${projectId}`,
    {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );

  return readResponse(response, "Failed to fetch tasks");
};


// Update a task
export const updateTask = async (
  taskId,
  taskData,
  token
) => {
  const response = await fetch(
    `${API_URL}/tasks/${taskId}`,
    {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(taskData),
    }
  );

  return readResponse(response, "Failed to update task");
};


// Delete a task
export const deleteTask = async (
  taskId,
  token
) => {
  const response = await fetch(
    `${API_URL}/tasks/${taskId}`,
    {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );

  return readResponse(response, "Failed to delete task");
};
