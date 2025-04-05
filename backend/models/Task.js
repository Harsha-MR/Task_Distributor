import mongoose from "mongoose";

const taskSchema = new mongoose.Schema({
  firstName: {
    type: String,
    required: true,
  },
  phone: {
    type: String,
    required: true,
  },
  notes: {
    type: String,
    default: "",
  },
  assignedTo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Agent",
    required: true,
  },
  assignedAt: {
    type: Date,
    default: Date.now,
  },
  completed: {
    type: Boolean,
    default: false,
  },
  completedAt: {
    type: Date,
  }
});

const Task = mongoose.model("Task", taskSchema);

export default Task;
