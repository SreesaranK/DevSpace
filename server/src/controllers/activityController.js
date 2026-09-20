const Activity = require("../models/Activity");
const Project = require("../models/Project");

const getProjectActivity = async (req, res) => {
  try {
    const project = await Project.findOne({
      _id: req.params.projectId,
      $or: [
        { owner: req.user },
        { members: { $elemMatch: { user: req.user, status: "active" } } },
      ],
    });

    if (!project) {
      return res.status(404).json({
        message: "Project not found or you are not a member",
      });
    }

    const activities = await Activity.find({ project: project._id })
      .sort({ createdAt: -1 })
      .limit(50)
      .populate("actor", "name username avatar");

    return res.status(200).json({ activities });
  } catch (error) {
    console.error("Get project activity error:", error);
    return res.status(500).json({ message: "Failed to fetch project activity" });
  }
};

module.exports = { getProjectActivity };