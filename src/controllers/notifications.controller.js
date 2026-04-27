import {
  getUserNotifications,
  getUserUnreadNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  deleteNotification,
  deleteAllUserNotifications,
} from "../services/notificationService.js";

/**
 * Get all notifications for logged-in user
 */
export const getAllNotifications = async (req, res) => {
  try {
    const page = req.query.page ? parseInt(req.query.page) : 1;
    const limit = req.query.limit ? parseInt(req.query.limit) : 20;

    const result = await getUserNotifications(req.user.id, page, limit);

    res.status(200).json({
      message: "Notifications retrieved successfully",
      data: result,
    });
  } catch (error) {
    res.status(500).json({
      message: "Internal server error",
      error: error.message,
    });
  }
};

/**
 * Get unread notifications for logged-in user
 */
export const getUnreadNotifications = async (req, res) => {
  try {
    const notifications = await getUserUnreadNotifications(req.user.id);

    res.status(200).json({
      message: "Unread notifications retrieved successfully",
      data: notifications,
    });
  } catch (error) {
    res.status(500).json({
      message: "Internal server error",
      error: error.message,
    });
  }
};

/**
 * Mark notification as read
 */
export const markAsRead = async (req, res) => {
  try {
    const { notificationId } = req.params;

    const notification = await markNotificationAsRead(notificationId);

    if (!notification) {
      return res.status(404).json({
        message: "Notification not found",
      });
    }

    res.status(200).json({
      message: "Notification marked as read",
      data: notification,
    });
  } catch (error) {
    res.status(500).json({
      message: "Internal server error",
      error: error.message,
    });
  }
};

/**
 * Mark all notifications as read
 */
export const markAllAsRead = async (req, res) => {
  try {
    const result = await markAllNotificationsAsRead(req.user.id);

    res.status(200).json({
      message: "All notifications marked as read",
      data: result,
    });
  } catch (error) {
    res.status(500).json({
      message: "Internal server error",
      error: error.message,
    });
  }
};

/**
 * Delete a notification
 */
export const deleteOneNotification = async (req, res) => {
  try {
    const { notificationId } = req.params;

    const notification = await deleteNotification(notificationId);

    if (!notification) {
      return res.status(404).json({
        message: "Notification not found",
      });
    }

    res.status(200).json({
      message: "Notification deleted successfully",
    });
  } catch (error) {
    res.status(500).json({
      message: "Internal server error",
      error: error.message,
    });
  }
};

/**
 * Delete all notifications for user
 */
export const deleteAllNotifications = async (req, res) => {
  try {
    const result = await deleteAllUserNotifications(req.user.id);

    res.status(200).json({
      message: "All notifications deleted successfully",
      data: result,
    });
  } catch (error) {
    res.status(500).json({
      message: "Internal server error",
      error: error.message,
    });
  }
};

export default {
  getAllNotifications,
  getUnreadNotifications,
  markAsRead,
  markAllAsRead,
  deleteOneNotification,
  deleteAllNotifications,
};
