import fs from "fs";
import csvParser from "csv-parser";
import xlsx from "xlsx";
import Task from "../models/Task.js";
import Agent from "../models/Agent.js";

// Function to Parse CSV File
const parseCSV = (filePath) => {
  return new Promise((resolve, reject) => {
    const results = [];
    fs.createReadStream(filePath)
      .pipe(csvParser())
      .on("data", (data) => results.push(data))
      .on("end", () => resolve(results))
      .on("error", (err) => reject(err));
  });
};

// Function to Parse Excel File
const parseExcel = (filePath) => {
  const workbook = xlsx.readFile(filePath);
  const sheetName = workbook.SheetNames[0];
  return xlsx.utils.sheet_to_json(workbook.Sheets[sheetName]);
};

// **Upload and Distribute Tasks**
export const uploadCSV = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "No file uploaded" });
    }

    const filePath = req.file.path;
    let tasks;

    // Determine file type
    if (filePath.endsWith(".csv")) {
      tasks = await parseCSV(filePath);
    } else {
      tasks = parseExcel(filePath);
    }

    if (!tasks || tasks.length === 0) {
      return res.status(400).json({ message: "Invalid file or empty data" });
    }

    // Validate required fields
    const invalidTasks = tasks.filter(task => !task.FirstName || !task.Phone);
    if (invalidTasks.length > 0) {
      return res.status(400).json({ 
        message: "Invalid data format. FirstName and Phone are required fields.",
        invalidRows: invalidTasks
      });
    }

    // Get exactly 5 agents
    const agents = await Agent.find().limit(5);
    if (agents.length !== 5) {
      return res.status(400).json({ message: "Exactly 5 agents are required for task distribution" });
    }

    // Calculate distribution
    const totalTasks = tasks.length;
    const baseTasksPerAgent = Math.floor(totalTasks / 5);
    const remainingTasks = totalTasks % 5;

    // Distribute tasks
    const distributedTasks = [];
    let currentAgentIndex = 0;
    let tasksAssigned = 0;

    tasks.forEach((task, index) => {
      // Calculate how many tasks this agent should get
      let tasksForThisAgent = baseTasksPerAgent;
      if (currentAgentIndex < remainingTasks) {
        tasksForThisAgent += 1;
      }

      // Assign task to current agent
      distributedTasks.push({
        firstName: task.FirstName,
        phone: task.Phone,
        notes: task.Notes || "",
        assignedTo: agents[currentAgentIndex]._id,
        assignedAt: new Date()
      });

      tasksAssigned++;
      
      // Move to next agent if current agent has received their share
      if (tasksAssigned >= tasksForThisAgent) {
        currentAgentIndex++;
        tasksAssigned = 0;
      }
    });

    // Save to database
    await Task.insertMany(distributedTasks);
    
    // Cleanup file after processing
    fs.unlinkSync(filePath);

    res.json({ 
      message: "File processed and tasks distributed successfully",
      distribution: {
        totalTasks,
        tasksPerAgent: baseTasksPerAgent,
        agentsWithExtraTasks: remainingTasks
      }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getTasks = async (req, res) => {
  try {
    const tasks = await Task.find().populate("assignedTo", "name email");
    res.json(tasks);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getTaskStats = async (req, res) => {
  try {
    // Get total number of agents
    const totalAgents = await Agent.countDocuments();

    // Get total number of tasks
    const totalTasks = await Task.countDocuments();

    // Get tasks per agent
    const tasksPerAgent = await Task.aggregate([
      {
        $group: {
          _id: "$assignedTo",
          count: { $sum: 1 }
        }
      },
      {
        $lookup: {
          from: "agents",
          localField: "_id",
          foreignField: "_id",
          as: "agent"
        }
      },
      {
        $unwind: "$agent"
      },
      {
        $project: {
          agentName: "$agent.name",
          taskCount: "$count"
        }
      }
    ]);

    res.json({
      totalAgents,
      totalTasks,
      tasksPerAgent
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const clearAllTasks = async (req, res) => {
  try {
    // Delete all tasks
    const result = await Task.deleteMany({});
    
    res.json({ 
      message: "All tasks cleared successfully",
      deletedCount: result.deletedCount
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getAgentTasks = async (req, res) => {
  try {
    const { agentId } = req.params;
    
    // Validate agentId
    if (!agentId) {
      return res.status(400).json({ message: "Agent ID is required" });
    }

    // Get tasks for the specific agent
    const tasks = await Task.find({ assignedTo: agentId })
      .select('firstName phone notes assignedAt completed completedAt')
      .sort({ assignedAt: -1 });

    // Calculate completion statistics
    const totalTasks = tasks.length;
    const completedTasks = tasks.filter(task => task.completed).length;
    const completionPercentage = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

    res.json({
      tasks,
      stats: {
        totalTasks,
        completedTasks,
        completionPercentage
      }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const markTaskCompleted = async (req, res) => {
  try {
    const { taskId } = req.params;
    
    // Validate taskId
    if (!taskId) {
      return res.status(400).json({ message: "Task ID is required" });
    }

    // Update the task
    const task = await Task.findByIdAndUpdate(
      taskId,
      { 
        completed: true,
        completedAt: new Date()
      },
      { new: true }
    );

    if (!task) {
      return res.status(404).json({ message: "Task not found" });
    }

    res.json(task);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
