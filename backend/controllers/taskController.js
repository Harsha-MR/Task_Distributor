import fs from "fs";
import csvParser from "csv-parser";
import xlsx from "xlsx";
import Task from "../models/Task.js";
import Agent from "../models/Agent.js";
import path from "path";

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

// Function to distribute tasks among agents
const distributeTasks = (tasks, agents, adminId) => {
  // Filter agents to ensure they belong to the specific admin
  const adminAgents = agents.filter(agent => agent.adminId.toString() === adminId.toString());
  
  if (adminAgents.length === 0) {
    throw new Error('No agents found for this admin');
  }

  const totalTasks = tasks.length;
  const baseTasksPerAgent = Math.floor(totalTasks / adminAgents.length);
  const remainingTasks = totalTasks % adminAgents.length;

  const distributedTasks = [];
  let currentAgentIndex = 0;
  let tasksAssigned = 0;

  tasks.forEach((task) => {
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
      assignedTo: adminAgents[currentAgentIndex]._id,
      adminId: adminId,
      assignedAt: new Date()
    });

    tasksAssigned++;
    
    // Move to next agent if current agent has received their share
    if (tasksAssigned >= tasksForThisAgent) {
      currentAgentIndex++;
      tasksAssigned = 0;
    }
  });

  return {
    tasks: distributedTasks,
    totalTasks,
    baseTasksPerAgent,
    remainingTasks
  };
};

// **Upload and Distribute Tasks**
export const uploadTasks = async (req, res) => {
  try {
    const adminId = req.user._id;
    
    // Check if agents exist for this admin
    const agents = await Agent.find({ adminId });
    if (!agents || agents.length === 0) {
      return res.status(400).json({
        message: 'No agents found. Please add agents before uploading tasks.'
      });
    }

    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    const filePath = req.file.path;
    const fileExtension = path.extname(req.file.originalname).toLowerCase();
    
    let tasks = [];
    if (fileExtension === '.csv') {
      tasks = await parseCSV(filePath);
    } else if (fileExtension === '.xlsx') {
      tasks = await parseExcel(filePath);
    } else {
      fs.unlinkSync(filePath);
      return res.status(400).json({ message: 'Invalid file format. Please upload a CSV or Excel file' });
    }

    // Validate tasks
    const invalidRows = [];
    const validTasks = tasks.filter((task, index) => {
      if (!task.FirstName || !task.Phone) {
        invalidRows.push({ index, ...task });
        return false;
      }
      return true;
    });

    if (invalidRows.length > 0) {
      fs.unlinkSync(filePath);
      return res.status(400).json({ 
        message: 'Invalid data in file',
        invalidRows 
      });
    }

    if (validTasks.length === 0) {
      fs.unlinkSync(filePath);
      return res.status(400).json({ 
        message: 'No valid tasks found in the file'
      });
    }

    try {
      // Distribute tasks among agents with adminId
      const distribution = distributeTasks(validTasks, agents, adminId);
      
      // Save tasks to database
      const savedTasks = await Task.insertMany(distribution.tasks);

      // Clean up the uploaded file
      fs.unlinkSync(filePath);

      res.status(200).json({
        message: 'Tasks uploaded and distributed successfully',
        distribution: {
          totalTasks: distribution.tasks.length,
          tasksPerAgent: Math.floor(distribution.tasks.length / agents.length),
          agentsWithExtraTasks: distribution.tasks.length % agents.length,
          adminId: adminId
        }
      });
    } catch (error) {
      fs.unlinkSync(filePath);
      return res.status(400).json({
        message: error.message
      });
    }
  } catch (error) {
    console.error('Error uploading tasks:', error);
    // Clean up the uploaded file in case of error
    if (req.file && req.file.path) {
      fs.unlinkSync(req.file.path);
    }
    res.status(500).json({ message: 'Error uploading tasks' });
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
    const adminId = req.user._id;

    // Get total number of agents for this admin
    const totalAgents = await Agent.countDocuments({ adminId });

    // Get all agent IDs and details for this admin
    const agents = await Agent.find({ adminId }, '_id email name');
    const agentIds = agents.map(agent => agent._id);

    // Get total number of tasks assigned to these agents
    const totalTasks = await Task.countDocuments({ adminId, assignedTo: { $in: agentIds } });

    // Get tasks per agent with email
    const tasksPerAgent = await Task.aggregate([
      { $match: { adminId, assignedTo: { $in: agentIds } } },
      { $group: { _id: '$assignedTo', taskCount: { $sum: 1 } } },
      {
        $lookup: {
          from: 'agents',
          let: { agentId: '$_id' },
          pipeline: [
            { $match: { $expr: { $eq: ['$_id', '$$agentId'] } } }
          ],
          as: 'agentInfo'
        }
      },
      { $unwind: '$agentInfo' },
      {
        $project: {
          _id: 1,
          taskCount: 1,
          agentName: '$agentInfo.name',
          email: '$agentInfo.email'
        }
      }
    ]);

    // If an agent has no tasks, we need to include them with 0 tasks
    const agentsWithNoTasks = agents.filter(agent => 
      !tasksPerAgent.some(task => task._id.toString() === agent._id.toString())
    ).map(agent => ({
      _id: agent._id,
      taskCount: 0,
      agentName: agent.name,
      email: agent.email
    }));

    const allAgentsWithTasks = [...tasksPerAgent, ...agentsWithNoTasks];

    res.json({
      totalAgents,
      totalTasks,
      tasksPerAgent: allAgentsWithTasks,
      adminId
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
    const adminId = req.user._id;
    
    // Validate agentId
    if (!agentId) {
      return res.status(400).json({ message: "Agent ID is required" });
    }

    // Verify the agent belongs to the admin
    const agent = await Agent.findOne({ _id: agentId, adminId });
    if (!agent) {
      return res.status(404).json({ message: "Agent not found" });
    }

    // Get tasks for the specific agent
    const tasks = await Task.find({ adminId, assignedTo: agentId })
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
      },
      adminId
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
