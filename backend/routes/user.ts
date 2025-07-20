import express from "express";
import User from "../models/User.js";
import bcrypt from "bcryptjs";
import auth from "../middleware/auth.js";

const router = express.Router();

router.get("/", async (_req, res) => {
  let users = await User.find();
  if (users.length === 0) {
    try {
      const hashedPassword = await bcrypt.hash("password123", 10);
      const testUser = await User.create({
        name: "Test User",
        email: "test@example.com",
        password: hashedPassword
      });
      users = [testUser];
      // Emit user-registered event for test user
    } catch (error) {
      console.error("Failed to create test user:", error);
    }
  }
  const transformedUsers = users.map(user => {
    const u = user as typeof User.prototype & { _id: any, name: string, email: string, avatar?: string };
    return {
      id: u._id.toString(), // Always use 24-char ObjectId string
      name: u.name,
      email: u.email,
      avatar: u.avatar
    };
  });
  res.json(transformedUsers);
});

router.put("/:id", auth, async (req: express.Request, res: express.Response) => {
  const { id } = req.params;
  const { name, email, avatar } = req.body;
  const userId = req.user?.id;

  if (!userId || userId !== id) {
    res.status(403).json({ message: "You can only update your own profile." });
    return;
  }

  if (!name || !email) {
    res.status(400).json({ message: "Name and email are required." });
    return;
  }

  try {
    const user = await User.findById(id);
    if (!user) {
      res.status(404).json({ message: "User not found." });
      return;
    }
    user.name = name;
    user.email = email;
    if (avatar !== undefined) user.avatar = avatar;
    await user.save();

    res.json({ id: (user as any)._id.toString(), name: user.name, email: user.email, avatar: user.avatar });
  } catch (error) {
    console.error("Failed to update user:", error);
    res.status(500).json({ message: "Failed to update user." });
  }
});

export default router;
