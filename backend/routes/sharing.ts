import express from 'express';
import { io } from '../index.js';
import SharingService from '../services/sharingService.js';
import Board from '../models/Board.js';
import auth from '../middleware/auth.js';

const router = express.Router();

const asyncHandler = (fn: Function) => (req: any, res: any, next: any) =>
  Promise.resolve(fn(req, res, next)).catch(next);

// All routes below require authentication
router.use(auth);

// Add member to board
router.post('/boards/:boardId/members', asyncHandler(async (req: express.Request, res: express.Response) => {
  const { boardId } = req.params;
  const { userId, role } = req.body;
  const invitedBy = (req as any).user.id;

  // Check if inviter has permission to invite
  const canInvite = await SharingService.canPerformAction(boardId, invitedBy, 'canInvite');
  if (!canInvite) {
    return res.status(403).json({ message: 'You do not have permission to invite members' });
  }

  // Validate role - only editor and viewer are allowed
  if (!['editor', 'viewer'].includes(role)) {
    return res.status(400).json({ message: 'Invalid role. Only editor and viewer roles are allowed.' });
  }

  const success = await SharingService.addMember(boardId, userId, role, invitedBy);
  if (!success) {
    return res.status(400).json({ message: 'Failed to add member' });
  }

  // Emit socket event for real-time updates
  io.to(boardId).emit('member-added', {
    boardId,
    userId,
    role,
    addedBy: invitedBy,
    timestamp: new Date().toISOString()
  });

  res.json({ message: 'Member added successfully' });
}));

// Get board members
router.get('/boards/:boardId/members', asyncHandler(async (req: express.Request, res: express.Response) => {
  const { boardId } = req.params;
  const userId = (req as any).user.id;

  // Check if user has access to the board
  const access = await SharingService.checkBoardAccess(boardId, userId);
  if (!access.hasAccess) {
    return res.status(403).json({ message: 'You do not have access to this board' });
  }

  const members = await SharingService.getBoardMembers(boardId);
  res.json(members);
}));

// Remove member from board
router.delete('/boards/:boardId/members/:userId', asyncHandler(async (req: express.Request, res: express.Response) => {
  const { boardId, userId } = req.params;
  const removedBy = (req as any).user.id;

  // Check if remover has permission
  const canManageMembers = await SharingService.canPerformAction(boardId, removedBy, 'canManageMembers');
  if (!canManageMembers) {
    return res.status(403).json({ message: 'You do not have permission to remove members' });
  }

  const success = await SharingService.removeMember(boardId, userId, removedBy);
  if (!success) {
    return res.status(400).json({ message: 'Failed to remove member' });
  }

  // Emit socket event for real-time updates
  io.to(boardId).emit('member-removed', {
    boardId,
    userId,
    removedBy,
    timestamp: new Date().toISOString()
  });

  res.json({ message: 'Member removed successfully' });
}));

// Update member role
router.put('/boards/:boardId/members/:userId/role', asyncHandler(async (req: express.Request, res: express.Response) => {
  const { boardId, userId } = req.params;
  const { role } = req.body;
  const updatedBy = (req as any).user.id;

  console.log('Role update request received:', { boardId, userId, role, updatedBy });

  // Check if updater has permission
  const canManageMembers = await SharingService.canPerformAction(boardId, updatedBy, 'canManageMembers');
  console.log('Can manage members:', canManageMembers);
  if (!canManageMembers) {
    return res.status(403).json({ message: 'You do not have permission to update member roles' });
  }

  // Validate role - only editor and viewer are allowed
  if (!['editor', 'viewer'].includes(role)) {
    return res.status(400).json({ message: 'Invalid role. Only editor and viewer roles are allowed.' });
  }

  const success = await SharingService.updateMemberRole(boardId, userId, role, updatedBy);
  console.log('Role update service result:', success);
  if (!success) {
    return res.status(400).json({ message: 'Failed to update member role' });
  }

  // Emit socket event for real-time updates
  io.to(boardId).emit('member-role-updated', {
    boardId,
    userId,
    newRole: role,
    updatedBy,
    timestamp: new Date().toISOString()
  });

  console.log('Role update successful, emitting socket event');
  res.json({ message: 'Member role updated successfully' });
}));

// Get board access for current user
router.get('/boards/:boardId/access', asyncHandler(async (req: express.Request, res: express.Response) => {
  const { boardId } = req.params;
  const userId = (req as any).user.id;

  const access = await SharingService.checkBoardAccess(boardId, userId);
  res.json(access);
}));

// Get boards shared with current user
router.get('/shared-boards', asyncHandler(async (req: express.Request, res: express.Response) => {
  const userId = (req as any).user.id;

  const sharedBoards = await SharingService.getSharedBoards(userId);
  
  // Get board details for each shared board
  const boardsWithDetails = await Promise.all(
    sharedBoards.map(async (sharedBoard) => {
      const board = await Board.findOne({ id: sharedBoard.boardId });
      if (!board) return null;

      return {
        boardId: board.id,
        name: board.name,
        description: board.description,
        role: sharedBoard.role,
        permissions: sharedBoard.permissions,
        createdAt: board.createdAt,
        updatedAt: board.updatedAt
      };
    })
  );

  res.json(boardsWithDetails.filter(Boolean));
}));

export default router; 