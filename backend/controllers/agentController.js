import Agent from "../models/Agent.js";

export const addAgent = async (req, res) => {
  try {
    const { name, email, mobile, password } = req.body;

    // Validate required fields
    if (!name || !email || !mobile || !password) {
      return res.status(400).json({
        success: false,
        message: "Please provide all required fields"
      });
    }

    // Check if agent with email already exists
    const existingAgent = await Agent.findOne({ email });
    if (existingAgent) {
      return res.status(400).json({
        success: false,
        message: "An agent with this email already exists"
      });
    }

    // Check if agent with mobile already exists
    const existingMobile = await Agent.findOne({ mobile });
    if (existingMobile) {
      return res.status(400).json({
        success: false,
        message: "An agent with this mobile number already exists"
      });
    }

    // Create new agent
    const agent = await Agent.create({
      name,
      email,
      mobile,
      password
    });

    // Return success response without password
    const agentResponse = agent.toObject();
    delete agentResponse.password;

    res.status(201).json({
      success: true,
      message: "Agent created successfully",
      data: agentResponse
    });

  } catch (error) {
    // Handle validation errors
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({
        success: false,
        message: messages.join(', ')
      });
    }

    // Handle other errors
    console.error('Error creating agent:', error);
    res.status(500).json({
      success: false,
      message: "Error creating agent. Please try again."
    });
  }
};
