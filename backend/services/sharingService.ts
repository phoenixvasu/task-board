import { v4 as uuidv4 } from 'uuid';
import jwt from 'jsonwebtoken';
import Board from '../models/Board.js';
import User from '../models/User.js';
import { IBoardMember, IInviteLink } from '../models/Board.js';

export interface UserPermissions {
  canView: boolean;
  canEdit: boolean;
  canDelete: boolean;
  canInvite: boolean;
  canManageMembers: boolean;
}

export interface BoardAccess {
  hasAccess: boolean;
  role?: "owner" | "admin" | "editor" | "viewer";
  permissions: UserPermissions;
  member?: IBoardMember;
}

export class SharingService {
  // Check if user has access to a board
  static async checkBoardAccess(boardId: string, userId: string): Promise<BoardAccess> {
    const board = await Board.findOne({ id: boardId });
    if (!board) {
      return { hasAccess: false, permissions: this.getDefaultPermissions() };
    }

    // Board owner has full access
    if (board.createdBy.toString() === userId) {
      return {
        hasAccess: true,
        role: "owner",
        permissions: {
          canView: true,
          canEdit: true,
          canDelete: true,
          canInvite: true,
          canManageMembers: true
        }
      };
    }

    // Check if user is a member
    const member = board.members.find(m => m.userId.toString() === userId);
    if (member) {
      return {
        hasAccess: true,
        role: member.role,
        permissions: member.permissions,
        member
      };
    }

    // Check if board is public
    if (board.isPublic) {
      return {
        hasAccess: true,
        role: "viewer",
        permissions: {
          canView: true,
          canEdit: false,
          canDelete: false,
          canInvite: false,
          canManageMembers: false
        }
      };
    }

    return { hasAccess: false, permissions: this.getDefaultPermissions() };
  }

  // Get user's role and permissions for a board
  static async getUserRole(boardId: string, userId: string): Promise<"owner" | "admin" | "editor" | "viewer" | null> {
    const access = await this.checkBoardAccess(boardId, userId);
    return access.role || null;
  }

  // Add member to board
  static async addMember(boardId: string, userId: string, role: "admin" | "editor" | "viewer", invitedBy: string): Promise<boolean> {
    const board = await Board.findOne({ id: boardId });
    if (!board) return false;

    // Check if user is already a member
    const existingMember = board.members.find(m => m.userId.toString() === userId);
    if (existingMember) {
      // Update existing member's role
      existingMember.role = role;
      existingMember.permissions = this.getPermissionsForRole(role);
      await board.save();
      return true;
    }

    // Add new member
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
  }

  // Remove member from board
  static async removeMember(boardId: string, userId: string, removedBy: string): Promise<boolean> {
    const board = await Board.findOne({ id: boardId });
    if (!board) return false;

    // Check if remover has permission
    const removerAccess = await this.checkBoardAccess(boardId, removedBy);
    if (!removerAccess.permissions.canManageMembers) return false;

    // Cannot remove owner
    if (board.createdBy.toString() === userId) return false;

    // Remove member
    board.members = board.members.filter(m => m.userId.toString() !== userId);
    await board.save();
    return true;
  }

  // Update member role
  static async updateMemberRole(boardId: string, userId: string, newRole: "admin" | "editor" | "viewer", updatedBy: string): Promise<boolean> {
    const board = await Board.findOne({ id: boardId });
    if (!board) return false;

    // Check if updater has permission
    const updaterAccess = await this.checkBoardAccess(boardId, updatedBy);
    if (!updaterAccess.permissions.canManageMembers) return false;

    // Cannot change owner's role
    if (board.createdBy.toString() === userId) return false;

    const member = board.members.find(m => m.userId.toString() === userId);
    if (!member) return false;

    member.role = newRole;
    member.permissions = this.getPermissionsForRole(newRole);
    await board.save();
    return true;
  }

  // Create invite link
  static async createInviteLink(boardId: string, role: "admin" | "editor" | "viewer", createdBy: string, options?: {
    expiresAt?: string;
    maxUses?: number;
  }): Promise<IInviteLink | null> {
    const board = await Board.findOne({ id: boardId });
    if (!board) return null;

    // Check if creator has permission to invite
    const creatorAccess = await this.checkBoardAccess(boardId, createdBy);
    if (!creatorAccess.permissions.canInvite) return null;

    const token = jwt.sign(
      { boardId, role, createdBy },
      process.env.JWT_SECRET as string,
      { expiresIn: '7d' }
    );

    const inviteLink: IInviteLink = {
      id: uuidv4(),
      token,
      role,
      createdBy: new mongoose.Types.ObjectId(createdBy),
      createdAt: new Date().toISOString(),
      expiresAt: options?.expiresAt,
      maxUses: options?.maxUses,
      usedCount: 0,
      isActive: true
    };

    board.inviteLinks.push(inviteLink);
    await board.save();
    return inviteLink;
  }

  // Accept invite link
  static async acceptInviteLink(token: string, userId: string): Promise<{ success: boolean; boardId?: string; message?: string }> {
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET as string) as any;
      const { boardId, role, createdBy } = decoded;

      const board = await Board.findOne({ id: boardId });
      if (!board) {
        return { success: false, message: "Board not found" };
      }

      // Find the invite link
      const inviteLink = board.inviteLinks.find(link => link.token === token);
      if (!inviteLink || !inviteLink.isActive) {
        return { success: false, message: "Invalid or expired invite link" };
      }

      // Check if link has expired
      if (inviteLink.expiresAt && new Date() > new Date(inviteLink.expiresAt)) {
        return { success: false, message: "Invite link has expired" };
      }

      // Check if max uses reached
      if (inviteLink.maxUses && inviteLink.usedCount >= inviteLink.maxUses) {
        return { success: false, message: "Invite link usage limit reached" };
      }

      // Check if user is already a member
      const existingMember = board.members.find(m => m.userId.toString() === userId);
      if (existingMember) {
        return { success: false, message: "You are already a member of this board" };
      }

      // Add user as member
      const newMember: IBoardMember = {
        userId: new mongoose.Types.ObjectId(userId),
        role,
        invitedBy: new mongoose.Types.ObjectId(createdBy),
        invitedAt: new Date().toISOString(),
        joinedAt: new Date().toISOString(),
        permissions: this.getPermissionsForRole(role)
      };

      board.members.push(newMember);
      inviteLink.usedCount += 1;
      await board.save();

      return { success: true, boardId };
    } catch (error) {
      return { success: false, message: "Invalid invite link" };
    }
  }

  // Revoke invite link
  static async revokeInviteLink(boardId: string, linkId: string, revokedBy: string): Promise<boolean> {
    const board = await Board.findOne({ id: boardId });
    if (!board) return false;

    // Check if revoker has permission
    const revokerAccess = await this.checkBoardAccess(boardId, revokedBy);
    if (!revokerAccess.permissions.canInvite) return false;

    const inviteLink = board.inviteLinks.find(link => link.id === linkId);
    if (!inviteLink) return false;

    inviteLink.isActive = false;
    await board.save();
    return true;
  }

  // Get board members
  static async getBoardMembers(boardId: string): Promise<Array<{
    userId: string;
    role: string;
    invitedAt: string;
    joinedAt?: string;
    user: {
      id: string;
      name: string;
      email: string;
      avatar?: string;
    };
  }>> {
    const board = await Board.findOne({ id: boardId }).populate('members.userId', 'name email avatar');
    if (!board) return [];

    return board.members.map(member => ({
      userId: member.userId.toString(),
      role: member.role,
      invitedAt: member.invitedAt,
      joinedAt: member.joinedAt,
      user: {
        id: member.userId.toString(),
        name: (member.userId as any).name,
        email: (member.userId as any).email,
        avatar: (member.userId as any).avatar
      }
    }));
  }

  // Get active invite links
  static async getInviteLinks(boardId: string): Promise<IInviteLink[]> {
    const board = await Board.findOne({ id: boardId });
    if (!board) return [];

    return board.inviteLinks.filter(link => link.isActive);
  }

  // Get permissions for a specific role
  static getPermissionsForRole(role: "owner" | "admin" | "editor" | "viewer"): UserPermissions {
    switch (role) {
      case "owner":
        return {
          canView: true,
          canEdit: true,
          canDelete: true,
          canInvite: true,
          canManageMembers: true
        };
      case "admin":
        return {
          canView: true,
          canEdit: true,
          canDelete: true,
          canInvite: true,
          canManageMembers: true
        };
      case "editor":
        return {
          canView: true,
          canEdit: true,
          canDelete: false,
          canInvite: false,
          canManageMembers: false
        };
      case "viewer":
        return {
          canView: true,
          canEdit: false,
          canDelete: false,
          canInvite: false,
          canManageMembers: false
        };
      default:
        return this.getDefaultPermissions();
    }
  }

  // Get default permissions (no access)
  static getDefaultPermissions(): UserPermissions {
    return {
      canView: false,
      canEdit: false,
      canDelete: false,
      canInvite: false,
      canManageMembers: false
    };
  }

  // Check if user can perform action
  static async canPerformAction(boardId: string, userId: string, action: keyof UserPermissions): Promise<boolean> {
    const access = await this.checkBoardAccess(boardId, userId);
    return access.permissions[action];
  }

  // Get boards shared with user
  static async getSharedBoards(userId: string): Promise<Array<{
    boardId: string;
    role: string;
    permissions: UserPermissions;
  }>> {
    const boards = await Board.find({
      $or: [
        { "members.userId": userId },
        { createdBy: userId }
      ]
    });

    return boards.map(board => {
      const isOwner = board.createdBy.toString() === userId;
      const member = board.members.find(m => m.userId.toString() === userId);
      
      return {
        boardId: board.id,
        role: isOwner ? "owner" : member?.role || "viewer",
        permissions: isOwner ? this.getPermissionsForRole("owner") : (member?.permissions || this.getDefaultPermissions())
      };
    });
  }
}

export default SharingService; 