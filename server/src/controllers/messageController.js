const Message = require("../models/Message");
const Project = require("../models/Project");

const getProjectAccess = async (projectId, userId) => {
  const project = await Project.findOne({
    _id: projectId,
    $or: [
      { owner: userId },
      { members: { $elemMatch: { user: userId, status: "active" } } },
    ],
  });

  if (!project) return null;

  const isLead = project.owner.toString() === userId;
  const activeMemberIds = project.members
    .filter((member) => member.status === "active")
    .map((member) => member.user.toString());

  if (!activeMemberIds.includes(project.owner.toString())) {
    activeMemberIds.push(project.owner.toString());
  }

  return { project, isLead, activeMemberIds };
};

const getProjectMessages = async (req, res) => {
  try {
    const access = await getProjectAccess(req.params.projectId, req.user);
    if (!access) {
      return res.status(404).json({ message: "Project not found or you are not a member" });
    }

    const privateFilter = {
      type: "private",
      $or: [
        { sender: req.user },
        { recipient: req.user },
      ],
    };

    const messages = await Message.find({
      project: access.project._id,
      $or: [{ type: "group" }, privateFilter],
    })
      .sort({ createdAt: 1 })
      .limit(100)
      .populate("sender", "name username avatar")
      .populate("recipient", "name username")
      .populate("mentions", "name username");

    return res.status(200).json({ messages });
  } catch (error) {
    console.error("Get project messages error:", error);
    return res.status(500).json({ message: "Failed to fetch project messages" });
  }
};

const createProjectMessage = async (req, res) => {
  try {
    const { body, type = "group", recipient, mentions = [] } = req.body;
    const access = await getProjectAccess(req.params.projectId, req.user);

    if (!access) {
      return res.status(404).json({ message: "Project not found or you are not a member" });
    }

    if (!body || !body.trim()) {
      return res.status(400).json({ message: "Message cannot be empty" });
    }

    if (!["group", "private"].includes(type)) {
      return res.status(400).json({ message: "Invalid message type" });
    }

    if (type === "private" && !access.isLead) {
      return res.status(403).json({ message: "Only the team lead can send private inquiries" });
    }

    if (type === "private" && (!recipient || !access.activeMemberIds.includes(recipient))) {
      return res.status(400).json({ message: "Choose an active project member" });
    }

    const validMentions = [...new Set(mentions)].filter((mention) =>
      access.activeMemberIds.includes(mention)
    );

    const message = await Message.create({
      project: access.project._id,
      sender: req.user,
      body: body.trim(),
      type,
      recipient: type === "private" ? recipient : null,
      mentions: type === "group" ? validMentions : [],
    });

    const populatedMessage = await Message.findById(message._id)
      .populate("sender", "name username avatar")
      .populate("recipient", "name username")
      .populate("mentions", "name username");

    return res.status(201).json({ message: populatedMessage });
  } catch (error) {
    console.error("Create project message error:", error);
    return res.status(500).json({ message: "Failed to send project message" });
  }
};

module.exports = { getProjectMessages, createProjectMessage };