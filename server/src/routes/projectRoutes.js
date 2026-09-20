const express = require("express");

const {
  createProject,
  getMyProjects,
  updateProject,
  deleteProject,
  getProjectMembers,
  inviteProjectMember,
  getMyMemberInvitations,
  respondToMemberInvitation,
  reviewMemberRequest,
} = require("../controllers/projectController");

const authMiddleware = require("../middleware/authMiddleware");

const router = express.Router();

router.get("/member-invitations", authMiddleware, getMyMemberInvitations);

// Create project
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

// Update a project
router.put(
  "/:id",
  authMiddleware,
  updateProject
);

// Delete a project
router.delete(
  "/:id",
  authMiddleware,
  deleteProject
);

router.get("/:id/members", authMiddleware, getProjectMembers);
router.post("/:id/members/invite", authMiddleware, inviteProjectMember);
router.post("/:id/members/:memberId/respond", authMiddleware, respondToMemberInvitation);
router.post("/:id/members/:memberId/review", authMiddleware, reviewMemberRequest);

module.exports = router;
