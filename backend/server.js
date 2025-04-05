import express from "express";
import cors from "cors";
import connectDB from "./config/db.js";
import dotenv from "dotenv";
import authRoutes from "./routes/authRoutes.js";
import agentRoutes from "./routes/agentRoutes.js";
import errorHandler from "./middleware/errorHandler.js";
import taskRoutes from "./routes/taskRoutes.js";
import uploadRoutes from "./routes/uploadRoutes.js";

dotenv.config();
connectDB(); // Connect to database

const app = express();
app.use(express.json());
app.use(cors());


app.use("/api/auth", authRoutes);
app.use("/api/agents", agentRoutes);
app.use(errorHandler);
app.use("/api/tasks", taskRoutes);
app.use("/api/tasks", uploadRoutes);



const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
