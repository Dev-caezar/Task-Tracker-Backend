import cron from "node-cron";
import Task from "../models/tasks.js";
import Notification from "../models/notifications.js";
import { emitTaskNotification } from "./notificationService.js";

let schedulerTasks = [];

/**
 * Check for tasks that are near due (within 24 hours)
 * and send notifications to the task owner
 */
const checkNearDueTasks = async () => {
  try {
    const now = new Date();
    const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);

    // Find tasks that are due within next 24 hours and not completed
    const nearDueTasks = await Task.find({
      dueDate: {
        $gte: now,
        $lte: tomorrow,
      },
      status: { $ne: "completed" },
    });

    console.log(`[v0] Checking near-due tasks: found ${nearDueTasks.length} tasks`);

    for (const task of nearDueTasks) {
      // Check if notification already exists for this task
      const existingNotification = await Notification.findOne({
        taskId: task._id,
        type: "NEAR_DUE",
      });

      if (!existingNotification) {
        const message = `Task "${task.title}" is due in less than 24 hours`;

        await emitTaskNotification(
          task.user,
          task._id,
          "NEAR_DUE",
          "task:near-due",
          message,
          {
            title: task.title,
            dueDate: task.dueDate,
            priority: task.priority,
            status: task.status,
          }
        );

        console.log(`[v0] Near-due notification sent for task: ${task._id}`);
      }
    }
  } catch (error) {
    console.error("[v0] Error checking near-due tasks:", error);
  }
};

/**
 * Check for overdue tasks and send notifications to the task owner
 */
const checkOverdueTasks = async () => {
  try {
    const now = new Date();

    // Find tasks that are past due date and not completed
    const overdueTasks = await Task.find({
      dueDate: { $lt: now },
      status: { $ne: "completed" },
    });

    console.log(`[v0] Checking overdue tasks: found ${overdueTasks.length} tasks`);

    for (const task of overdueTasks) {
      // Check if notification already exists for this task
      const existingNotification = await Notification.findOne({
        taskId: task._id,
        type: "OVERDUE",
      });

      if (!existingNotification) {
        const daysOverdue = Math.floor(
          (now - new Date(task.dueDate)) / (1000 * 60 * 60 * 24)
        );

        const message =
          daysOverdue === 0
            ? `Task "${task.title}" is now overdue`
            : `Task "${task.title}" is ${daysOverdue} day(s) overdue`;

        await emitTaskNotification(
          task.user,
          task._id,
          "OVERDUE",
          "task:overdue",
          message,
          {
            title: task.title,
            dueDate: task.dueDate,
            priority: task.priority,
            status: task.status,
          }
        );

        console.log(`[v0] Overdue notification sent for task: ${task._id}`);
      }
    }
  } catch (error) {
    console.error("[v0] Error checking overdue tasks:", error);
  }
};

/**
 * Initialize the task notification scheduler
 * Runs check every minute
 */
export const initializeTaskScheduler = () => {
  try {
    console.log("[v0] Initializing task notification scheduler...");

    // Run every minute (* * * * *)
    const checkJob = cron.schedule("* * * * *", async () => {
      console.log("[v0] Running task notification checks...");
      await checkNearDueTasks();
      await checkOverdueTasks();
    });

    schedulerTasks.push(checkJob);

    console.log("[v0] Task notification scheduler initialized successfully");
  } catch (error) {
    console.error("[v0] Error initializing scheduler:", error);
  }
};

/**
 * Stop the scheduler (useful for graceful shutdown)
 */
export const stopTaskScheduler = () => {
  try {
    schedulerTasks.forEach((task) => {
      task.stop();
    });
    schedulerTasks = [];
    console.log("[v0] Task notification scheduler stopped");
  } catch (error) {
    console.error("[v0] Error stopping scheduler:", error);
  }
};

export default {
  initializeTaskScheduler,
  stopTaskScheduler,
};
