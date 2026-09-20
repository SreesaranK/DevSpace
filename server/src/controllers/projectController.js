const Project = require("../models/Project");
const Task = require("../models/Task");
const User = require("../models/User");
const Activity = require("../models/Activity");

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
      members: [{
        user: req.user,
        role: "lead",
        status: "active",
        invitedBy: req.user,
        joinedAt: new Date(),
      }],
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
      $or: [
        { owner: req.user },
        { members: { $elemMatch: { user: req.user, status: "active" } } },
      ],
    }).sort({ createdAt: -1 });

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

// Update a project belonging to the logged-in user
const updateProject = async (req, res) => {
  try {
    const { name, description, status } = req.body;

    // Find only projects owned by the logged-in user
    const project = await Project.findOne({
      _id: req.params.id,
      owner: req.user,
    });

    if (!project) {
      return res.status(404).json({
        message: "Project not found or you are not authorized",
      });
    }

    // Update fields only if they are provided
    if (name !== undefined) {
      if (!name.trim()) {
        return res.status(400).json({
          message: "Project name cannot be empty",
        });
      }

      project.name = name.trim();
    }

    if (description !== undefined) {
      project.description = description;
    }

    if (status !== undefined) {
      project.status = status;
    }

    // Save updated project
    const updatedProject = await project.save();

    return res.status(200).json({
      message: "Project updated successfully",
      project: updatedProject,
    });
  } catch (error) {
    console.error("Update project error:", error);

    return res.status(500).json({
      message: "Failed to update project",
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

const getProjectMembers = async (req, res) => {
  try {
    const project = await Project.findOne({
      _id: req.params.id,
      $or: [
        { owner: req.user },
        { members: { $elemMatch: { user: req.user, status: "active" } } },
      ],
    }).populate("members.user", "name username email avatar bio skills");

    if (!project) {
      return res.status(404).json({ message: "Project not found or you are not a member" });
    }

    if (!project.members.some((member) => (member.user._id || member.user).toString() === project.owner.toString())) {
      project.members.unshift({
        user: project.owner,
        role: "lead",
        status: "active",
        invitedBy: project.owner,
        joinedAt: project.createdAt,
      });
      await project.save();
      await project.populate("members.user", "name username email avatar bio skills");
    }

    const visibleMembers = project.members.filter(
      (member) => member.status === "active"
    );
    const memberData = await Promise.all(visibleMembers.map(async (member) => {
      const [totalTasks, completedTasks] = await Promise.all([
        Task.countDocuments({ project: project._id, assignedTo: member.user._id }),
        Task.countDocuments({ project: project._id, assignedTo: member.user._id, status: "completed" }),
      ]);

      return {
        membershipId: member._id,
        user: member.user,
        role: member.role,
        status: member.status,
        invitedAt: member.invitedAt,
        joinedAt: member.joinedAt,
        totalTasks,
        completedTasks,
      };
    }));

    return res.status(200).json({
      members: memberData,
      pending: project.owner.toString() === req.user
        ? project.members
          .filter((member) => member.status === "pending_approval" || member.status === "invited")
          .map((member) => ({
            ...member.toObject(),
            user: member.user,
          }))
        : [],
    });
  } catch (error) {
    console.error("Get project members error:", error);
    return res.status(500).json({ message: "Failed to fetch project members" });
  }
};

const inviteProjectMember = async (req, res) => {
  try {
    const identifier = req.body.identifier?.trim();
    if (!identifier) {
      return res.status(400).json({ message: "Enter a username or email address" });
    }

    const project = await Project.findOne({ _id: req.params.id, owner: req.user });
    if (!project) {
      return res.status(404).json({ message: "Only the team lead can invite members" });
    }

    const user = await User.findOne({
      $or: [
        { email: identifier.toLowerCase() },
        { username: identifier },
      ],
    });

    if (!user) {
      return res.status(404).json({ message: "No user found with that username or email" });
    }

    if (user._id.toString() === req.user) {
      return res.status(400).json({ message: "You are already the team lead" });
    }

    const existing = project.members.find((member) => member.user.toString() === user._id.toString());
    if (existing && ["active", "invited", "pending_approval"].includes(existing.status)) {
      return res.status(409).json({ message: "This user already has a membership request for the project" });
    }

    if (existing) {
      existing.status = "invited";
      existing.invitedBy = req.user;
      existing.invitedAt = new Date();
      existing.joinedAt = null;
    } else {
      project.members.push({ user: user._id, invitedBy: req.user, status: "invited" });
    }

    await project.save();
    await Activity.create({
      project: project._id,
      actor: req.user,
      action: "member_invited",
      target: user.name,
      metadata: { username: user.username },
    });
    return res.status(201).json({ message: `Invitation sent to ${user.name}`, user: { name: user.name, username: user.username } });
  } catch (error) {
    console.error("Invite project member error:", error);
    return res.status(500).json({ message: "Failed to invite project member" });
  }
};

const getMyMemberInvitations = async (req, res) => {
  try {
    const projects = await Project.find({
      members: { $elemMatch: { user: req.user, status: { $in: ["invited", "pending_approval"] } } },
    }).populate("owner", "name username email");

    const invitations = projects.map((project) => {
      const membership = project.members.find((member) => member.user.toString() === req.user);
      return { projectId: project._id, projectName: project.name, owner: project.owner, membershipId: membership._id, status: membership.status, invitedAt: membership.invitedAt };
    });

    return res.status(200).json({ invitations });
  } catch (error) {
    console.error("Get member invitations error:", error);
    return res.status(500).json({ message: "Failed to fetch member invitations" });
  }
};

const respondToMemberInvitation = async (req, res) => {
  try {
    const { action } = req.body;
    if (!['accept', 'reject'].includes(action)) {
      return res.status(400).json({ message: "Invitation action must be accept or reject" });
    }

    const project = await Project.findOne({ _id: req.params.id });
    const membership = project?.members.id(req.params.memberId);
    if (!project || !membership || membership.user.toString() !== req.user || membership.status !== "invited") {
      return res.status(404).json({ message: "Invitation not found" });
    }

    membership.status = action === "accept" ? "pending_approval" : "rejected";
    await project.save();
    if (action === "reject") {
      await Activity.create({
        project: project._id,
        actor: req.user,
        action: "member_rejected",
        target: req.user,
      });
    }
    return res.status(200).json({ message: action === "accept" ? "Request sent to the team lead" : "Invitation declined" });
  } catch (error) {
    console.error("Respond to member invitation error:", error);
    return res.status(500).json({ message: "Failed to respond to invitation" });
  }
};

const reviewMemberRequest = async (req, res) => {
  try {
    const { action } = req.body;
    if (!['approve', 'reject'].includes(action)) {
      return res.status(400).json({ message: "Review action must be approve or reject" });
    }

    const project = await Project.findOne({ _id: req.params.id, owner: req.user });
    const membership = project?.members.id(req.params.memberId);
    if (!project || !membership || membership.status !== "pending_approval") {
      return res.status(404).json({ message: "Pending member request not found" });
    }

    membership.status = action === "approve" ? "active" : "rejected";
    membership.joinedAt = action === "approve" ? new Date() : null;
    await project.save();
    await Activity.create({
      project: project._id,
      actor: membership.user,
      action: action === "approve" ? "member_joined" : "member_rejected",
      target: membership.user,
    });
    return res.status(200).json({ message: action === "approve" ? "Member approved" : "Member request rejected" });
  } catch (error) {
    console.error("Review member request error:", error);
    return res.status(500).json({ message: "Failed to review member request" });
  }
};

module.exports = {
  createProject,
  getMyProjects,
  updateProject,
  deleteProject,
  getProjectMembers,
  inviteProjectMember,
  getMyMemberInvitations,
  respondToMemberInvitation,
  reviewMemberRequest,
};
