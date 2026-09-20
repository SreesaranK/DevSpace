const express = require("express");

const {
  createTask,
  getProjectTasks,
  updateTask,
  deleteTask,
} = require("../controllers/taskController");

const authMiddleware = require("../middleware/authMiddleware");

const router = express.Router();

// Create a task for a project
router.post(
  "/project/:projectId",
  authMiddleware,
  createTask
);

// Get all tasks for a project
router.get(
  "/project/:projectId",
  authMiddleware,
  getProjectTasks
);

// Update a task
router.put(
  "/:taskId",
  authMiddleware,
  updateTask
);

// Delete a task
router.delete(
  "/:taskId",
  authMiddleware,
  deleteTask
);

module.exports = router;