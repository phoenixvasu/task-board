import express, { Request, Response } from "express";
import User from "../models/User.js";

const router = express.Router();

router.get("/", async (_req: Request, res: Response) => {
  const users = await User.find();
  res.json(users);
});

export default router;
