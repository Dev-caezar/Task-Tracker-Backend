import { Router } from "express";
import {
  forgotPassword,
  getAllUsers,
  getOneUser,
  loginUser,
  registerUser,
  resendForgotOtp,
  resendOtp,
  resetPassword,
  verifyForgotOtp,
  verifyOtp,
} from "../controllers/users.controller.js";

const router = Router();

/**
 * @swagger
 * tags:
 *   - name: Auth
 *     description: Authentication endpoints
 *   - name: Users
 *     description: User management
 */

/**
 * @swagger
 * /users/register:
 *   post:
 *     summary: Register a new user
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - fullName
 *               - email
 *               - password
 *             properties:
 *               fullName:
 *                 type: string
 *                 example: John Doe
 *               email:
 *                 type: string
 *                 example: john@gmail.com
 *               password:
 *                 type: string
 *                 example: password123
 *     responses:
 *       201:
 *         description: User created successfully
 *       400:
 *         description: Validation error or user exists
 *       500:
 *         description: Internal server error
 */
router.post("/register", registerUser);

/**
 * @swagger
 * /verify-otp:
 *   post:
 *     summary: Verify account OTP
 *     tags: [Auth]
 */
router.post("/verify-otp", verifyOtp);

/**
 * @swagger
 * /resend-otp:
 *   post:
 *     summary: Resend verification OTP
 *     tags: [Auth]
 */
router.post("/resend-otp", resendOtp);

/**
 * @swagger
 * /login:
 *   post:
 *     summary: Login user
 *     tags: [Auth]
 */
router.post("/login", loginUser);

/**
 * @swagger
 * /forgot-password:
 *   post:
 *     summary: Send OTP for password reset
 *     tags: [Auth]
 */
router.post("/forgot-password", forgotPassword);

/**
 * @swagger
 * /verify-forgot-otp:
 *   post:
 *     summary: Verify OTP for password reset
 *     tags: [Auth]
 */
router.post("/verify-forgot-otp", verifyForgotOtp);

/**
 * @swagger
 * /resend-forgot-otp:
 *   post:
 *     summary: Resend OTP for password reset
 *     tags: [Auth]
 */
router.post("/resend-forgot-otp", resendForgotOtp);

/**
 * @swagger
 * /reset-password:
 *   post:
 *     summary: Reset user password
 *     tags: [Auth]
 */
router.post("/reset-password", resetPassword);

/**
 * @swagger
 * /allUsers:
 *   get:
 *     summary: Get all users
 *     tags: [Users]
 */
router.get("/allUsers", getAllUsers);

/**
 * @swagger
 * /{id}:
 *   get:
 *     summary: Get single user by ID
 *     tags: [Users]
 */
router.get("/:id", getOneUser);

export default router;
