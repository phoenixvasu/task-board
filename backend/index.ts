process.on('uncaughtException', err => {
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
import jwt from "jsonwebtoken";
import authRoutes from "./routes/auth.js";
import boardRoutes from "./routes/board.js";
import userRoutes from "./routes/user.js";
import sharingRoutes from "./routes/sharing.js";
import SharingService from './services/sharingService.js';
import { Server as SocketIOServer } from 'socket.io';
import { registerSocketHandlers } from './services/socketService';

dotenv.config();

const app = express();
const server = createServer(app);

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
    origin: (origin, callback) => {
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
    origin: (origin, callback) => {
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

const io = new SocketIOServer(server, {
  cors: {
    origin: allowedOrigins,
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"]
  }
});

// Socket.IO authentication middleware
io.use(async (socket, next) => {
  try {
    const token = socket.handshake.auth?.token || socket.handshake.headers?.authorization?.split(' ')[1];
    if (!token) {
      return next(new Error('No token provided'));
    }
    const decoded = jwt.verify(token, process.env.JWT_SECRET as string) as { id: string };
    // Attach user info to socket
    (socket as any).user = { id: decoded.id };
    next();
  } catch (err) {
    next(new Error('Invalid token'));
  }
});

registerSocketHandlers(io);

const PORT = process.env.PORT || 5000;
const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  console.error('MONGODB_URI environment variable is required');
  process.exit(1);
}

// Remove sensitive logs in production
mongoose
  .connect(MONGODB_URI)
  .then(() => {
    if (process.env.NODE_ENV !== 'production') {
    }
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
