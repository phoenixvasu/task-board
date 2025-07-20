import express from 'express';
import SharingService, { BoardAccess } from '../services/sharingService.js';
import Board from '../models/Board.js';
import auth from '../middleware/auth.js';

const router = express.Router();
const asyncHandler = (fn: Function) => (req: any, res: any, next: any) =>
  Promise.resolve(fn(req, res, next)).catch(next);

router.use(auth);

// Add member to board
interface AddMemberRequestBody {
  userId: string;
  role: 'editor' | 'viewer';
}

interface AddMemberRequest extends express.Request {
  params: {
    boardId: string;
  };
  body: AddMemberRequestBody;
  user: { id: string };
}

router.post(
  '/boards/:boardId/members',
  asyncHandler(async (req: AddMemberRequest, res: express.Response) => {
    const { boardId } = req.params;
    const { userId, role } = req.body;
    const invitedBy = req.user.id;

    // Check if inviter has permission to invite
    const canInvite: boolean = await SharingService.canPerformAction(boardId, invitedBy, 'canInvite');
    if (!canInvite) {
      return res.status(403).json({ message: 'You do not have permission to invite members' });
    }

    // Validate role - only editor and viewer are allowed
    if (!['editor', 'viewer'].includes(role)) {
      return res.status(400).json({ message: 'Invalid role. Only editor and viewer roles are allowed.' });
    }

    const success: boolean = await SharingService.addMember(boardId, userId, role, invitedBy);
    if (!success) {
      return res.status(400).json({ message: 'Failed to add member' });
    }

    res.json({ message: 'Member added successfully' });
  })
);

// Get board members
interface BoardMember {
  userId: string;
  role: 'editor' | 'viewer';
  invitedBy: string;
  joinedAt: Date;
}

// Use BoardAccess type from SharingService for compatibility
// interface BoardAccess {
//   hasAccess: boolean;
//   role?: 'editor' | 'viewer' | 'owner';
//   permissions?: string[];
// }

interface TypedRequest<T = any> extends express.Request {
  body: T;
  user: { id: string };
}

router.get(
  '/boards/:boardId/members',
  asyncHandler(async (req: TypedRequest, res: express.Response) => {
    const { boardId } = req.params;
    const userId = req.user.id;

    // Check if user has access to the board
    const access: BoardAccess = await SharingService.checkBoardAccess(boardId, userId);
    if (!access.hasAccess) {
      return res.status(403).json({ message: 'You do not have access to this board' });
    }

    const members: BoardMember[] = await SharingService.getBoardMembers(boardId);
    res.json(members);
  })
);

// Remove member from board
interface RemoveMemberRequest extends express.Request {
  params: {
    boardId: string;
    userId: string;
  };
  user: { id: string };
}

router.delete(
  '/boards/:boardId/members/:userId',
  asyncHandler(async (req: RemoveMemberRequest, res: express.Response) => {
    const { boardId, userId } = req.params;
    const removedBy = req.user.id;

    // Check if remover has permission
    const canManageMembers: boolean = await SharingService.canPerformAction(boardId, removedBy, 'canManageMembers');
    if (!canManageMembers) {
      return res.status(403).json({ message: 'You do not have permission to remove members' });
    }

    const success: boolean = await SharingService.removeMember(boardId, userId, removedBy);
    if (!success) {
      return res.status(400).json({ message: 'Failed to remove member' });
    }

    res.json({ message: 'Member removed successfully' });
  })
);

// Update member role
interface UpdateMemberRoleRequestBody {
  role: 'editor' | 'viewer';
}

interface UpdateMemberRoleRequest extends express.Request {
  params: {
    boardId: string;
    userId: string;
  };
  body: UpdateMemberRoleRequestBody;
  user: { id: string };
}

router.put(
  '/boards/:boardId/members/:userId/role',
  asyncHandler(async (req: UpdateMemberRoleRequest, res: express.Response) => {
    const { boardId, userId } = req.params;
    const { role } = req.body;
    const updatedBy = req.user.id;

    // Check if updater has permission
    const canManageMembers: boolean = await SharingService.canPerformAction(boardId, updatedBy, 'canManageMembers');
    if (!canManageMembers) {
      return res.status(403).json({ message: 'You do not have permission to update member roles' });
    }

    // Validate role - only editor and viewer are allowed
    if (!['editor', 'viewer'].includes(role)) {
      return res.status(400).json({ message: 'Invalid role. Only editor and viewer roles are allowed.' });
    }

    const success: boolean = await SharingService.updateMemberRole(boardId, userId, role, updatedBy);
    if (!success) {
      return res.status(400).json({ message: 'Failed to update member role' });
    }

    res.json({ message: 'Member role updated successfully' });
  })
);

// Get board access for current user
interface BoardAccessRequest extends express.Request {
  params: {
    boardId: string;
  };
  user: { id: string };
}

interface BoardAccessResponse extends express.Response {}

router.get(
  '/boards/:boardId/access',
  asyncHandler(async (req: BoardAccessRequest, res: BoardAccessResponse) => {
    const { boardId } = req.params;
    const userId = req.user.id;

    const access: BoardAccess = await SharingService.checkBoardAccess(boardId, userId);
    res.json(access);
  })
);

// Get boards shared with current user
interface SharedBoard {
  boardId: string;
  role: 'editor' | 'viewer' | 'owner';
  permissions: string[];
}

interface BoardDetails {
  boardId: string;
  name: string;
  description: string;
  role: 'editor' | 'viewer' | 'owner';
  permissions: string[];
  createdAt: Date;
  updatedAt: Date;
}

interface SharedBoardsRequest extends express.Request {
  user: { id: string };
}

interface SharedBoardsResponse extends express.Response {}

router.get(
  '/shared-boards',
  asyncHandler(async (req: SharedBoardsRequest, res: SharedBoardsResponse) => {
    const userId = req.user.id;

    const sharedBoards: SharedBoard[] = await SharingService.getSharedBoards(userId);

    // Get board details for each shared board
    const boardsWithDetails: (BoardDetails | null)[] = await Promise.all(
      sharedBoards.map(async (sharedBoard: SharedBoard): Promise<BoardDetails | null> => {
        const board = await Board.findOne({ id: sharedBoard.boardId });
        if (!board) return null;

        return {
          boardId: board.id,
          name: board.name,
          description: board.description ?? '',
          role: sharedBoard.role,
          permissions: sharedBoard.permissions,
          createdAt: board.createdAt,
          updatedAt: board.updatedAt,
        };
      })
    );

    res.json(boardsWithDetails.filter(Boolean));
  })
);

export default router;