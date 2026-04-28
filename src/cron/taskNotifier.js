import cron from "node-cron";
import tasks from "../models/tasks.js";
import { Notification } from "../models/notification.js";

export const startTaskNotifier = () => {
  cron.schedule("* * * * *", async () => {
    console.log("checking for tasks");

    const now = new Date();
    const overdueTasks = await tasks.find({
      dueDate: { $lt: now },
      status: { $ne: "completed" },
      notifiedOverdue: false,
    });

    for (const task of overdueTasks) {
      console.log("Overdue:", task.title);

      await Notification.create({
        user: task.user,
        type: "overdue",
        message: `Task "${task.title}" is overdue`,
        task: task._id,
      });

      task.notifiedOverdue = true;
      await task.save();
    }

    const nextMinute = new Date(now.getTime() + 60 * 1000);

    const upcomingTasks = await tasks.find({
      dueDate: { $gte: now, $lte: nextMinute },
      status: { $ne: "completed" },
      notifiedUpcoming: false,
    });

    for (const task of upcomingTasks) {
      console.log("Upcoming:", task.title);

      await Notification.create({
        user: task.user,
        type: "upcoming",
        message: `Task "${task.title}" is due soon`,
        task: task._id,
      });

      task.notifiedUpcoming = true;
      await task.save();
    }
  });
};
