import express from "express";
// import { loginAdmin } from "../controllers/authController.js";
import { registerAdmin, registerAgent, loginUser } from "../controllers/authController.js";
import protect from "../middleware/authMiddleware.js";

const router = express.Router();

router.post("/register/admin", registerAdmin);
router.post("/register/agent", protect, registerAgent); //  Only Admins
router.post("/login", loginUser);

export default router;
