import express from "express";
import { addAgent } from "../controllers/agentController.js";
import protect from "../middleware/authMiddleware.js";
import Agent from "../models/Agent.js";

const router = express.Router();

// Get all agents with count
router.get('/', protect, async (req, res) => {
  try {
    const agents = await Agent.find().sort({ createdAt: -1 });
    const totalAgents = await Agent.countDocuments();
    
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
    
    // Check if email is being changed and if it already exists
    if (email) {
      const existingAgent = await Agent.findOne({ 
        email, 
        _id: { $ne: req.params.id } 
      });
      if (existingAgent) {
        return res.status(400).json({ 
          success: false, 
          message: 'Agent with this email already exists' 
        });
      }
    }

    const agent = await Agent.findByIdAndUpdate(
      req.params.id,
      { name, email, mobile, status },
      { new: true, runValidators: true }
    );

    if (!agent) {
      return res.status(404).json({ 
        success: false, 
        message: 'Agent not found' 
      });
    }

    // Get updated count
    const totalAgents = await Agent.countDocuments();
    
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
    const agent = await Agent.findByIdAndDelete(req.params.id);

    if (!agent) {
      return res.status(404).json({ 
        success: false, 
        message: 'Agent not found' 
      });
    }

    // Get updated count
    const totalAgents = await Agent.countDocuments();
    
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
