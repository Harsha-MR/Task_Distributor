import express from "express";
import { uploadTasks, getTasks, getTaskStats, clearAllTasks, getAgentTasks, markTaskCompleted } from "../controllers/taskController.js";
import upload from "../middleware/uploadMiddleware.js";
import protect from "../middleware/authMiddleware.js";

const router = express.Router();

router.get("/", protect, getTasks);
router.get("/stats", protect, getTaskStats);
router.post("/upload", protect, upload.single("file"), uploadTasks);
router.delete("/clear", protect, clearAllTasks);
router.get("/agent/:agentId", protect, getAgentTasks);
router.patch("/task/:taskId/complete", protect, markTaskCompleted);

export default router;
