import mongoose, { Document, Schema } from "mongoose";

export interface IColumn {
  id: string;
  name: string;
  taskIds: string[];
  createdAt: string;
  updatedAt: string;
}

export interface ITask {
  id: string;
  title: string;
  description: string;
  createdBy: mongoose.Types.ObjectId;
  assignedTo: mongoose.Types.ObjectId;
  priority: "low" | "medium" | "high";
  dueDate: string;
  createdAt: string;
  updatedAt: string;
}

export interface IBoard extends Document {
  id: string;
  name: string;
  description?: string;
  columns: IColumn[];
  tasks: Map<string, ITask>;
  createdBy: mongoose.Types.ObjectId;
  createdAt: string;
  updatedAt: string;
}

const columnSchema = new Schema<IColumn>({
  id: { type: String, required: true },
  name: { type: String, required: true },
  taskIds: [{ type: String, required: true }],
  createdAt: { type: String, required: true },
  updatedAt: { type: String, required: true },
}, { _id: false });

const taskSchema = new Schema<ITask>({
  id: { type: String, required: true },
  title: { type: String, required: true },
  description: { type: String, required: true },
  createdBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
  assignedTo: { type: Schema.Types.ObjectId, ref: "User", required: true },
  priority: {
    type: String,
    enum: ["low", "medium", "high"],
    default: "medium",
  },
  dueDate: { type: String, required: true },
  createdAt: { type: String, required: true },
  updatedAt: { type: String, required: true },
}, { _id: false });

const boardSchema = new Schema<IBoard>({
  id: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  description: String,
  columns: [columnSchema],
  tasks: { type: Map, of: taskSchema, default: {} },
  createdBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
  createdAt: { type: String, required: true },
  updatedAt: { type: String, required: true },
});

export default mongoose.model<IBoard>("Board", boardSchema);
