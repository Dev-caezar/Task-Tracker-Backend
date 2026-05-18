import { Router } from "express";
import { authenciateUser } from "../middleware/auth.js";
import { getAllNotifications } from "../controllers/notification.controller.js";

const router = Router();

/**
 * @swagger
 * /notifications:
 *   get:
 *     summary: Get all notifications for the authenticated user
 *     tags:
 *       - Notifications
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Notifications retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Notifications retrieved successfully
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       _id:
 *                         type: string
 *                         example: 6a0a9fa044ca709f2319e4de
 *                       user:
 *                         type: string
 *                         example: 69f0f82618fb5b8d46a51993
 *                       type:
 *                         type: string
 *                         enum:
 *                           - overdue
 *                           - upcoming
 *                           - created
 *                         example: overdue
 *                       message:
 *                         type: string
 *                         example: Task "Test my notification system" is overdue
 *                       task:
 *                         type: string
 *                         example: 6a0a2d0f06e54826ce80c64e
 *                       isRead:
 *                         type: boolean
 *                         example: false
 *                       createdAt:
 *                         type: string
 *                         format: date-time
 *                         example: 2026-05-18T05:12:00.291Z
 *                       updatedAt:
 *                         type: string
 *                         format: date-time
 *                         example: 2026-05-18T05:12:00.291Z
 *                       __v:
 *                         type: number
 *                         example: 0
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal server error
 */
router.get("/", authenciateUser, getAllNotifications);

export default router;
