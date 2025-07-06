import express, { Request, Response } from "express";
import User from "../models/User.js";
import bcrypt from "bcryptjs";

const router = express.Router();

router.get("/", async (_req: Request, res: Response) => {
  const users = await User.find();
  
  // If no users exist, create a test user
  if (users.length === 0) {
    try {
      const hashedPassword = await bcrypt.hash("password123", 10);
      const testUser = await User.create({
        name: "Test User",
        email: "test@example.com",
        password: hashedPassword
      });
      users.push(testUser);
    } catch (error) {
      console.error("Failed to create test user:", error);
    }
  }
  
  // Transform users to include id field
  const transformedUsers = users.map(user => ({
    id: (user._id as any).toString(),
    name: user.name,
    email: user.email,
    avatar: user.avatar
  }));
  
  res.json(transformedUsers);
});

export default router;
