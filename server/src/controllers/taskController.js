const Task = require("../models/Task");
const Project = require("../models/Project");
const Activity = require("../models/Activity");

// Create a new task
const createTask = async (req, res) => {
  try {
    const {
      title,
      description,
      priority,
      dueDate,
    } = req.body;

    const { projectId } = req.params;

    // Validate task title
    if (!title || title.trim() === "") {
      return res.status(400).json({
        message: "Task title is required",
      });
    }

    // Check if project exists and belongs to logged-in user
    const project = await Project.findOne({
      _id: projectId,
      $or: [
        { owner: req.user },
        { members: { $elemMatch: { user: req.user, status: "active" } } },
      ],
    });

    if (!project) {
      return res.status(404).json({
        message: "Project not found or you are not authorized",
      });
    }

    // Create task
    const task = await Task.create({
      title: title.trim(),
      description: description || "",
      project: projectId,
      createdBy: req.user,
      priority: priority || "medium",
      dueDate: dueDate || null,
    });

    await Activity.create({
      project: projectId,
      actor: req.user,
      action: "task_created",
      target: task.title,
      metadata: { taskId: task._id },
    });

    return res.status(201).json({
      message: "Task created successfully",
      task,
    });
  } catch (error) {
    console.error("Create task error:", error);

    return res.status(500).json({
      message: "Failed to create task",
      error: error.message,
    });
  }
};

// Get all tasks for a project
const getProjectTasks = async (req, res) => {
  try {
    const { projectId } = req.params;

    // Check if project exists and belongs to logged-in user
    const project = await Project.findOne({
      _id: projectId,
      $or: [
        { owner: req.user },
        { members: { $elemMatch: { user: req.user, status: "active" } } },
      ],
    });

    if (!project) {
      return res.status(404).json({
        message: "Project not found or you are not authorized",
      });
    }

    // Get project tasks
    const tasks = await Task.find({
      project: projectId,
    }).sort({
      createdAt: -1,
    });

    return res.status(200).json({
      tasks,
    });
  } catch (error) {
    console.error("Get tasks error:", error);

    return res.status(500).json({
      message: "Failed to fetch tasks",
      error: error.message,
    });
  }
};

// Update a task
const updateTask = async (req, res) => {
  try {
    const { taskId } = req.params;

    const {
      title,
      description,
      status,
      priority,
      dueDate,
    } = req.body;

    // Find task
    const task = await Task.findOne({
      _id: taskId,
      createdBy: req.user,
    });

    if (!task) {
      return res.status(404).json({
        message: "Task not found or you are not authorized",
      });
    }

    const previousStatus = task.status;

    // Update title
    if (title !== undefined) {
      if (!title.trim()) {
        return res.status(400).json({
          message: "Task title cannot be empty",
        });
      }

      task.title = title.trim();
    }

    // Update description
    if (description !== undefined) {
      task.description = description;
    }

    // Update status
    if (status !== undefined) {
      task.status = status;
    }

    // Update priority
    if (priority !== undefined) {
      task.priority = priority;
    }

    // Update due date
    if (dueDate !== undefined) {
      task.dueDate = dueDate || null;
    }

    const updatedTask = await task.save();

    const action =
      previousStatus !== "completed" && updatedTask.status === "completed"
        ? "task_completed"
        : previousStatus === "completed" && updatedTask.status !== "completed"
          ? "task_reopened"
          : "task_updated";

    await Activity.create({
      project: task.project,
      actor: req.user,
      action,
      target: updatedTask.title,
      metadata: { taskId: updatedTask._id, status: updatedTask.status },
    });

    return res.status(200).json({
      message: "Task updated successfully",
      task: updatedTask,
    });
  } catch (error) {
    console.error("Update task error:", error);

    return res.status(500).json({
      message: "Failed to update task",
      error: error.message,
    });
  }
};

// Delete a task
const deleteTask = async (req, res) => {
  try {
    const { taskId } = req.params;

    const task = await Task.findOneAndDelete({
      _id: taskId,
      createdBy: req.user,
    });

    if (!task) {
      return res.status(404).json({
        message: "Task not found or you are not authorized",
      });
    }

    await Activity.create({
      project: task.project,
      actor: req.user,
      action: "task_deleted",
      target: task.title,
      metadata: { taskId: task._id },
    });

    return res.status(200).json({
      message: "Task deleted successfully",
      task,
    });
  } catch (error) {
    console.error("Delete task error:", error);

    return res.status(500).json({
      message: "Failed to delete task",
      error: error.message,
    });
  }
};

module.exports = {
  createTask,
  getProjectTasks,
  updateTask,
  deleteTask,
};