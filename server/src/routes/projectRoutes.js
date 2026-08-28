const express = require("express");

const {
  createProject,
  getMyProjects,
  deleteProject,
} = require("../controllers/projectController");

const authMiddleware = require("../middleware/authMiddleware");

const router = express.Router();

// Create a project
router.post(
  "/",
  authMiddleware,
  createProject
);

// Get logged-in user's projects
router.get(
  "/",
  authMiddleware,
  getMyProjects
);

// Delete a project
router.delete(
  "/:id",
  authMiddleware,
  deleteProject
);

module.exports = router;
