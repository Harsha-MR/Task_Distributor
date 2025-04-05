
import Admin from "../models/Admin.js";
import Agent from "../models/Agent.js";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";



// **Admin Registration**
export const registerAdmin = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    const adminExists = await Admin.findOne({ email });
    if (adminExists) {
      return res.status(400).json({ message: "Admin already exists" });
    }

    // const hashedPassword = await bcrypt.hash(password, 10);
    const admin = await Admin.create({ name, email, password });

    res.status(201).json({
      success: true,
      message: "Admin registered successfully. Please log in.",
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};



export const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;
    
    const admin = await Admin.findOne({ email });
    console.log(admin);
    
    if (!admin) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    if (password != admin.password) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    // Generate JWT token
    const token = jwt.sign({ id: admin._id }, process.env.JWT_SECRET, { expiresIn: "1h" });

    res.status(200).json({
      success: true,
      message: "Login successful",
      token: token,
    });
  } catch (error) {
    console.error("Error:", error);
    res.status(500).json({ message: error.message });
  }
};


export const registerAgent = async (req, res) => {
  try {
    const { name, email, mobile, password } = req.body;

    // Ensure only Admins can create Agents
    if (!req.user) return res.status(403).json({ message: "Admins only" });

    const agentExists = await Agent.findOne({ email });
    if (agentExists) return res.status(400).json({ message: "Agent already exists" });

    const hashedPassword = await bcrypt.hash(password, 10);
    const agent = await Agent.create({ name, email, mobile, password: hashedPassword });

    res.status(201).json({
      _id: agent._id,
      name: agent.name,
      email: agent.email,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
