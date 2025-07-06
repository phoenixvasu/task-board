process.on('uncaughtException', (err: Error) => {
  console.error('‼️ Uncaught Exception:', err);
  process.exit(1);
});

process.on('unhandledRejection', (reason: any) => {
  console.error('‼️ Unhandled Rejection:', reason);
  process.exit(1);
});

import express, { Request, Response, NextFunction } from "express";
import cors from "cors";
import mongoose from "mongoose";
import dotenv from "dotenv";
import { createServer } from "http";
import { Server, Socket } from "socket.io";
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
    origin: process.env.NODE_ENV === 'production'
      ? process.env.CORS_ORIGIN?.split(',').map(origin => origin.trim()) || []
      : ["http://localhost:3000"],
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"]
  },
  transports: ['websocket', 'polling']
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
io.use(async (socket: Socket, next: (err?: Error) => void) => {
  const token = socket.handshake.auth.token;
  if (!token) {
    return next(new Error('Authentication error'));
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET as string) as any;
    
    // Convert the ID to ObjectId if it's valid, otherwise use as string
    let userId: string;
    try {
      if (mongoose.Types.ObjectId.isValid(decoded.id)) {
        userId = new mongoose.Types.ObjectId(decoded.id).toString();
      } else {
        userId = decoded.id;
      }
    } catch (error) {
      userId = decoded.id;
    }
    
    // Get user from database to get username
    const User = mongoose.model('User');
    const user = await User.findById(userId);
    if (!user) {
      return next(new Error('User not found'));
    }
    
    socket.data.user = { 
      id: userId, 
      username: user.name 
    };
    next();
  } catch (err) {
    next(new Error('Authentication error'));
  }
});

// Socket.io connection handler
io.on('connection', (socket: Socket) => {
  // Join board room
  socket.on('join-board', (data: { boardId: string }) => {
    const { boardId } = data;
    socket.join(boardId);
    socket.data.currentBoardId = boardId;
    
    // Add user to active users
    const activeUser: ActiveUser = {
      userId: socket.data.user.id,
      username: socket.data.user.username,
      boardId,
      socketId: socket.id,
      lastActivity: new Date()
    };
    activeUsers.set(socket.id, activeUser);
    
    // Notify other users in the room
    socket.to(boardId).emit('user-joined', {
      userId: socket.data.user.id,
      username: socket.data.user.username,
      timestamp: new Date().toISOString()
    });
    
    // Send current active users to the joining user
    const room = io.sockets.adapter.rooms.get(boardId);
    if (room) {
      const activeUsersList: ActiveUser[] = [];
      room.forEach((socketId: string) => {
        const userSocket = io.sockets.sockets.get(socketId);
        if (userSocket && userSocket.data.user) {
          const activeUser = activeUsers.get(socketId);
          if (activeUser) {
            activeUsersList.push(activeUser);
          }
        }
      });
      socket.emit('active-users', activeUsersList);
    }
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

  // Task added
  socket.on('task-added', (data: { boardId: string; columnId: string; taskId: string; task: any }) => {
    socket.to(data.boardId).emit('task-added', {
      columnId: data.columnId,
      taskId: data.taskId,
      task: data.task,
      addedBy: socket.data.user.username,
      timestamp: new Date().toISOString()
    });
  });

  // Task deleted
  socket.on('task-deleted', (data: { boardId: string; taskId: string }) => {
    socket.to(data.boardId).emit('task-deleted', {
      taskId: data.taskId,
      deletedBy: socket.data.user.username,
      timestamp: new Date().toISOString()
    });
  });

  // Column added
  socket.on('column-added', (data: { boardId: string; column: any }) => {
    socket.to(data.boardId).emit('column-added', {
      column: data.column,
      addedBy: socket.data.user.username,
      timestamp: new Date().toISOString()
    });
  });

  // Column deleted
  socket.on('column-deleted', (data: { boardId: string; columnId: string }) => {
    socket.to(data.boardId).emit('column-deleted', {
      columnId: data.columnId,
      deletedBy: socket.data.user.username,
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
  });

  socket.on('leave-board', (data: { boardId: string }) => {
    const { boardId } = data;
    socket.leave(boardId);
    socket.data.currentBoardId = null;
    
    // Remove from active users
    activeUsers.delete(socket.id);
    
    // Notify other users in the room
    socket.to(boardId).emit('user-left', {
      userId: socket.data.user.id,
      username: socket.data.user.username,
      timestamp: new Date().toISOString()
    });
  });
});

// Utility to parse comma-separated origins from env
function parseOrigins(origins: string | undefined): string[] {
  if (!origins) return [];
  return origins.split(',').map(origin => origin.trim()).filter(Boolean);
}

const localOrigins = [
  'http://localhost:3000'
];

let allowedOrigins: string[] = [];
if (process.env.NODE_ENV !== 'production') {
  // In dev, allow all local origins
  allowedOrigins = localOrigins;
  app.use(cors({ 
    origin: (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) => {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'));
      }
    }, 
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"]
  }));
} else {
  // In production, use CORS_ORIGIN env (comma-separated)
  allowedOrigins = parseOrigins(process.env.CORS_ORIGIN);
  app.use(cors({
    origin: (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) => {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'));
      }
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"]
  }));
}
app.use(express.json());

// Health check endpoint
app.get("/api/health", (req: Request, res: Response) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    database: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
    environment: process.env.NODE_ENV || 'development'
  });
});

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
const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  console.error('MONGODB_URI environment variable is required');
  process.exit(1);
}

mongoose
  .connect(MONGODB_URI)
  .then(() => {
    console.log('Connected to MongoDB');
    server.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
      console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
      console.log(`CORS Origins: ${allowedOrigins.join(', ')}`);
    });
  })
  .catch((err: Error) => {
    console.error("MongoDB connection error:", err);
    process.exit(1);
  });

// Export io for use in routes
export { io };
