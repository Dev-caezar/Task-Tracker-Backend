import { io } from "../index.js";
import tasks from "../models/tasks.js";

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

    io.to(req.user.id).emit("task:created", {
      message: "Task created successfully",
      task,
    });

    res.status(201).json({
      message: "Task created successfully",
      data: task,
    });
  } catch (error) {
    res.status(500).json({
      message: "Internal server error",
      error: error.message,
    });
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
        tasks: userTasks.map((task) => ({
          id: task._id,
          title: task.title,
          description: task.description,
          status: task.status,
          priority: task.priority,
          dueDate: task.dueDate,
        })),
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

    if (task.user.toString() !== req.user.id) {
      return res.status(403).json({
        message: "Unauthorized to delete this task",
      });
    }

    await tasks.findByIdAndDelete(id);
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
