import { Router } from "express";
import {
  createTask,
  deleteTask,
  getOneTask,
  getTaskOverview,
  getUserTasks,
  updateTask,
} from "../controllers/tasks.controller.js";
import { authenciateUser } from "../middleware/auth.js";

const router = Router();

/**
 * @swagger
 * /tasks/create:
 *   post:
 *     summary: Create a new task
 *     tags: [Tasks]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - title
 *               - description
 *               - priority
 *               - dueDate
 *             properties:
 *               title:
 *                 type: string
 *                 example: Build Task API
 *               description:
 *                 type: string
 *                 example: Implement CRUD operations for tasks
 *               status:
 *                 type: string
 *                 enum: [pending, in-progress, completed]
 *                 example: pending
 *               priority:
 *                 type: string
 *                 enum: [low, medium, high]
 *                 example: high
 *               dueDate:
 *                 type: string
 *                 format: date
 *                 example: 2026-05-01
 *     responses:
 *       201:
 *         description: Task created successfully
 *         content:
 *           application/json:
 *             example:
 *               message: Task created successfully
 *               data:
 *                 _id: "taskId123"
 *                 title: "Build Task API"
 *                 status: "pending"
 *       400:
 *         description: Missing required fields
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal server error
 */
router.post("/create", authenciateUser, createTask);

/**
 * @swagger
 * /tasks/:
 *   get:
 *     summary: Get all tasks for logged-in user
 *     tags: [Tasks]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Tasks retrieved successfully
 *         content:
 *           application/json:
 *             example:
 *               message: Tasks retrieved successfully
 *               data:
 *                 - _id: "task1"
 *                   title: "Build API"
 *                   status: "pending"
 *       404:
 *         description: No tasks found for this user
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal server error
 */
router.get("/", authenciateUser, getUserTasks);

/**
 * @swagger
 * /tasks/overview:
 *   get:
 *     summary: Get task analytics overview
 *     tags: [Tasks]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Task overview retrieved successfully
 *         content:
 *           application/json:
 *             example:
 *               message: Task overview retrieved successfully
 *               data:
 *                 totalTasks: 10
 *                 pendingTasks: 4
 *                 inProgressTasks: 3
 *                 completedTasks: 3
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal server error
 */
router.get("/overview", authenciateUser, getTaskOverview);

/**
 * @swagger
 * /tasks/{id}:
 *   get:
 *     summary: Get a single task by ID
 *     tags: [Tasks]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: Task ID
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Task retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 data:
 *                   $ref: '#/components/schemas/Task'
 *             example:
 *               message: Task retrieved successfully
 *               data:
 *                 _id: "69eb9d38ccd45a19f8834318"
 *                 title: "Build Task API"
 *                 description: "Implement CRUD operations for tasks"
 *                 status: "pending"
 *                 priority: "high"
 *                 dueDate: "2026-05-01T00:00:00.000Z"
 *       401:
 *         description: Unauthorized (missing or invalid token)
 *       403:
 *         description: Unauthorized to access this task
 *       404:
 *         description: Task not found
 *       500:
 *         description: Internal server error
 */
router.get("/:id", authenciateUser, getOneTask);

/**
 * @swagger
 * /tasks/{id}:
 *   patch:
 *     summary: Update a task
 *     tags: [Tasks]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: false
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *               description:
 *                 type: string
 *               status:
 *                 type: string
 *                 enum: [pending, in-progress, completed]
 *               priority:
 *                 type: string
 *               dueDate:
 *                 type: string
 *     responses:
 *       200:
 *         description: Task updated successfully
 *       403:
 *         description: Unauthorized to update this task
 *       404:
 *         description: Task not found
 *       401:
 *         description: Unauthorized
 */
router.patch("/:id", authenciateUser, updateTask);

/**
 * @swagger
 * /tasks/{id}:
 *   delete:
 *     summary: Delete a task
 *     tags: [Tasks]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: Task ID to delete
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Task deleted successfully
 *         content:
 *           application/json:
 *             example:
 *               message: Task deleted successfully
 *       400:
 *         description: Invalid task ID
 *       401:
 *         description: Unauthorized (no token or invalid token)
 *       403:
 *         description: Unauthorized to delete this task
 *       404:
 *         description: Task not found
 *       500:
 *         description: Internal server error
 */
router.delete("/:id", authenciateUser, deleteTask);

export default router;
