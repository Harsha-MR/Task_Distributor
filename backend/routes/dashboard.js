const express = require('express');
const router = express.Router();
const Agent = require('../models/Agent');
const Assignment = require('../models/Assignment');

// Get dashboard statistics
router.get('/stats', async (req, res) => {
  try {
    const totalAgents = await Agent.countDocuments();
    const totalAssignments = await Assignment.countDocuments();
    const completedAssignments = await Assignment.countDocuments({ status: 'completed' });

    res.json({
      totalAgents,
      totalAssignments,
      completedAssignments,
    });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching dashboard stats' });
  }
});

// Get all agents with their assignments
router.get('/agents', async (req, res) => {
  try {
    const agents = await Agent.find().select('-password');
    const agentsWithAssignments = await Promise.all(
      agents.map(async (agent) => {
        const assignments = await Assignment.find({ agentId: agent._id });
        return {
          ...agent.toObject(),
          totalAssignments: assignments.length,
          completedAssignments: assignments.filter(a => a.status === 'completed').length,
        };
      })
    );
    res.json(agentsWithAssignments);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching agents' });
  }
});

module.exports = router; 