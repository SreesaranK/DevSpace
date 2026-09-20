const mongoose = require("mongoose");

const projectSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },

    description: {
      type: String,
      default: "",
    },

    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    members: [
      {
        user: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
          required: true,
        },
        role: {
          type: String,
          enum: ["lead", "member"],
          default: "member",
        },
        status: {
          type: String,
          enum: ["invited", "pending_approval", "active", "rejected"],
          default: "invited",
        },
        invitedBy: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
          required: true,
        },
        invitedAt: {
          type: Date,
          default: Date.now,
        },
        joinedAt: {
          type: Date,
          default: null,
        },
      },
    ],

    status: {
      type: String,
      enum: ["active", "completed", "archived"],
      default: "active",
    },
  },
  {
    timestamps: true,
  }
);

const Project = mongoose.model("Project", projectSchema);

module.exports = Project;
