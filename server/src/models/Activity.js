const mongoose = require("mongoose");

const activitySchema = new mongoose.Schema(
  {
    project: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Project",
      required: true,
    },
    actor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    action: {
      type: String,
      enum: [
        "task_created",
        "task_updated",
        "task_completed",
        "task_reopened",
        "task_deleted",
        "member_invited",
        "member_joined",
        "member_rejected",
      ],
      required: true,
    },
    target: {
      type: String,
      default: "",
    },
    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
  },
  { timestamps: true }
);

activitySchema.index({ project: 1, createdAt: -1 });

module.exports = mongoose.model("Activity", activitySchema);