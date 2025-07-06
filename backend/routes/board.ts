import express, { Request, Response } from 'express';
import Board from '../models/Board.js';
import User from '../models/User.js';
import auth from '../middleware/auth.js';
import { v4 as uuidv4 } from 'uuid';
import { io } from '../index.js';
import SharingService from '../services/sharingService.js';
import mongoose from 'mongoose';

const router = express.Router();

// Helper: generate timestamp
const getCurrentTimestamp = (): string => new Date().toISOString();

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
  
  // Get boards shared with user
  const sharedBoards = await SharingService.getSharedBoards(userId);
  
  // Combine and format results
  const allBoards = [
    ...ownedBoards.map(board => ({
      ...board.toObject(),
      userRole: 'owner',
      isOwner: true
    })),
    ...sharedBoards.map(shared => ({
      boardId: shared.boardId,
      userRole: shared.role,
      isOwner: false
    }))
  ];
  
  res.json(allBoards);
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
    
    res.status(201).json(board);
  } catch (error) {
    console.error('Board creation failed:', error);
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
  const response = board.toObject() as any;
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
  
  // Emit socket event for real-time updates
  io.to(id).emit('board-updated', {
    boardId: id,
    board: board.toObject(),
    updatedBy: (req as any).user.username,
    timestamp: new Date().toISOString()
  });
  
  res.json(board);
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
    

    
    // Emit socket event for real-time updates
    io.to(id).emit('board-deleted', {
      boardId: id,
      deletedBy: (req as any).user.username,
      timestamp: new Date().toISOString()
    });
    
    res.json({ message: 'Board deleted successfully' });
  } catch (error) {
    console.error('Board deletion failed:', error);
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
  
  // Emit socket event for real-time updates
  io.to(boardId).emit('column-added', {
    boardId,
    column,
    addedBy: (req as any).user.username,
    timestamp: new Date().toISOString()
  });
  
  res.status(201).json(board);
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
  
  // Emit socket event for real-time updates
  io.to(boardId).emit('column-updated', {
    boardId,
    columnId: req.params.columnId,
    column,
    updatedBy: (req as any).user.username,
    timestamp: new Date().toISOString()
  });
  
  res.json(board);
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
  
  // Emit socket event for real-time updates
  io.to(boardId).emit('column-deleted', {
    boardId,
    columnId: req.params.columnId,
    deletedBy: (req as any).user.username,
    timestamp: new Date().toISOString()
  });
  
  res.json(board);
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
  
  // Emit socket event for real-time updates
  io.to(boardId).emit('columns-reordered', {
    boardId,
    columnIds,
    reorderedBy: (req as any).user.username,
    timestamp: new Date().toISOString()
  });
  
  res.json(board);
}));

// --- TASK ENDPOINTS ---

// Add task (with access control)
router.post('/:boardId/columns/:columnId/tasks', asyncHandler(async (req: express.Request, res: express.Response) => {
  const { title, description, createdBy, assignedTo, priority, dueDate } = req.body;
  const { boardId } = req.params;
  const userId = (req as any).user.id;

  // Check if user can edit
  const canEdit = await SharingService.canPerformAction(boardId, userId, 'canEdit');
  if (!canEdit) {
    return res.status(403).json({ message: 'You do not have permission to edit this board' });
  }

  const timestamp = getCurrentTimestamp();
  const taskId = uuidv4();
  
  // Helper function to safely create ObjectId
  const createSafeObjectId = (id: string) => {
    try {
      // Check if it's already a valid ObjectId
      if (mongoose.Types.ObjectId.isValid(id)) {
        return new mongoose.Types.ObjectId(id);
      }
      // If not valid, create a new ObjectId (this will be the current user)
      return new mongoose.Types.ObjectId();
    } catch (error) {
      console.error('Invalid ObjectId:', id, error);
      return new mongoose.Types.ObjectId();
    }
  };
  
  // Validate and set default values for required fields
  const taskCreatedBy = createdBy && createdBy.trim() ? createSafeObjectId(createdBy) : createSafeObjectId(userId);
  const taskAssignedTo = assignedTo && assignedTo.trim() ? createSafeObjectId(assignedTo) : undefined; // Allow undefined assignment
  const taskDescription = description && description.trim() ? description : 'Task description';
  const taskDueDate = dueDate && dueDate.trim() ? dueDate : new Date().toISOString().split('T')[0];
  
  const task = {
    id: taskId,
    title,
    description: taskDescription,
    createdBy: taskCreatedBy,
    assignedTo: taskAssignedTo,
    priority: priority || 'medium',
    dueDate: taskDueDate,
    createdAt: timestamp,
    updatedAt: timestamp,
  };
  
  const board = await Board.findOne({ id: boardId });
  if (!board) {
    return res.status(404).json({ message: 'Board not found' });
  }
  board.tasks.set(taskId, task);
  const column = board.columns.find((col: any) => col.id === req.params.columnId);
  if (!column) return res.status(404).json({ message: 'Column not found' });
  column.taskIds.push(taskId);
  column.updatedAt = timestamp;
  board.updatedAt = timestamp;
  await board.save();
  
  // Emit socket event for real-time updates
  io.to(boardId).emit('task-added', {
    boardId,
    columnId: req.params.columnId,
    taskId,
    task,
    addedBy: (req as any).user.username,
    timestamp: new Date().toISOString()
  });
  
  res.status(201).json(board);
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
  
  // Emit socket event for real-time updates
  io.to(boardId).emit('task-updated', {
    boardId,
    taskId: req.params.taskId,
    task,
    updatedBy: (req as any).user.username,
    timestamp: new Date().toISOString()
  });
  
  res.json(board);
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
  
  // Emit socket event for real-time updates
  io.to(boardId).emit('task-deleted', {
    boardId,
    taskId: req.params.taskId,
    deletedBy: (req as any).user.username,
    timestamp: new Date().toISOString()
  });
  
  res.json(board);
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
  
  // Emit socket event for real-time updates
  io.to(boardId).emit('tasks-reordered', {
    boardId,
    columnId: req.params.columnId,
    taskIds,
    reorderedBy: (req as any).user.username,
    timestamp: new Date().toISOString()
  });
  
  res.json(board);
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
  
  // Emit socket event for real-time updates
  io.to(boardId).emit('task-moved', {
    boardId,
    taskId,
    fromColumnId,
    toColumnId,
    newIndex,
    movedBy: (req as any).user.username,
    timestamp: new Date().toISOString()
  });
  
  res.json(board);
}));

export default router;
