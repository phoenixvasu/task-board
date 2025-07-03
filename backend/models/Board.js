import mongoose from "mongoose";

const columnSchema = new mongoose.Schema(
  {
    id: { type: String, required: true },
    name: { type: String, required: true },
    taskIds: [{ type: String, required: true }],
    createdAt: { type: String, required: true },
    updatedAt: { type: String, required: true },
  },
  { _id: false }
);

const taskSchema = new mongoose.Schema(
  {
    id: { type: String, required: true },
    title: { type: String, required: true },
    description: { type: String, required: true },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    assignedTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    priority: {
      type: String,
      enum: ["low", "medium", "high"],
      default: "medium",
    },
    dueDate: { type: String, required: true },
    createdAt: { type: String, required: true },
    updatedAt: { type: String, required: true },
  },
  { _id: false }
);

const boardSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  description: String,
  columns: [columnSchema],
  tasks: { type: Map, of: taskSchema, default: {} },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  createdAt: { type: String, required: true },
  updatedAt: { type: String, required: true },
});

export default mongoose.model("Board", boardSchema);
