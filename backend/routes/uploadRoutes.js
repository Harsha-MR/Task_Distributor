import express from "express";
import { uploadCSV } from "../controllers/uploadController.js";
import protect from "../middleware/authMiddleware.js";

const router = express.Router();

router.post("/upload", protect, uploadCSV);

export default router;
