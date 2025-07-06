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
        return {
          canView: true,
          canEdit: true,
          canDelete: true,
          canInvite: true,
          canManageMembers: true
        };
      case 'editor':
        return {
          canView: true,
          canEdit: true,
          canDelete: false,
          canInvite: false,
          canManageMembers: false
        };
      case 'viewer':
        return {
          canView: true,
          canEdit: false,
          canDelete: false,
          canInvite: false,
          canManageMembers: false
        };
      default:
        return {
          canView: false,
          canEdit: false,
          canDelete: false,
          canInvite: false,
          canManageMembers: false
        };
    }
  }

  // Check if user can perform a specific action
  static async canPerformAction(boardId: string, userId: string, action: keyof UserPermissions): Promise<boolean> {
    const access = await this.checkBoardAccess(boardId, userId);
    return access.permissions[action];
  }

  // Add member to board
  static async addMember(boardId: string, userId: string, role: "editor" | "viewer", invitedBy: string): Promise<boolean> {
    try {
      const board = await Board.findOne({ id: boardId });
      if (!board) return false;

      // Check if inviter has permission to invite
      const canInvite = await this.canPerformAction(boardId, invitedBy, 'canInvite');
      if (!canInvite) {
        console.error('User does not have permission to invite members:', invitedBy);
        return false;
      }

      // Check if user is already a member
      const existingMember = board.members.find(m => {
        const memberUserId = typeof m.userId === 'object' && m.userId._id 
          ? m.userId._id.toString() 
          : m.userId.toString();
        return memberUserId === userId;
      });

      if (existingMember) {
        console.error('User is already a member of this board');
        return false;
      }

      // Validate role - only editor and viewer are allowed for new members
      if (!['editor', 'viewer'].includes(role)) {
        console.error('Invalid role for new member:', role);
        return false;
      }

      const newMember: IBoardMember = {
        userId: new mongoose.Types.ObjectId(userId),
        role,
        invitedBy: new mongoose.Types.ObjectId(invitedBy),
        invitedAt: new Date().toISOString(),
        joinedAt: new Date().toISOString(),
        permissions: this.getPermissionsForRole(role)
      };

      board.members.push(newMember);
      await board.save();
      return true;
    } catch (error) {
      console.error('Error adding member to board:', error);
      return false;
    }
  }

  // Remove member from board
  static async removeMember(boardId: string, userId: string, removedBy: string): Promise<boolean> {
    try {
      const board = await Board.findOne({ id: boardId });
      if (!board) return false;

      // Check if remover has permission
      const canManageMembers = await this.canPerformAction(boardId, removedBy, 'canManageMembers');
      if (!canManageMembers) {
        console.error('User does not have permission to remove members:', removedBy);
        return false;
      }

      // Find member to remove
      const memberIndex = board.members.findIndex(m => {
        const memberUserId = typeof m.userId === 'object' && m.userId._id 
          ? m.userId._id.toString() 
          : m.userId.toString();
        return memberUserId === userId;
      });

      if (memberIndex === -1) {
        console.error('Member not found:', userId);
        return false;
      }

      // Don't allow removing the owner
      if (board.members[memberIndex].role === 'owner') {
        console.error('Cannot remove owner from board');
        return false;
      }

      // Don't allow removing yourself
      if (board.members[memberIndex].userId.toString() === removedBy) {
        console.error('Cannot remove yourself from board');
        return false;
      }

      board.members.splice(memberIndex, 1);
      await board.save();
      return true;
    } catch (error) {
      console.error('Error removing member from board:', error);
      return false;
    }
  }

  // Update member role
  static async updateMemberRole(boardId: string, userId: string, newRole: "editor" | "viewer", updatedBy: string): Promise<boolean> {
    try {
      const board = await Board.findOne({ id: boardId });
      if (!board) return false;

      // Check if updater has permission
      const canManageMembers = await this.canPerformAction(boardId, updatedBy, 'canManageMembers');
      if (!canManageMembers) {
        console.error('User does not have permission to update member roles:', updatedBy);
        return false;
      }

      // Find member to update
      const member = board.members.find(m => {
        const memberUserId = typeof m.userId === 'object' && m.userId._id 
          ? m.userId._id.toString() 
          : m.userId.toString();
        return memberUserId === userId;
      });

      if (!member) {
        console.error('Member not found:', userId);
        return false;
      }

      // Don't allow changing owner role
      if (member.role === 'owner') {
        console.error('Cannot change owner role');
        return false;
      }

      // Validate new role - only editor and viewer are allowed
      if (!['editor', 'viewer'].includes(newRole)) {
        console.error('Invalid role for member update:', newRole);
        return false;
      }

      member.role = newRole;
      member.permissions = this.getPermissionsForRole(newRole);
      await board.save();
      return true;
    } catch (error) {
      console.error('Error updating member role:', error);
      return false;
    }
  }

  // Check board access for a user
  static async checkBoardAccess(boardId: string, userId: string): Promise<BoardAccess> {
    try {
      const board = await Board.findOne({ id: boardId });
      if (!board) {
        return {
          hasAccess: false,
          permissions: {
            canView: false,
            canEdit: false,
            canDelete: false,
            canInvite: false,
            canManageMembers: false
          }
        };
      }

      // Check if user is the owner
      if (board.createdBy.toString() === userId) {
        return {
          hasAccess: true,
          role: 'owner',
          permissions: this.getPermissionsForRole('owner')
        };
      }

      // Check if user is a member
      const member = board.members.find(m => {
        const memberUserId = typeof m.userId === 'object' && m.userId._id 
          ? m.userId._id.toString() 
          : m.userId.toString();
        return memberUserId === userId;
      });

      if (member) {
        return {
          hasAccess: true,
          role: member.role,
          permissions: member.permissions
        };
      }

      // Check if board is public
      if (board.isPublic) {
        return {
          hasAccess: true,
          role: 'viewer',
          permissions: this.getPermissionsForRole('viewer')
        };
      }

      return {
        hasAccess: false,
        permissions: {
          canView: false,
          canEdit: false,
          canDelete: false,
          canInvite: false,
          canManageMembers: false
        }
      };
    } catch (error) {
      console.error('Error checking board access:', error);
      return {
        hasAccess: false,
        permissions: {
          canView: false,
          canEdit: false,
          canDelete: false,
          canInvite: false,
          canManageMembers: false
        }
      };
    }
  }

  // Get board members
  static async getBoardMembers(boardId: string): Promise<any[]> {
    try {
      const board = await Board.findOne({ id: boardId }).populate('members.userId', 'name email');
      if (!board) return [];

      return board.members.map(member => ({
        userId: typeof member.userId === 'object' && member.userId._id 
          ? member.userId._id.toString() 
          : member.userId.toString(),
        username: typeof member.userId === 'object' && 'name' in member.userId && member.userId.name
          ? member.userId.name 
          : 'Unknown User',
        email: typeof member.userId === 'object' && 'email' in member.userId && member.userId.email
          ? member.userId.email 
          : 'unknown@example.com',
        role: member.role,
        invitedAt: member.invitedAt,
        joinedAt: member.joinedAt
      }));
    } catch (error) {
      console.error('Error getting board members:', error);
      return [];
    }
  }

  // Get boards shared with a user
  static async getSharedBoards(userId: string): Promise<any[]> {
    try {
      // Only get boards where user is a member but NOT the owner
      const boards = await Board.find({
        'members.userId': new mongoose.Types.ObjectId(userId),
        createdBy: { $ne: new mongoose.Types.ObjectId(userId) }
      });

      return boards.map(board => {
        const member = board.members.find(m => {
          const memberUserId = typeof m.userId === 'object' && m.userId._id 
            ? m.userId._id.toString() 
            : m.userId.toString();
          return memberUserId === userId;
        });

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
          tasks: board.tasks
        };
      });
    } catch (error) {
      console.error('Error getting shared boards:', error);
      return [];
    }
  }
}

export default SharingService; 