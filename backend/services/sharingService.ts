import { v4 as uuidv4 } from 'uuid';
import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';
import Board from '../models/Board.js';
import User from '../models/User.js';
import { IBoardMember } from '../models/Board.js';

export interface UserPermissions {
  canView: boolean;
  canEdit: boolean;
  canDelete: boolean;
  canInvite: boolean;
  canManageMembers: boolean;
}

export interface BoardAccess {
  hasAccess: boolean;
  role?: 'owner' | 'editor' | 'viewer';
  permissions: UserPermissions;
}

export class SharingService {
  // Get permissions for a specific role
  static getPermissionsForRole(role: string): UserPermissions {
    switch (role) {
      case 'owner':
        return { canView: true, canEdit: true, canDelete: true, canInvite: true, canManageMembers: true };
      case 'editor':
        return { canView: true, canEdit: true, canDelete: false, canInvite: false, canManageMembers: false };
      case 'viewer':
        return { canView: true, canEdit: false, canDelete: false, canInvite: false, canManageMembers: false };
      default:
        return { canView: false, canEdit: false, canDelete: false, canInvite: false, canManageMembers: false };
    }
  }

  // Check if user can perform a specific action
  static async canPerformAction(boardId: string, userId: string, action: keyof UserPermissions): Promise<boolean> {
    const access = await this.checkBoardAccess(boardId, userId);
    return access.permissions[action];
  }

  // Add member to board and emit real-time event
  static async addMember(
    boardId: string,
    userId: string,
    role: "editor" | "viewer",
    invitedBy: string,
  ): Promise<boolean> {
    const session = await mongoose.startSession();
    session.startTransaction();
    try {
      if (!mongoose.Types.ObjectId.isValid(userId)) {
        throw new Error('Invalid userId');
      }
      const userObjId = new mongoose.Types.ObjectId(userId);
      const invitedByObjId = new mongoose.Types.ObjectId(invitedBy);
      const board = await Board.findOne({ id: boardId }).session(session);
      if (!board) throw new Error('Board not found');

      // Permission check
      const canInvite = await this.canPerformAction(boardId, invitedBy, 'canInvite');
      if (!canInvite) throw new Error('No permission to invite');

      // Prevent duplicate
      if (board.members.some(m => m.userId.toString() === userObjId.toString())) throw new Error('Already a member');

      if (!['editor', 'viewer'].includes(role)) throw new Error('Invalid role');

      const newMember: IBoardMember = {
        userId: userObjId,
        role,
        invitedBy: invitedByObjId,
        invitedAt: new Date(),
        joinedAt: new Date(),
        permissions: this.getPermissionsForRole(role)
      };

      board.members.push(newMember);

      await board.save({ session }).then(
        (saved) => {},
        (err) => console.error('[addMember] Error on save:', err)
      );
      await session.commitTransaction();

      // Log the board after save for debugging
      const freshBoard = await Board.findOne({ id: boardId });
      return true;
    } catch (error) {
      await session.abortTransaction();
      if (error instanceof Error) {
        console.error('Error adding member:', error.message);
      } else {
        console.error('Error adding member:', error);
      }
      return false;
    } finally {
      session.endSession();
    }
  }

  // Remove member from board and emit real-time event
  static async removeMember(
    boardId: string,
    userId: string,
    removedBy: string,
  ): Promise<boolean> {
    const session = await mongoose.startSession();
    session.startTransaction();
    try {
      const board = await Board.findOne({ id: boardId }).session(session);
      if (!board) throw new Error('Board not found');

      const canManageMembers = await this.canPerformAction(boardId, removedBy, 'canManageMembers');
      if (!canManageMembers) throw new Error('No permission to remove');

      const memberIndex = board.members.findIndex(m => m.userId.toString() === userId);
      if (memberIndex === -1) throw new Error('Member not found');
      if (board.members[memberIndex].role === 'owner') throw new Error('Cannot remove owner');
      if (userId === removedBy) throw new Error('Cannot remove yourself');

      board.members.splice(memberIndex, 1);
      await board.save({ session });
      await session.commitTransaction();

      return true;
    } catch (error) {
      await session.abortTransaction();
      if (error instanceof Error) {
        console.error('Error removing member:', error.message);
      } else {
        console.error('Error removing member:', error);
      }
      return false;
    } finally {
      session.endSession();
    }
  }

  // Update member role and emit real-time event
  static async updateMemberRole(
    boardId: string,
    userId: string,
    newRole: "editor" | "viewer",
    updatedBy: string,
  ): Promise<boolean> {
    try {
      const board = await Board.findOne({ id: boardId });
      if (!board) throw new Error('Board not found');

      const canManageMembers = await this.canPerformAction(boardId, updatedBy, 'canManageMembers');
      if (!canManageMembers) throw new Error('No permission to update roles');

      const member = board.members.find(m => m.userId.toString() === userId);
      if (!member) throw new Error('Member not found');
      if (member.role === 'owner') throw new Error('Cannot change owner role');
      if (!['editor', 'viewer'].includes(newRole)) throw new Error('Invalid new role');

      member.role = newRole;
      member.permissions = this.getPermissionsForRole(newRole);
      await board.save();

      return true;
    } catch (error) {
      if (error instanceof Error) {
        console.error('Error updating member role:', error.message);
      } else {
        console.error('Error updating member role:', error);
      }
      return false;
    }
  }

  // Check board access for a user
  static async checkBoardAccess(boardId: string, userId: string): Promise<BoardAccess> {
    try {
      const board = await Board.findOne({ id: boardId }).lean();
      if (!board) {
        return { hasAccess: false, permissions: this.getPermissionsForRole('none') };
      }
      if (board.createdBy.toString() === userId) {
        return { hasAccess: true, role: 'owner', permissions: this.getPermissionsForRole('owner') };
      }
      const member = board.members.find(m => m.userId.toString() === userId);
      if (member) {
        return { hasAccess: true, role: member.role, permissions: member.permissions };
      }
      if (board.isPublic) {
        return { hasAccess: true, role: 'viewer', permissions: this.getPermissionsForRole('viewer') };
      }
      return { hasAccess: false, permissions: this.getPermissionsForRole('none') };
    } catch (error) {
      if (error instanceof Error) {
        console.error('Error checking board access:', error.message);
      } else {
        console.error('Error checking board access:', error);
      }
      return { hasAccess: false, permissions: this.getPermissionsForRole('none') };
    }
  }

  // Get board members (lean, only needed fields)
  static async getBoardMembers(boardId: string): Promise<any[]> {
    try {
      const board = await Board.findOne({ id: boardId })
        .populate('members.userId', 'name email')
        .lean();
      if (!board) return [];
      const members = board.members.map(member => ({
        userId: member.userId._id?.toString() || member.userId.toString(),
        username: typeof member.userId === 'object' && 'name' in member.userId ? (member.userId as any).name : 'Unknown User',
        email: typeof member.userId === 'object' && 'email' in member.userId ? member.userId.email : 'unknown@example.com',
        role: member.role,
        invitedAt: member.invitedAt,
        joinedAt: member.joinedAt
      }));
      return members;
    } catch (error) {
      if (error instanceof Error) {
        console.error('Error getting board members:', error.message);
      } else {
        console.error('Error getting board members:', error);
      }
      return [];
    }
  }

  // Get boards shared with a user
  static async getSharedBoards(userId: string): Promise<any[]> {
    try {
      if (!mongoose.Types.ObjectId.isValid(userId)) {
        console.error('[getSharedBoards] Invalid userId:', userId);
        return [];
      }
      const userObjId = new mongoose.Types.ObjectId(userId);
      const boards = await Board.find({
        'members.userId': userObjId,
        createdBy: { $ne: userObjId }
      }).lean();
      return boards.map(board => {
        const member = board.members.find(m => m.userId.toString() === userObjId.toString());
        const role = member ? member.role : 'viewer';
        const permissions = this.getPermissionsForRole(role);
        return {
          boardId: board.id,
          name: board.name,
          description: board.description,
          role,
          permissions,
          createdAt: board.createdAt,
          updatedAt: board.updatedAt,
          columns: board.columns,
          tasks: board.tasks instanceof Map ? Object.fromEntries(board.tasks) : board.tasks
        };
      });
    } catch (error) {
      if (error instanceof Error) {
        console.error('Error getting shared boards:', error.message);
      } else {
        console.error('Error getting shared boards:', error);
      }
      return [];
    }
  }
}

export default SharingService;