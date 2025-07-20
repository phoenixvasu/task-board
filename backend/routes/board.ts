import express, { Request, Response } from 'express';
import Board from '../models/Board.js';
import User from '../models/User.js';
import auth from '../middleware/auth.js';
import { v4 as uuidv4 } from 'uuid';
import SharingService from '../services/sharingService.js';
import mongoose from 'mongoose';
import { ITask } from '../models/Board';
import { getIO } from '../services/socketService';
import { SOCKET_EVENTS } from '../../src/types/socketEvents';

const router = express.Router();

// Helper: generate timestamp
const getCurrentTimestamp = (): Date => new Date();

// Async handler utility for Express
const asyncHandler = (fn: Function) => (req: any, res: any, next: any) =>
  Promise.resolve(fn(req, res, next)).catch(next);

// All routes below require authentication
router.use(auth);

// Get all boards for a user (including shared boards)
router.get('/', asyncHandler(async (req: express.Request, res: express.Response) => {
  const userId = (req as any).user.id;
  
  // Get boards created by user
  const ownedBoards = await Board.find({ createdBy: userId });
  
  // Get boards shared with user (excluding owned boards)
  const sharedBoards = await SharingService.getSharedBoards(userId);
  
  // Combine and format results
  const allBoards = [
    ...ownedBoards.map(board => ({
      ...board.toJSON(),
      id: board.id, // Ensure consistent ID
      userRole: 'owner',
      isOwner: true
    })),
    ...sharedBoards.map(shared => ({
      ...shared,
      id: shared.boardId, // Use boardId as id for consistency
      userRole: shared.role,
      isOwner: false
    }))
  ];
  
  res.json(allBoards);
}));

// Get only boards owned by the user
router.get('/owned', asyncHandler(async (req: express.Request, res: express.Response) => {
  const userId = (req as any).user.id;
  const ownedBoards = await Board.find({ createdBy: userId });
  res.json(ownedBoards.map(board => ({
    ...board.toJSON(),
    id: board.id,
    userRole: 'owner',
    isOwner: true
  })));
}));

// Get only boards shared with the user (not owned)
router.get('/shared', asyncHandler(async (req: express.Request, res: express.Response) => {
  const userId = (req as any).user.id;
  const sharedBoards = await SharingService.getSharedBoards(userId);
  // Exclude boards where the user is the owner
  const ownedBoardIds = (await Board.find({ createdBy: userId })).map(b => b.id);
  const filtered = sharedBoards.filter(b => !ownedBoardIds.includes(b.boardId));
  res.json(filtered.map(shared => ({
    ...shared,
    id: shared.boardId,
    userRole: shared.role,
    isOwner: false
  })));
}));

// Create board
router.post('/', asyncHandler(async (req: express.Request, res: express.Response) => {
  const { name, description } = req.body;
  const userId = (req as any).user.id;
  
  // Validate required fields
  if (!name || !name.trim()) {
    return res.status(400).json({ message: 'Board name is required' });
  }
  
  if (!userId) {
    return res.status(400).json({ message: 'User ID is required' });
  }
  
  const timestamp = getCurrentTimestamp();
  const boardId = uuidv4();
  const columns = [
    {
      id: uuidv4(),
      name: 'To Do',
      taskIds: [],
      createdAt: timestamp,
      updatedAt: timestamp,
    },
    {
      id: uuidv4(),
      name: 'In Progress',
      taskIds: [],
      createdAt: timestamp,
      updatedAt: timestamp,
    },
    {
      id: uuidv4(),
      name: 'Done',
      taskIds: [],
      createdAt: timestamp,
      updatedAt: timestamp,
    },
  ];
  
  try {
    const board = await Board.create({
      id: boardId,
      name: name.trim(),
      description: description?.trim() || '',
      columns,
      tasks: {},
      createdBy: userId,
      isPublic: false,
      members: [],

      settings: {
        allowGuestAccess: false,
        requireApproval: false,
        defaultRole: "viewer"
      },
      createdAt: timestamp,
      updatedAt: timestamp,
    });
    
    // No socket event needed for board creation; only owner sees it
    res.status(201).json(board.toJSON());
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    res.status(500).json({ message: 'Failed to create board', error: errorMessage });
  }
}));

// Get board by id (with access control)
router.get('/:id', asyncHandler(async (req: express.Request, res: express.Response) => {
  const { id } = req.params;
  const userId = (req as any).user.id;

  // Check access permissions
  const access = await SharingService.checkBoardAccess(id, userId);
  
  if (!access.hasAccess) {
    return res.status(403).json({ message: 'Access denied' });
  }

  const board = await Board.findOne({ id });
  
  if (!board) {
    return res.status(404).json({ message: 'Board not found' });
  }

  // Add user role to response
  const response = board.toJSON();
  response.userRole = access.role;
  response.permissions = access.permissions;

  res.json(response);
}));

// Update board (with access control)
router.put('/:id', asyncHandler(async (req: express.Request, res: express.Response) => {
  const { id } = req.params;
  const userId = (req as any).user.id;

  // Check if user can edit
  const canEdit = await SharingService.canPerformAction(id, userId, 'canEdit');
  if (!canEdit) {
    return res.status(403).json({ message: 'You do not have permission to edit this board' });
  }

  const board = await Board.findOne({ id });
  if (!board) {
    return res.status(404).json({ message: 'Board not found' });
  }

  Object.assign(board, req.body, { updatedAt: getCurrentTimestamp() });
  await board.save();

  // Emit real-time update to all board members
  const io = getIO && getIO();
  if (io) {
    io.to(board.id).emit(SOCKET_EVENTS.BOARD_UPDATED, {
      boardId: board.id,
      updates: req.body,
      sourceClientId: req.headers['x-client-id'] || null,
    });
  }

  res.json(board.toJSON());
}));

// Delete board (with access control)
router.delete('/:id', asyncHandler(async (req: express.Request, res: express.Response) => {
  const { id } = req.params;
  const userId = (req as any).user.id;

  // Validate board ID
  if (!id || !id.trim()) {
    return res.status(400).json({ message: 'Board ID is required' });
  }

  // Check if user can delete
  const canDelete = await SharingService.canPerformAction(id, userId, 'canDelete');
  if (!canDelete) {
    return res.status(403).json({ message: 'You do not have permission to delete this board' });
  }

  const board = await Board.findOne({ id });
  if (!board) {
    return res.status(404).json({ message: 'Board not found' });
  }

  try {
    await board.deleteOne();
    
    res.json({ message: 'Board deleted successfully' });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    res.status(500).json({ message: 'Failed to delete board', error: errorMessage });
  }
}));

// --- COLUMN ENDPOINTS ---

// Add column (with access control)
router.post('/:boardId/columns', asyncHandler(async (req: express.Request, res: express.Response) => {
  const { name } = req.body;
  const { boardId } = req.params;
  const userId = (req as any).user.id;

  // Check if user can edit
  const canEdit = await SharingService.canPerformAction(boardId, userId, 'canEdit');
  if (!canEdit) {
    return res.status(403).json({ message: 'You do not have permission to edit this board' });
  }

  const timestamp = getCurrentTimestamp();
  const column = {
    id: uuidv4(),
    name,
    taskIds: [],
    createdAt: timestamp,
    updatedAt: timestamp,
  };
  const board = await Board.findOne({ id: boardId });
  if (!board) {
    return res.status(404).json({ message: 'Board not found' });
  }
  board.columns.push(column);
  board.updatedAt = timestamp;
  await board.save();
  
  res.status(201).json(board.toJSON());
}));

// Update column (with access control)
router.put('/:boardId/columns/:columnId', asyncHandler(async (req: express.Request, res: express.Response) => {
  const { name, taskIds } = req.body;
  const { boardId } = req.params;
  const userId = (req as any).user.id;

  // Check if user can edit
  const canEdit = await SharingService.canPerformAction(boardId, userId, 'canEdit');
  if (!canEdit) {
    return res.status(403).json({ message: 'You do not have permission to edit this board' });
  }

  const timestamp = getCurrentTimestamp();
  const board = await Board.findOne({ id: boardId });
  if (!board) {
    return res.status(404).json({ message: 'Board not found' });
  }
  const column = board.columns.find((col: any) => col.id === req.params.columnId);
  if (!column) return res.status(404).json({ message: 'Column not found' });
  if (name !== undefined) column.name = name;
  if (taskIds !== undefined) column.taskIds = taskIds;
  column.updatedAt = timestamp;
  board.updatedAt = timestamp;
  await board.save();
  
  res.json(board.toJSON());
}));

// Delete column (with access control)
router.delete('/:boardId/columns/:columnId', asyncHandler(async (req: express.Request, res: express.Response) => {
  const { boardId } = req.params;
  const userId = (req as any).user.id;

  // Check if user can edit
  const canEdit = await SharingService.canPerformAction(boardId, userId, 'canEdit');
  if (!canEdit) {
    return res.status(403).json({ message: 'You do not have permission to edit this board' });
  }

  const board = await Board.findOne({ id: boardId });
  if (!board) {
    return res.status(404).json({ message: 'Board not found' });
  }
  board.columns = board.columns.filter((col: any) => col.id !== req.params.columnId);
  board.updatedAt = getCurrentTimestamp();
  await board.save();
  
  res.json(board.toJSON());
}));

// Reorder columns (with access control)
router.post('/:boardId/columns/reorder', asyncHandler(async (req: express.Request, res: express.Response) => {
  const { columnIds } = req.body;
  const { boardId } = req.params;
  const userId = (req as any).user.id;

  // Check if user can edit
  const canEdit = await SharingService.canPerformAction(boardId, userId, 'canEdit');
  if (!canEdit) {
    return res.status(403).json({ message: 'You do not have permission to edit this board' });
  }

  const board = await Board.findOne({ id: boardId });
  if (!board) {
    return res.status(404).json({ message: 'Board not found' });
  }
  const columnMap = new Map(board.columns.map((col: any) => [col.id, col]));
  board.columns = columnIds.map((id: string) => columnMap.get(id)).filter(Boolean);
  board.updatedAt = getCurrentTimestamp();
  await board.save();
  
  res.json(board.toJSON());
}));

// --- TASK ENDPOINTS ---

// Add task (with access control)
router.post('/:boardId/columns/:columnId/tasks', asyncHandler(async (req: express.Request, res: express.Response) => {
  const { title, description, createdBy, assignedTo, priority, dueDate } = req.body;
  const { boardId, columnId } = req.params;
  const userId = (req as any).user.id;

  // Validation
  if (!title || typeof title !== 'string' || !title.trim()) {
    return res.status(400).json({ message: 'Task title is required.' });
  }

  // Check if user can edit
  const canEdit = await SharingService.canPerformAction(boardId, userId, 'canEdit');
  if (!canEdit) {
    return res.status(403).json({ message: 'You do not have permission to edit this board' });
  }
  
  const board = await Board.findOne({ id: boardId });
  if (!board) {
    return res.status(404).json({ message: 'Board not found' });
  }
  const column = board.columns.find((col: any) => col.id === columnId);
  if (!column) {
    return res.status(404).json({ message: 'Column not found' });
  }

  const taskObjectId = new mongoose.Types.ObjectId();
  const now = new Date();
  const task: ITask = {
    id: taskObjectId.toString(),
    title: title.trim(),
    description: description && typeof description === 'string' ? description : '',
    createdBy: createdBy ? new mongoose.Types.ObjectId(createdBy) : new mongoose.Types.ObjectId(userId),
    assignedTo: assignedTo ? new mongoose.Types.ObjectId(assignedTo) : undefined,
    priority: priority === 'low' || priority === 'high' ? priority : 'medium',
    dueDate: dueDate ? new Date(dueDate) : now,
    createdAt: now,
    updatedAt: now,
  };

  // Add to board.tasks and column.taskIds
  board.tasks.set(taskObjectId.toString(), task);
  column.taskIds.push(taskObjectId.toString());
  board.updatedAt = now;
  board.markModified('tasks');
  await board.save();
  
  return res.status(201).json({ task });
}));

// Update task (with access control)
router.put('/:boardId/tasks/:taskId', asyncHandler(async (req: express.Request, res: express.Response) => {
  const { boardId } = req.params;
  const userId = (req as any).user.id;
  const { assignedTo, createdBy, ...otherUpdates } = req.body;

  // Check if user can edit
  const canEdit = await SharingService.canPerformAction(boardId, userId, 'canEdit');
  if (!canEdit) {
    return res.status(403).json({ message: 'You do not have permission to edit this board' });
  }

  const board = await Board.findOne({ id: boardId });
  if (!board) {
    return res.status(404).json({ message: 'Board not found' });
  }
  const task = board.tasks.get(req.params.taskId);
  if (!task) return res.status(404).json({ message: 'Task not found' });

  // Helper function to safely create ObjectId
  const createSafeObjectId = (id: string) => {
    try {
      if (mongoose.Types.ObjectId.isValid(id)) {
        return new mongoose.Types.ObjectId(id);
      }
      return new mongoose.Types.ObjectId();
    } catch (error) {
      console.error('Invalid ObjectId:', id, error);
      return new mongoose.Types.ObjectId();
    }
  };

  // Prepare updates with proper ObjectId handling
  const updates: any = {
    ...otherUpdates,
    updatedAt: getCurrentTimestamp()
  };

  // Handle assignedTo field
  if (assignedTo !== undefined) {
    if (assignedTo && assignedTo.trim()) {
      updates.assignedTo = createSafeObjectId(assignedTo);
    } else {
      updates.assignedTo = null; // Allow unassigning
    }
  }

  // Handle createdBy field
  if (createdBy !== undefined) {
    if (createdBy && createdBy.trim()) {
      updates.createdBy = createSafeObjectId(createdBy);
    } else {
      updates.createdBy = createSafeObjectId(userId); // Default to current user
    }
  }

  Object.assign(task, updates);
  board.tasks.set(req.params.taskId, task);
  board.updatedAt = getCurrentTimestamp();
  
  await board.save();
  
  res.json(board.toJSON());
}));

// Delete task (with access control)
router.delete('/:boardId/tasks/:taskId', asyncHandler(async (req: express.Request, res: express.Response) => {
  const { boardId } = req.params;
  const userId = (req as any).user.id;

  // Check if user can edit
  const canEdit = await SharingService.canPerformAction(boardId, userId, 'canEdit');
  if (!canEdit) {
    return res.status(403).json({ message: 'You do not have permission to edit this board' });
  }

  const board = await Board.findOne({ id: boardId });
  if (!board) {
    return res.status(404).json({ message: 'Board not found' });
  }
  board.tasks.delete(req.params.taskId);
  board.columns.forEach((col: any) => {
    col.taskIds = col.taskIds.filter((id: string) => id !== req.params.taskId);
  });
  board.updatedAt = getCurrentTimestamp();
  await board.save();
  
  res.json(board.toJSON());
}));

// Move/reorder tasks in a column (with access control)
router.post('/:boardId/columns/:columnId/tasks/reorder', asyncHandler(async (req: express.Request, res: express.Response) => {
  const { taskIds } = req.body;
  const { boardId } = req.params;
  const userId = (req as any).user.id;

  // Check if user can edit
  const canEdit = await SharingService.canPerformAction(boardId, userId, 'canEdit');
  if (!canEdit) {
    return res.status(403).json({ message: 'You do not have permission to edit this board' });
  }

  const board = await Board.findOne({ id: boardId });
  if (!board) {
    return res.status(404).json({ message: 'Board not found' });
  }
  const column = board.columns.find((col: any) => col.id === req.params.columnId);
  if (!column) return res.status(404).json({ message: 'Column not found' });
  column.taskIds = taskIds;
  column.updatedAt = getCurrentTimestamp();
  board.updatedAt = getCurrentTimestamp();
  await board.save();
  
  res.json(board.toJSON());
}));

// Move task between columns (with access control)
router.post('/:boardId/tasks/:taskId/move', asyncHandler(async (req: express.Request, res: express.Response) => {
  const { fromColumnId, toColumnId, newIndex } = req.body;
  const { boardId, taskId } = req.params;
  const userId = (req as any).user.id;

  // Check if user can edit
  const canEdit = await SharingService.canPerformAction(boardId, userId, 'canEdit');
  if (!canEdit) {
    return res.status(403).json({ message: 'You do not have permission to edit this board' });
  }

  const board = await Board.findOne({ id: boardId });
  if (!board) {
    return res.status(404).json({ message: 'Board not found' });
  }

  const task = board.tasks.get(taskId);
  if (!task) {
    return res.status(404).json({ message: 'Task not found' });
  }

  const fromColumn = board.columns.find((col: any) => col.id === fromColumnId);
  const toColumn = board.columns.find((col: any) => col.id === toColumnId);
  
  if (!fromColumn || !toColumn) {
    return res.status(404).json({ message: 'Column not found' });
  }

  // Remove task from source column
  fromColumn.taskIds = fromColumn.taskIds.filter((id: string) => id !== taskId);
  fromColumn.updatedAt = getCurrentTimestamp();

  // Add task to destination column at specified index
  toColumn.taskIds.splice(newIndex, 0, taskId);
  toColumn.updatedAt = getCurrentTimestamp();

  board.updatedAt = getCurrentTimestamp();
  await board.save();
  
  res.json(board.toJSON());
}));

export default router;
