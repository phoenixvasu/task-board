import express, { Request, Response } from 'express';
import auth from '../middleware/auth.js';
import SharingService from '../services/sharingService.js';
import Board from '../models/Board.js';
import User from '../models/User.js';
import { v4 as uuidv4 } from 'uuid';
import { io } from '../index.js';

const router = express.Router();

// Async handler utility for Express
const asyncHandler = (fn: Function) => (req: any, res: any, next: any) =>
  Promise.resolve(fn(req, res, next)).catch(next);

// All routes below require authentication
router.use(auth);

// Get board access information
router.get('/boards/:boardId/access', asyncHandler(async (req: express.Request, res: express.Response) => {
  const { boardId } = req.params;
  const userId = (req as any).user.id;

  const access = await SharingService.checkBoardAccess(boardId, userId);
  
  if (!access.hasAccess) {
    return res.status(403).json({ message: 'Access denied' });
  }

  res.json({
    hasAccess: true,
    role: access.role,
    permissions: access.permissions
  });
}));

// Get board members
router.get('/boards/:boardId/members', asyncHandler(async (req: express.Request, res: express.Response) => {
  const { boardId } = req.params;
  const userId = (req as any).user.id;

  // Check if user has access to view members
  const canView = await SharingService.canPerformAction(boardId, userId, 'canView');
  if (!canView) {
    return res.status(403).json({ message: 'Access denied' });
  }

  const members = await SharingService.getBoardMembers(boardId);
  res.json(members);
}));

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

  // Validate role
  if (!['admin', 'editor', 'viewer'].includes(role)) {
    return res.status(400).json({ message: 'Invalid role' });
  }

  // Check if user exists
  const user = await User.findById(userId);
  if (!user) {
    return res.status(404).json({ message: 'User not found' });
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

  // Check if updater has permission
  const canManageMembers = await SharingService.canPerformAction(boardId, updatedBy, 'canManageMembers');
  if (!canManageMembers) {
    return res.status(403).json({ message: 'You do not have permission to update member roles' });
  }

  // Validate role
  if (!['admin', 'editor', 'viewer'].includes(role)) {
    return res.status(400).json({ message: 'Invalid role' });
  }

  const success = await SharingService.updateMemberRole(boardId, userId, role, updatedBy);
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

  res.json({ message: 'Member role updated successfully' });
}));

// Create invite link
router.post('/boards/:boardId/invite-links', asyncHandler(async (req: express.Request, res: express.Response) => {
  const { boardId } = req.params;
  const { role, expiresAt, maxUses } = req.body;
  const createdBy = (req as any).user.id;

  // Check if creator has permission to invite
  const canInvite = await SharingService.canPerformAction(boardId, createdBy, 'canInvite');
  if (!canInvite) {
    return res.status(403).json({ message: 'You do not have permission to create invite links' });
  }

  // Validate role
  if (!['admin', 'editor', 'viewer'].includes(role)) {
    return res.status(400).json({ message: 'Invalid role' });
  }

  const inviteLink = await SharingService.createInviteLink(boardId, role, createdBy, {
    expiresAt,
    maxUses
  });

  if (!inviteLink) {
    return res.status(400).json({ message: 'Failed to create invite link' });
  }

  // Generate the full invite URL
  const baseUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
  const inviteUrl = `${baseUrl}/invite/${inviteLink.token}`;

  res.json({
    message: 'Invite link created successfully',
    inviteLink: {
      id: inviteLink.id,
      role: inviteLink.role,
      createdAt: inviteLink.createdAt,
      expiresAt: inviteLink.expiresAt,
      maxUses: inviteLink.maxUses,
      usedCount: inviteLink.usedCount,
      inviteUrl
    }
  });
}));

// Get invite links for a board
router.get('/boards/:boardId/invite-links', asyncHandler(async (req: express.Request, res: express.Response) => {
  const { boardId } = req.params;
  const userId = (req as any).user.id;

  // Check if user has permission to view invite links
  const canInvite = await SharingService.canPerformAction(boardId, userId, 'canInvite');
  if (!canInvite) {
    return res.status(403).json({ message: 'You do not have permission to view invite links' });
  }

  const inviteLinks = await SharingService.getInviteLinks(boardId);
  
  // Generate full URLs for each invite link
  const baseUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
  const linksWithUrls = inviteLinks.map(link => ({
    id: link.id,
    role: link.role,
    createdAt: link.createdAt,
    expiresAt: link.expiresAt,
    maxUses: link.maxUses,
    usedCount: link.usedCount,
    inviteUrl: `${baseUrl}/invite/${link.token}`
  }));

  res.json(linksWithUrls);
}));

// Revoke invite link
router.delete('/boards/:boardId/invite-links/:linkId', asyncHandler(async (req: express.Request, res: express.Response) => {
  const { boardId, linkId } = req.params;
  const revokedBy = (req as any).user.id;

  // Check if revoker has permission
  const canInvite = await SharingService.canPerformAction(boardId, revokedBy, 'canInvite');
  if (!canInvite) {
    return res.status(403).json({ message: 'You do not have permission to revoke invite links' });
  }

  const success = await SharingService.revokeInviteLink(boardId, linkId, revokedBy);
  if (!success) {
    return res.status(400).json({ message: 'Failed to revoke invite link' });
  }

  res.json({ message: 'Invite link revoked successfully' });
}));

// Accept invite link (public endpoint - no auth required)
router.post('/invite/accept', asyncHandler(async (req: express.Request, res: express.Response) => {
  const { token } = req.body;
  const userId = (req as any).user?.id;

  if (!userId) {
    return res.status(401).json({ message: 'Authentication required' });
  }

  const result = await SharingService.acceptInviteLink(token, userId);
  
  if (!result.success) {
    return res.status(400).json({ message: result.message });
  }

  res.json({
    message: 'Successfully joined board',
    boardId: result.boardId
  });
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

// Get board sharing settings
router.get('/boards/:boardId/sharing-settings', asyncHandler(async (req: express.Request, res: express.Response) => {
  const { boardId } = req.params;
  const userId = (req as any).user.id;

  // Check if user has access
  const access = await SharingService.checkBoardAccess(boardId, userId);
  if (!access.hasAccess) {
    return res.status(403).json({ message: 'Access denied' });
  }

  const board = await Board.findOne({ id: boardId });
  if (!board) {
    return res.status(404).json({ message: 'Board not found' });
  }

  res.json({
    isPublic: board.isPublic,
    settings: board.settings,
    memberCount: board.members.length,
    inviteLinkCount: board.inviteLinks.filter(link => link.isActive).length
  });
}));

// Update board sharing settings
router.put('/boards/:boardId/sharing-settings', asyncHandler(async (req: express.Request, res: express.Response) => {
  const { boardId } = req.params;
  const { isPublic, settings } = req.body;
  const userId = (req as any).user.id;

  // Check if user has permission to manage sharing settings
  const canManageMembers = await SharingService.canPerformAction(boardId, userId, 'canManageMembers');
  if (!canManageMembers) {
    return res.status(403).json({ message: 'You do not have permission to update sharing settings' });
  }

  const board = await Board.findOne({ id: boardId });
  if (!board) {
    return res.status(404).json({ message: 'Board not found' });
  }

  // Update settings
  if (typeof isPublic === 'boolean') {
    board.isPublic = isPublic;
  }

  if (settings) {
    board.settings = { ...board.settings, ...settings };
  }

  board.updatedAt = new Date().toISOString();
  await board.save();

  // Emit socket event for real-time updates
  io.to(boardId).emit('sharing-settings-updated', {
    boardId,
    isPublic: board.isPublic,
    settings: board.settings,
    updatedBy: userId,
    timestamp: new Date().toISOString()
  });

  res.json({ message: 'Sharing settings updated successfully' });
}));

export default router; 