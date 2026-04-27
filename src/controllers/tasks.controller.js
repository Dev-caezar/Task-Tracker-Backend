import tasks from "../models/tasks.js";
import { emitTaskNotification } from "../services/notificationService.js";
import { getIO } from "../socket/index.js";

export const createTask = async (req, res) => {
  try {
    const { title, description, status, priority, dueDate } = req.body;

    if (!title || !description || !priority || !dueDate) {
      return res.status(400).json({ message: "All fields are required" });
    }

    const task = await tasks.create({
      title,
      description,
      status,
      priority,
      dueDate,
      user: req.user.id,
    });

    // Emit task creation notification via WebSocket
    try {
      const message = `Task "${title}" has been created`;
      await emitTaskNotification(
        req.user.id,
        task._id,
        "CREATED",
        "task:created",
        message,
        {
          title: task.title,
          description: task.description,
          dueDate: task.dueDate,
          priority: task.priority,
          status: task.status,
        }
      );

      // Broadcast real-time event to user
      const io = getIO();
      io.to(`user:${req.user.id}`).emit("task:created-realtime", {
        _id: task._id,
        title: task.title,
        description: task.description,
        dueDate: task.dueDate,
        priority: task.priority,
        status: task.status,
        message: message,
      });
    } catch (notificationError) {
      console.error("[v0] Error emitting task creation notification:", notificationError);
      // Don't fail the response if notification fails
    }

    res.status(201).json({
      message: "Task created successfully",
      data: task,
    });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Internal server error", error: error.message });
  }
};

export const getUserTasks = async (req, res) => {
  try {
    const userTask = await tasks.find({ user: req.user.id });

    if (userTask.length === 0) {
      return res.status(404).json({ message: "No tasks found for this user" });
    }

    res.status(200).json({
      message: "Tasks retrieved successfully",
      data: userTask,
    });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Internal server error", error: error.message });
  }
};

export const getOneTask = async (req, res) => {
  try {
    const { id } = req.params;

    const task = await tasks.findById(id);

    if (!task) {
      return res.status(404).json({
        message: "Task not found",
      });
    }

    // 🔐 Ensure user can only access their own task
    if (task.user.toString() !== req.user.id) {
      return res.status(403).json({
        message: "Unauthorized to access this task",
      });
    }

    res.status(200).json({
      message: "Task retrieved successfully",
      data: task,
    });
  } catch (error) {
    res.status(500).json({
      message: "Internal server error",
      error: error.message,
    });
  }
};

export const updateTask = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, description, status, priority, dueDate } = req.body;
    const task = await tasks.findById(id);

    if (!task) {
      return res.status(404).json({ message: "Task not found" });
    }

    if (task.user.toString() !== req.user.id) {
      return res
        .status(403)
        .json({ message: "Unauthorized to update this task" });
    }

    task.title = title || task.title;
    task.description = description || task.description;
    task.status = status || task.status;
    task.priority = priority || task.priority;
    task.dueDate = dueDate || task.dueDate;
    await task.save();

    // Emit real-time update event via WebSocket
    try {
      const io = getIO();
      io.to(`user:${req.user.id}`).emit("task:updated", {
        _id: task._id,
        title: task.title,
        description: task.description,
        dueDate: task.dueDate,
        priority: task.priority,
        status: task.status,
        message: `Task "${task.title}" has been updated`,
      });
    } catch (notificationError) {
      console.error("[v0] Error emitting task update notification:", notificationError);
      // Don't fail the response if notification fails
    }

    res.status(200).json({
      message: "Task updated successfully",
      data: task,
    });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Internal server error", error: error.message });
  }
};

export const getTaskOverview = async (req, res) => {
  try {
    const userTasks = await tasks.find({ user: req.user.id });
    const totalTasks = userTasks.length;
    const pendingTasks = userTasks.filter(
      (task) => task.status === "pending",
    ).length;
    const inProgressTasks = userTasks.filter(
      (task) => task.status === "in-progress",
    ).length;
    const completedTasks = userTasks.filter(
      (task) => task.status === "completed",
    ).length;
    res.status(200).json({
      message: "Task overview retrieved successfully",
      data: {
        totalTasks,
        pendingTasks,
        inProgressTasks,
        completedTasks,
      },
    });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Internal server error", error: error.message });
  }
};

export const deleteTask = async (req, res) => {
  try {
    const { id } = req.params;

    const task = await tasks.findById(id);

    if (!task) {
      return res.status(404).json({
        message: "Task not found",
      });
    }

    // 🔐 ensure only owner can delete
    if (task.user.toString() !== req.user.id) {
      return res.status(403).json({
        message: "Unauthorized to delete this task",
      });
    }

    const taskTitle = task.title;
    await tasks.findByIdAndDelete(id);

    // Emit real-time deletion event via WebSocket
    try {
      const io = getIO();
      io.to(`user:${req.user.id}`).emit("task:deleted", {
        _id: id,
        message: `Task "${taskTitle}" has been deleted`,
      });
    } catch (notificationError) {
      console.error("[v0] Error emitting task deletion notification:", notificationError);
      // Don't fail the response if notification fails
    }

    res.status(200).json({
      message: "Task deleted successfully",
    });
  } catch (error) {
    res.status(500).json({
      message: "Internal server error",
      error: error.message,
    });
  }
};
