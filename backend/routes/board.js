import express from "express";
import Board from "../models/Board.js";
import User from "../models/User.js";
import auth from "../middleware/auth.js";
import { v4 as uuidv4 } from "uuid";

const router = express.Router();

// Helper: generate timestamp
const getCurrentTimestamp = () => new Date().toISOString();

// All routes below require authentication
router.use(auth);

// Get all boards for a user
router.get("/", async (req, res) => {
  const userId = req.user.id;
  const boards = await Board.find({ createdBy: userId });
  res.json(boards);
});

// Create board
router.post("/", async (req, res) => {
  const { name, description } = req.body;
  const userId = req.user.id;
  const timestamp = getCurrentTimestamp();
  const boardId = uuidv4();
  const columns = [
    {
      id: uuidv4(),
      name: "To Do",
      taskIds: [],
      createdAt: timestamp,
      updatedAt: timestamp,
    },
    {
      id: uuidv4(),
      name: "In Progress",
      taskIds: [],
      createdAt: timestamp,
      updatedAt: timestamp,
    },
    {
      id: uuidv4(),
      name: "Done",
      taskIds: [],
      createdAt: timestamp,
      updatedAt: timestamp,
    },
  ];
  const board = await Board.create({
    id: boardId,
    name,
    description,
    columns,
    tasks: {},
    createdBy: userId,
    createdAt: timestamp,
    updatedAt: timestamp,
  });
  res.status(201).json(board);
});

// Get board by id
router.get("/:id", async (req, res) => {
  const board = await Board.findOne({ id: req.params.id });
  if (!board || board.createdBy.toString() !== req.user.id) {
    return res.status(404).json({ message: "Board not found" });
  }
  res.json(board);
});

// Update board
router.put("/:id", async (req, res) => {
  const board = await Board.findOne({ id: req.params.id });
  if (!board || board.createdBy.toString() !== req.user.id) {
    return res.status(404).json({ message: "Board not found" });
  }
  Object.assign(board, req.body, { updatedAt: getCurrentTimestamp() });
  await board.save();
  res.json(board);
});

// Delete board
router.delete("/:id", async (req, res) => {
  const board = await Board.findOne({ id: req.params.id });
  if (!board || board.createdBy.toString() !== req.user.id) {
    return res.status(404).json({ message: "Board not found" });
  }
  await board.deleteOne();
  res.json({ message: "Board deleted" });
});

// --- COLUMN ENDPOINTS ---

// Add column
router.post("/:boardId/columns", async (req, res) => {
  const { name } = req.body;
  const timestamp = getCurrentTimestamp();
  const column = {
    id: uuidv4(),
    name,
    taskIds: [],
    createdAt: timestamp,
    updatedAt: timestamp,
  };
  const board = await Board.findOne({ id: req.params.boardId });
  if (!board || board.createdBy.toString() !== req.user.id) {
    return res.status(404).json({ message: "Board not found" });
  }
  board.columns.push(column);
  board.updatedAt = timestamp;
  await board.save();
  res.status(201).json(board);
});

// Update column
router.put("/:boardId/columns/:columnId", async (req, res) => {
  const { name, taskIds } = req.body;
  const timestamp = getCurrentTimestamp();
  const board = await Board.findOne({ id: req.params.boardId });
  if (!board || board.createdBy.toString() !== req.user.id) {
    return res.status(404).json({ message: "Board not found" });
  }
  const column = board.columns.find((col) => col.id === req.params.columnId);
  if (!column) return res.status(404).json({ message: "Column not found" });
  if (name !== undefined) column.name = name;
  if (taskIds !== undefined) column.taskIds = taskIds;
  column.updatedAt = timestamp;
  board.updatedAt = timestamp;
  await board.save();
  res.json(board);
});

// Delete column
router.delete("/:boardId/columns/:columnId", async (req, res) => {
  const board = await Board.findOne({ id: req.params.boardId });
  if (!board || board.createdBy.toString() !== req.user.id) {
    return res.status(404).json({ message: "Board not found" });
  }
  board.columns = board.columns.filter((col) => col.id !== req.params.columnId);
  board.updatedAt = getCurrentTimestamp();
  await board.save();
  res.json(board);
});

// Reorder columns
router.post("/:boardId/columns/reorder", async (req, res) => {
  const { columnIds } = req.body;
  const board = await Board.findOne({ id: req.params.boardId });
  if (!board || board.createdBy.toString() !== req.user.id) {
    return res.status(404).json({ message: "Board not found" });
  }
  const columnMap = new Map(board.columns.map((col) => [col.id, col]));
  board.columns = columnIds.map((id) => columnMap.get(id)).filter(Boolean);
  board.updatedAt = getCurrentTimestamp();
  await board.save();
  res.json(board);
});

// --- TASK ENDPOINTS ---

// Add task
router.post("/:boardId/columns/:columnId/tasks", async (req, res) => {
  const { title, description, createdBy, assignedTo, priority, dueDate } =
    req.body;
  const timestamp = getCurrentTimestamp();
  const taskId = uuidv4();
  const task = {
    id: taskId,
    title,
    description,
    createdBy,
    assignedTo,
    priority,
    dueDate,
    createdAt: timestamp,
    updatedAt: timestamp,
  };
  const board = await Board.findOne({ id: req.params.boardId });
  if (!board || board.createdBy.toString() !== req.user.id) {
    return res.status(404).json({ message: "Board not found" });
  }
  board.tasks.set(taskId, task);
  const column = board.columns.find((col) => col.id === req.params.columnId);
  if (!column) return res.status(404).json({ message: "Column not found" });
  column.taskIds.push(taskId);
  column.updatedAt = timestamp;
  board.updatedAt = timestamp;
  await board.save();
  res.status(201).json(board);
});

// Update task
router.put("/:boardId/tasks/:taskId", async (req, res) => {
  const board = await Board.findOne({ id: req.params.boardId });
  if (!board || board.createdBy.toString() !== req.user.id) {
    return res.status(404).json({ message: "Board not found" });
  }
  const task = board.tasks.get(req.params.taskId);
  if (!task) return res.status(404).json({ message: "Task not found" });
  Object.assign(task, req.body, { updatedAt: getCurrentTimestamp() });
  board.tasks.set(req.params.taskId, task);
  board.updatedAt = getCurrentTimestamp();
  await board.save();
  res.json(board);
});

// Delete task
router.delete("/:boardId/tasks/:taskId", async (req, res) => {
  const board = await Board.findOne({ id: req.params.boardId });
  if (!board || board.createdBy.toString() !== req.user.id) {
    return res.status(404).json({ message: "Board not found" });
  }
  board.tasks.delete(req.params.taskId);
  board.columns.forEach((col) => {
    col.taskIds = col.taskIds.filter((id) => id !== req.params.taskId);
  });
  board.updatedAt = getCurrentTimestamp();
  await board.save();
  res.json(board);
});

// Move/reorder tasks in a column
router.post("/:boardId/columns/:columnId/tasks/reorder", async (req, res) => {
  const { taskIds } = req.body;
  const board = await Board.findOne({ id: req.params.boardId });
  if (!board || board.createdBy.toString() !== req.user.id) {
    return res.status(404).json({ message: "Board not found" });
  }
  const column = board.columns.find((col) => col.id === req.params.columnId);
  if (!column) return res.status(404).json({ message: "Column not found" });
  column.taskIds = taskIds;
  column.updatedAt = getCurrentTimestamp();
  board.updatedAt = getCurrentTimestamp();
  await board.save();
  res.json(board);
});

export default router;
