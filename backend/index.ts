import express, { Request, Response, NextFunction } from "express";
import cors from "cors";
import mongoose from "mongoose";
import dotenv from "dotenv";
import authRoutes from "./routes/auth.js";
import boardRoutes from "./routes/board.js";
import userRoutes from "./routes/user.js";

dotenv.config();

const app = express();

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

// Error logging middleware (should be after all routes)
app.use((err: any, req: Request, res: Response, next: NextFunction) => {
  console.error('Error:', err);
  res.status(err.status || 500).json({ message: err.message || 'Internal Server Error' });
});

const PORT = process.env.PORT || 5000;
mongoose
  .connect(process.env.MONGODB_URI as string)
  .then(() => {
    app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
  })
  .catch((err: Error) => console.error("MongoDB connection error:", err));
