import { Router } from "express";
import { getAllUsers, getOneUser, loginUser, registerUser } from "../controllers/users.controller.js";

const router = Router();

router.route("/register").post(registerUser);
router.route("/login").post(loginUser);
router.route("/allUsers").get(getAllUsers);
router.route("/:id").get(getOneUser);

export default router
