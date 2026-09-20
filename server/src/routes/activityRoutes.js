const express = require("express");
const authMiddleware = require("../middleware/authMiddleware");
const { getProjectActivity } = require("../controllers/activityController");

const router = express.Router();

router.get("/project/:projectId", authMiddleware, getProjectActivity);

module.exports = router;