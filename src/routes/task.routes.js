import { Router } from "express";
import { createTask, getTaskOverview, getUserTasks } from "../controllers/tasks.controller.js";
import { authenciateUser } from "../middleware/auth.js";

const router = Router();

router.post("/create", authenciateUser, createTask)
router.get("/", authenciateUser, getUserTasks)
router.get("/overview", authenciateUser, getTaskOverview)

export default router;