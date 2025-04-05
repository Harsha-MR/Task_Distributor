import multer from "multer";
import csv from "csv-parser";
import fs from "fs";
import Agent from "../models/Agent.js";
import Task from "../models/Task.js";

// Multer Configuration - Upload only CSV/XLSX files
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, "uploads/"),
  filename: (req, file, cb) => cb(null, Date.now() + "-" + file.originalname),
});
const upload = multer({
  storage,
  fileFilter: (req, file, cb) => {
    if (!["text/csv", "application/vnd.ms-excel"].includes(file.mimetype)) {
      return cb(new Error("Only CSV/XLSX files allowed"), false);
    }
    cb(null, true);
  },
}).single("file");
 
// Process CSV File
export const uploadCSV = async (req, res) => {
  try {
    upload(req, res, async (err) => {
      if (err) return res.status(400).json({ message: err.message });

      if (!req.file) return res.status(400).json({ message: "No file uploaded" });

      const tasks = [];
      fs.createReadStream(req.file.path)
        .pipe(csv())
        .on("data", (row) => {
          console.log(row);
          
          if (!row.FirstName || !row.Phone) {
            return res.status(400).json({ message: "Invalid CSV format" });
          }
          tasks.push({ firstName: row.FirstName, phone: row.Phone, notes: row.Notes || "" });
        }) 
        .on("end", async () => {
          if (tasks.length === 0) return res.status(400).json({ message: "Empty CSV" });

          // Distribute tasks among agents
          const agents = await Agent.find();
          if (agents.length < 5) return res.status(400).json({ message: "At least 5 agents required" });

          const distributedTasks = distributeTasks(tasks, agents);
          await Task.insertMany(distributedTasks);

          res.status(200).json({ message: "File processed and tasks assigned" });
        });
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Distribute tasks equally among agents
const distributeTasks = (tasks, agents) => {
  const result = [];
  let agentIndex = 0;

  tasks.forEach((task, index) => {
    result.push({ ...task, assignedTo: agents[agentIndex]._id });
    agentIndex = (agentIndex + 1) % agents.length;
  });

  return result;
};
