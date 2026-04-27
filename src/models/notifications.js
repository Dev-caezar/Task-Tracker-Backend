import mongoose from "mongoose";

const notificationSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Users",
      required: true,
      index: true,
    },

    taskId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Task",
      required: true,
      index: true,
    },

    type: {
      type: String,
      enum: ["CREATED", "NEAR_DUE", "OVERDUE"],
      required: true,
    },

    message: {
      type: String,
      required: true,
    },

    isRead: {
      type: Boolean,
      default: false,
    },

    task: {
      title: String,
      dueDate: Date,
      priority: String,
      status: String,
    },
  },
  { timestamps: true }
);

export default mongoose.model("Notification", notificationSchema);
