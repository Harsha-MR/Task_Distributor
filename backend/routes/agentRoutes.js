import express from "express";
import { addAgent } from "../controllers/agentController.js";
import protect from "../middleware/authMiddleware.js";
import Agent from "../models/Agent.js";

const router = express.Router();

// Get all agents with count for the current admin
router.get('/', protect, async (req, res) => {
  try {
    const agents = await Agent.find({ adminId: req.user._id }).sort({ createdAt: -1 });
    const totalAgents = await Agent.countDocuments({ adminId: req.user._id });
    
    res.json({
      success: true,
      data: {
        agents,
        totalAgents
      }
    });
  } catch (error) {
    console.error('Error fetching agents:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error fetching agents',
      error: error.message 
    });
  }
});

// Create new agent
router.post('/', protect, addAgent);

// Update agent
router.put('/:id', protect, async (req, res) => {
  try {
    const { name, email, mobile, status } = req.body;
    
    // Check if email is being changed and if it already exists for this admin
    if (email) {
      const existingAgent = await Agent.findOne({ 
        email, 
        adminId: req.user._id,
        _id: { $ne: req.params.id } 
      });
      if (existingAgent) {
        return res.status(400).json({ 
          success: false, 
          message: 'Agent with this email already exists under your admin account' 
        });
      }
    }

    // Update only if the agent belongs to the current admin
    const agent = await Agent.findOneAndUpdate(
      { _id: req.params.id, adminId: req.user._id },
      { name, email, mobile, status },
      { new: true, runValidators: true }
    );

    if (!agent) {
      return res.status(404).json({ 
        success: false, 
        message: 'Agent not found or you do not have permission to update this agent' 
      });
    }

    // Get updated count for this admin
    const totalAgents = await Agent.countDocuments({ adminId: req.user._id });
    
    res.json({
      success: true,
      data: {
        agent,
        totalAgents
      },
      message: 'Agent updated successfully'
    });
  } catch (error) {
    console.error('Error updating agent:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error updating agent',
      error: error.message 
    });
  }
});

// Delete agent
router.delete('/:id', protect, async (req, res) => {
  try {
    // Delete only if the agent belongs to the current admin
    const agent = await Agent.findOneAndDelete({ 
      _id: req.params.id, 
      adminId: req.user._id 
    });

    if (!agent) {
      return res.status(404).json({ 
        success: false, 
        message: 'Agent not found or you do not have permission to delete this agent' 
      });
    }

    // Get updated count for this admin
    const totalAgents = await Agent.countDocuments({ adminId: req.user._id });
    
    res.json({
      success: true,
      data: {
        agent,
        totalAgents
      },
      message: 'Agent deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting agent:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error deleting agent',
      error: error.message 
    });
  }
});

export default router;
