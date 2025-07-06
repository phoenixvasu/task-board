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
  assignedTo?: mongoose.Types.ObjectId;
  priority: "low" | "medium" | "high";
  dueDate: string;
  createdAt: string;
  updatedAt: string;
}

export interface IBoardMember {
  userId: mongoose.Types.ObjectId;
  role: "owner" | "editor" | "viewer";
  invitedBy: mongoose.Types.ObjectId;
  invitedAt: string;
  joinedAt?: string;
  permissions: {
    canView: boolean;
    canEdit: boolean;
    canDelete: boolean;
    canInvite: boolean;
    canManageMembers: boolean;
  };
}

export interface IBoard extends Document {
  id: string;
  name: string;
  description?: string;
  columns: IColumn[];
  tasks: Map<string, ITask>;
  createdBy: mongoose.Types.ObjectId;
  isPublic: boolean;
  members: IBoardMember[];
  settings: {
    allowGuestAccess: boolean;
    requireApproval: boolean;
    defaultRole: "editor" | "viewer";
  };
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
  assignedTo: { type: Schema.Types.ObjectId, ref: "User", required: false },
  priority: {
    type: String,
    enum: ["low", "medium", "high"],
    default: "medium",
  },
  dueDate: { type: String, required: true },
  createdAt: { type: String, required: true },
  updatedAt: { type: String, required: true },
}, { _id: false });

const boardMemberSchema = new Schema<IBoardMember>({
  userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
  role: {
    type: String,
    enum: ["owner", "editor", "viewer"],
    default: "viewer"
  },
  invitedBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
  invitedAt: { type: String, required: true },
  joinedAt: { type: String },
  permissions: {
    canView: { type: Boolean, default: true },
    canEdit: { type: Boolean, default: false },
    canDelete: { type: Boolean, default: false },
    canInvite: { type: Boolean, default: false },
    canManageMembers: { type: Boolean, default: false }
  }
}, { _id: false });

const boardSchema = new Schema<IBoard>({
  id: { type: String, required: true, unique: true },
  name: { 
    type: String, 
    required: true,
    validate: {
      validator: function(v: string) {
        return Boolean(v && v.trim().length > 0);
      },
      message: 'Board name cannot be empty'
    }
  },
  description: String,
  columns: [columnSchema],
  tasks: { type: Map, of: taskSchema, default: {} },
  createdBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
  isPublic: { type: Boolean, default: false },
  members: [boardMemberSchema],
  settings: {
    allowGuestAccess: { type: Boolean, default: false },
    requireApproval: { type: Boolean, default: false },
    defaultRole: {
      type: String,
      enum: ["editor", "viewer"],
      default: "viewer"
    }
  },
  createdAt: { type: String, required: true },
  updatedAt: { type: String, required: true },
});

// Index for efficient queries
boardSchema.index({ "members.userId": 1 });

export default mongoose.model<IBoard>("Board", boardSchema);
