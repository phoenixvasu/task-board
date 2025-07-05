import express, { Request, Response, NextFunction } from "express";
import cors from "cors";
import mongoose from "mongoose";
import dotenv from "dotenv";
import { createServer } from "http";
import { Server } from "socket.io";
import jwt from "jsonwebtoken";
import authRoutes from "./routes/auth.js";
import boardRoutes from "./routes/board.js";
import userRoutes from "./routes/user.js";
import sharingRoutes from "./routes/sharing.js";

dotenv.config();

const app = express();
const server = createServer(app);

// Socket.io setup with CORS
const io = new Server(server, {
  cors: {
    origin: process.env.NODE_ENV !== 'production' 
      ? ["http://localhost:5173", "http://localhost:3000"]
      : process.env.CORS_ORIGIN?.split(',').map(origin => origin.trim()) || [],
    credentials: true
  }
});

// Store active users and their board sessions
interface ActiveUser {
  userId: string;
  username: string;
  boardId: string;
  socketId: string;
  lastActivity: Date;
}

const activeUsers = new Map<string, ActiveUser>();

// Socket.io authentication middleware
io.use((socket, next) => {
  const token = socket.handshake.auth.token;
  if (!token) {
    return next(new Error('Authentication error'));
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET as string) as any;
    socket.data.user = { id: decoded.id, username: decoded.username };
    next();
  } catch (err) {
    next(new Error('Authentication error'));
  }
});

// Socket.io connection handler
io.on('connection', (socket) => {
  console.log(`User connected: ${socket.data.user.username} (${socket.id})`);

  // Join board room
  socket.on('join-board', (boardId: string) => {
    socket.join(boardId);
    
    // Add user to active users
    const activeUser: ActiveUser = {
      userId: socket.data.user.id,
      username: socket.data.user.username,
      boardId,
      socketId: socket.id,
      lastActivity: new Date()
    };
    activeUsers.set(socket.id, activeUser);

    // Notify others in the board
    socket.to(boardId).emit('user-joined', {
      userId: socket.data.user.id,
      username: socket.data.user.username,
      timestamp: new Date().toISOString()
    });

    // Send current active users to the new user
    const boardUsers = Array.from(activeUsers.values())
      .filter(user => user.boardId === boardId && user.socketId !== socket.id);
    socket.emit('active-users', boardUsers);
  });

  // User is editing a task
  socket.on('user-editing', (data: { boardId: string; taskId: string; isEditing: boolean }) => {
    socket.to(data.boardId).emit('user-editing', {
      userId: socket.data.user.id,
      username: socket.data.user.username,
      taskId: data.taskId,
      isEditing: data.isEditing,
      timestamp: new Date().toISOString()
    });
  });

  // Task updated
  socket.on('task-updated', (data: { boardId: string; taskId: string; task: any }) => {
    socket.to(data.boardId).emit('task-updated', {
      taskId: data.taskId,
      task: data.task,
      updatedBy: socket.data.user.username,
      timestamp: new Date().toISOString()
    });
  });

  // Task moved
  socket.on('task-moved', (data: { boardId: string; taskId: string; fromColumnId: string; toColumnId: string; newIndex: number }) => {
    socket.to(data.boardId).emit('task-moved', {
      taskId: data.taskId,
      fromColumnId: data.fromColumnId,
      toColumnId: data.toColumnId,
      newIndex: data.newIndex,
      movedBy: socket.data.user.username,
      timestamp: new Date().toISOString()
    });
  });

  // Column updated
  socket.on('column-updated', (data: { boardId: string; columnId: string; column: any }) => {
    socket.to(data.boardId).emit('column-updated', {
      columnId: data.columnId,
      column: data.column,
      updatedBy: socket.data.user.username,
      timestamp: new Date().toISOString()
    });
  });

  // Column reordered
  socket.on('columns-reordered', (data: { boardId: string; columnIds: string[] }) => {
    socket.to(data.boardId).emit('columns-reordered', {
      columnIds: data.columnIds,
      reorderedBy: socket.data.user.username,
      timestamp: new Date().toISOString()
    });
  });

  // User activity (heartbeat)
  socket.on('activity', (boardId: string) => {
    const user = activeUsers.get(socket.id);
    if (user) {
      user.lastActivity = new Date();
    }
  });

  // Disconnect handler
  socket.on('disconnect', () => {
    const user = activeUsers.get(socket.id);
    if (user) {
      // Notify others in the board
      socket.to(user.boardId).emit('user-left', {
        userId: user.userId,
        username: user.username,
        timestamp: new Date().toISOString()
      });
      
      // Remove from active users
      activeUsers.delete(socket.id);
    }
    console.log(`User disconnected: ${socket.data.user.username} (${socket.id})`);
  });
});

// Utility to parse comma-separated origins from env
function parseOrigins(origins: string | undefined): string[] {
  if (!origins) return [];
  return origins.split(',').map(origin => origin.trim()).filter(Boolean);
}

const localOrigins = [
  'http://localhost:5173',
  'http://localhost:3000'
];

let allowedOrigins: string[] = [];
if (process.env.NODE_ENV !== 'production') {
  // In dev, allow all local origins
  allowedOrigins = localOrigins;
  app.use(cors({ origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  }, credentials: true }));
} else {
  // In production, use CORS_ORIGIN env (comma-separated)
  allowedOrigins = parseOrigins(process.env.CORS_ORIGIN);
  app.use(cors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'));
      }
    },
    credentials: true
  }));
}
app.use(express.json());

app.use("/api/auth", authRoutes);
app.use("/api/boards", boardRoutes);
app.use("/api/users", userRoutes);
app.use("/api/sharing", sharingRoutes);

// Error logging middleware (should be after all routes)
app.use((err: any, req: Request, res: Response, next: NextFunction) => {
  console.error('Error:', err);
  res.status(err.status || 500).json({ message: err.message || 'Internal Server Error' });
});

const PORT = process.env.PORT || 5000;
mongoose
  .connect(process.env.MONGODB_URI as string)
  .then(() => {
    server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
  })
  .catch((err: Error) => console.error("MongoDB connection error:", err));

// Export io for use in routes
export { io };
