const Project = require("../models/Project");

// Create a new project
const createProject = async (req, res) => {
  try {
    const { name, description } = req.body;

    if (!name || name.trim() === "") {
      return res.status(400).json({
        message: "Project name is required",
      });
    }

    const project = await Project.create({
      name: name.trim(),
      description: description || "",
      owner: req.user,
    });

    return res.status(201).json({
      message: "Project created successfully",
      project,
    });
  } catch (error) {
    console.error("Create project error:", error);

    return res.status(500).json({
      message: "Failed to create project",
      error: error.message,
    });
  }
};

// Get all projects belonging to logged-in user
const getMyProjects = async (req, res) => {
  try {
    const projects = await Project.find({
      owner: req.user,
    }).sort({
      createdAt: -1,
    });

    return res.status(200).json({
      projects,
    });
  } catch (error) {
    console.error("Get projects error:", error);

    return res.status(500).json({
      message: "Failed to fetch projects",
      error: error.message,
    });
  }
};

// Delete a project belonging to the logged-in user
const deleteProject = async (req, res) => {
  try {
    const project = await Project.findOneAndDelete({
      _id: req.params.id,
      owner: req.user,
    });

    if (!project) {
      return res.status(404).json({
        message: "Project not found or you are not authorized",
      });
    }

    return res.status(200).json({
      message: "Project deleted successfully",
      project,
    });
  } catch (error) {
    console.error("Delete project error:", error);

    return res.status(500).json({
      message: "Failed to delete project",
      error: error.message,
    });
  }
};

module.exports = {
  createProject,
  getMyProjects,
  deleteProject,
};
