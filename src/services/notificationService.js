import Notification from "../models/notifications.js";
import { getIO } from "../socket/index.js";

/**
 * Create a notification in the database
 */
export const createNotification = async (userId, taskId, type, message, taskData) => {
  try {
    const notification = await Notification.create({
      userId,
      taskId,
      type,
      message,
      task: taskData,
    });

    console.log("[v0] Notification created:", notification._id);
    return notification;
  } catch (error) {
    console.error("[v0] Error creating notification:", error);
    throw error;
  }
};

/**
 * Broadcast notification to a specific user via Socket.IO
 */
export const broadcastNotificationToUser = (userId, eventType, notificationData) => {
  try {
    const io = getIO();
    const roomName = `user:${userId}`;

    // Emit the notification to the user's room
    io.to(roomName).emit(eventType, notificationData);

    console.log(`[v0] Notification broadcasted to ${roomName}:`, eventType);
  } catch (error) {
    console.error("[v0] Error broadcasting notification:", error);
  }
};

/**
 * Create and broadcast a task notification
 */
export const emitTaskNotification = async (
  userId,
  taskId,
  notificationType,
  eventType,
  message,
  taskData
) => {
  try {
    // Save notification to database
    const notification = await createNotification(
      userId,
      taskId,
      notificationType,
      message,
      taskData
    );

    // Broadcast to user in real-time
    broadcastNotificationToUser(userId, eventType, {
      _id: notification._id,
      taskId,
      type: notificationType,
      message,
      task: taskData,
      createdAt: notification.createdAt,
    });

    return notification;
  } catch (error) {
    console.error("[v0] Error emitting task notification:", error);
    throw error;
  }
};

/**
 * Get user's unread notifications
 */
export const getUserUnreadNotifications = async (userId) => {
  try {
    const notifications = await Notification.find({
      userId,
      isRead: false,
    })
      .sort({ createdAt: -1 })
      .limit(50);

    return notifications;
  } catch (error) {
    console.error("[v0] Error fetching unread notifications:", error);
    throw error;
  }
};

/**
 * Get all user notifications with pagination
 */
export const getUserNotifications = async (userId, page = 1, limit = 20) => {
  try {
    const skip = (page - 1) * limit;

    const [notifications, totalCount] = await Promise.all([
      Notification.find({ userId })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      Notification.countDocuments({ userId }),
    ]);

    return {
      notifications,
      totalCount,
      totalPages: Math.ceil(totalCount / limit),
      currentPage: page,
    };
  } catch (error) {
    console.error("[v0] Error fetching user notifications:", error);
    throw error;
  }
};

/**
 * Mark notification as read
 */
export const markNotificationAsRead = async (notificationId) => {
  try {
    const notification = await Notification.findByIdAndUpdate(
      notificationId,
      { isRead: true },
      { new: true }
    );

    return notification;
  } catch (error) {
    console.error("[v0] Error marking notification as read:", error);
    throw error;
  }
};

/**
 * Mark all notifications as read for a user
 */
export const markAllNotificationsAsRead = async (userId) => {
  try {
    const result = await Notification.updateMany(
      { userId, isRead: false },
      { isRead: true }
    );

    return result;
  } catch (error) {
    console.error("[v0] Error marking all notifications as read:", error);
    throw error;
  }
};

/**
 * Delete a notification
 */
export const deleteNotification = async (notificationId) => {
  try {
    const result = await Notification.findByIdAndDelete(notificationId);
    return result;
  } catch (error) {
    console.error("[v0] Error deleting notification:", error);
    throw error;
  }
};

/**
 * Delete all notifications for a user
 */
export const deleteAllUserNotifications = async (userId) => {
  try {
    const result = await Notification.deleteMany({ userId });
    return result;
  } catch (error) {
    console.error("[v0] Error deleting user notifications:", error);
    throw error;
  }
};

export default {
  createNotification,
  broadcastNotificationToUser,
  emitTaskNotification,
  getUserUnreadNotifications,
  getUserNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  deleteNotification,
  deleteAllUserNotifications,
};
