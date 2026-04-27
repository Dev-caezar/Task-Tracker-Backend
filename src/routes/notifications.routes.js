import { Router } from "express";
import {
  getAllNotifications,
  getUnreadNotifications,
  markAsRead,
  markAllAsRead,
  deleteOneNotification,
  deleteAllNotifications,
} from "../controllers/notifications.controller.js";
import { authenciateUser } from "../middleware/auth.js";

const router = Router();

/**
 * @swagger
 * /notifications:
 *   get:
 *     summary: Get all notifications for logged-in user
 *     tags: [Notifications]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *     responses:
 *       200:
 *         description: Notifications retrieved successfully
 *         content:
 *           application/json:
 *             example:
 *               message: Notifications retrieved successfully
 *               data:
 *                 notifications:
 *                   - _id: "notifId123"
 *                     taskId: "taskId456"
 *                     type: "CREATED"
 *                     message: "Task created"
 *                     isRead: false
 *                     createdAt: "2026-04-27T10:00:00Z"
 *                 totalCount: 5
 *                 totalPages: 1
 *                 currentPage: 1
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal server error
 */
router.get("/", authenciateUser, getAllNotifications);

/**
 * @swagger
 * /notifications/unread:
 *   get:
 *     summary: Get unread notifications
 *     tags: [Notifications]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Unread notifications retrieved successfully
 *         content:
 *           application/json:
 *             example:
 *               message: Unread notifications retrieved successfully
 *               data:
 *                 - _id: "notifId123"
 *                   taskId: "taskId456"
 *                   type: "NEAR_DUE"
 *                   message: "Task due soon"
 *                   isRead: false
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal server error
 */
router.get("/unread", authenciateUser, getUnreadNotifications);

/**
 * @swagger
 * /notifications/{notificationId}/read:
 *   patch:
 *     summary: Mark notification as read
 *     tags: [Notifications]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: notificationId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Notification marked as read
 *       404:
 *         description: Notification not found
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal server error
 */
router.patch("/:notificationId/read", authenciateUser, markAsRead);

/**
 * @swagger
 * /notifications/read/all:
 *   patch:
 *     summary: Mark all notifications as read
 *     tags: [Notifications]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: All notifications marked as read
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal server error
 */
router.patch("/read/all", authenciateUser, markAllAsRead);

/**
 * @swagger
 * /notifications/{notificationId}:
 *   delete:
 *     summary: Delete a notification
 *     tags: [Notifications]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: notificationId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Notification deleted successfully
 *       404:
 *         description: Notification not found
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal server error
 */
router.delete("/:notificationId", authenciateUser, deleteOneNotification);

/**
 * @swagger
 * /notifications/delete/all:
 *   delete:
 *     summary: Delete all notifications for user
 *     tags: [Notifications]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: All notifications deleted successfully
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal server error
 */
router.delete("/delete/all", authenciateUser, deleteAllNotifications);

export default router;
