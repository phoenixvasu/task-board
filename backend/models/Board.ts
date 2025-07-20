import mongoose, { Document, Schema } from "mongoose";

export interface IColumn {
  id: string;
  name: string;
  taskIds: string[];
  createdAt: Date;
  updatedAt: Date;
}

export interface ITask {
  id: string;
  title: string;
  description: string;
  createdBy: mongoose.Types.ObjectId;
  assignedTo?: mongoose.Types.ObjectId;
  priority: "low" | "medium" | "high";
  dueDate: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface IBoardMember {
  userId: mongoose.Types.ObjectId;
  role: "owner" | "editor" | "viewer";
  invitedBy: mongoose.Types.ObjectId;
  invitedAt: Date;
  joinedAt?: Date;
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
  createdAt: Date;
  updatedAt: Date;
}

const columnSchema = new Schema<IColumn>({
  id: { type: String, required: true },
  name: { type: String, required: true, trim: true },
  taskIds: [{ type: String, required: true }],
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
}, { _id: false });

const taskSchema = new Schema<ITask>({
  id: { type: String, required: true },
  title: { type: String, required: true, trim: true },
  description: { type: String, required: true, trim: true },
  createdBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
  assignedTo: { type: Schema.Types.ObjectId, ref: "User" },
  priority: {
    type: String,
    enum: ["low", "medium", "high"],
    default: "medium",
  },
  dueDate: { type: Date, required: true },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
}, { _id: false });

const boardMemberSchema = new Schema<IBoardMember>({
  userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
  role: {
    type: String,
    enum: ["owner", "editor", "viewer"],
    default: "viewer"
  },
  invitedBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
  invitedAt: { type: Date, default: Date.now },
  joinedAt: { type: Date },
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
    trim: true,
    validate: {
      validator: (v: string) => Boolean(v && v.trim().length > 0),
      message: 'Board name cannot be empty'
    }
  },
  description: { type: String, trim: true },
  columns: [columnSchema],
  tasks: { type: Map, of: taskSchema, default: {} },
  createdBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
  isPublic: { type: Boolean, default: false },
  members: {
    type: [boardMemberSchema],
    validate: {
      validator: function(members: IBoardMember[]) {
        const ids = members.map(m => m.userId.toString());
        return ids.length === new Set(ids).size;
      },
      message: 'Duplicate members are not allowed'
    }
  },
  settings: {
    allowGuestAccess: { type: Boolean, default: false },
    requireApproval: { type: Boolean, default: false },
    defaultRole: {
      type: String,
      enum: ["editor", "viewer"],
      default: "viewer"
    }
  }
}, { timestamps: true });

// Index for efficient queries
boardSchema.index({ "members.userId": 1 });

// Ensure tasks Map is serialized as a plain object
boardSchema.set('toJSON', {
  transform: (doc, ret) => {
    const out: any = { ...ret };
    if (!ret.tasks) {
      out.tasks = {};
    } else if (ret.tasks instanceof Map) {
      out.tasks = Object.fromEntries(ret.tasks);
    } else if (typeof ret.tasks === 'object' && !Array.isArray(ret.tasks)) {
      // Already a plain object
    } else {
      out.tasks = {};
    }
    return out;
  }
});

export default mongoose.model<IBoard>("Board", boardSchema);
