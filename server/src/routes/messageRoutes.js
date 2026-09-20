const express = require("express");
const authMiddleware = require("../middleware/authMiddleware");
const {
  getProjectMessages,
  createProjectMessage,
} = require("../controllers/messageController");

const router = express.Router();

router.get("/project/:projectId", authMiddleware, getProjectMessages);
router.post("/project/:projectId", authMiddleware, createProjectMessage);

module.exports = router;