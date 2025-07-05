import { create } from 'zustand';
import { api } from '../api';

export interface BoardMember {
  userId: string;
  role: 'owner' | 'admin' | 'editor' | 'viewer';
  invitedAt: string;
  joinedAt?: string;
  user: {
    id: string;
    name: string;
    email: string;
    avatar?: string;
  };
}

export interface InviteLink {
  id: string;
  role: 'admin' | 'editor' | 'viewer';
  createdAt: string;
  expiresAt?: string;
  maxUses?: number;
  usedCount: number;
  inviteUrl: string;
}

export interface BoardAccess {
  hasAccess: boolean;
  role?: 'owner' | 'admin' | 'editor' | 'viewer';
  permissions: {
    canView: boolean;
    canEdit: boolean;
    canDelete: boolean;
    canInvite: boolean;
    canManageMembers: boolean;
  };
}

export interface SharingSettings {
  isPublic: boolean;
  settings: {
    allowGuestAccess: boolean;
    requireApproval: boolean;
    defaultRole: 'admin' | 'editor' | 'viewer';
  };
  memberCount: number;
  inviteLinkCount: number;
}

interface SharingState {
  // Board members
  members: BoardMember[];
  isLoadingMembers: boolean;
  
  // Invite links
  inviteLinks: InviteLink[];
  isLoadingInviteLinks: boolean;
  
  // Board access
  boardAccess: BoardAccess | null;
  
  // Sharing settings
  sharingSettings: SharingSettings | null;
  
  // Actions
  fetchMembers: (boardId: string) => Promise<void>;
  addMember: (boardId: string, userId: string, role: 'admin' | 'editor' | 'viewer') => Promise<boolean>;
  removeMember: (boardId: string, userId: string) => Promise<boolean>;
  updateMemberRole: (boardId: string, userId: string, role: 'admin' | 'editor' | 'viewer') => Promise<boolean>;
  
  fetchInviteLinks: (boardId: string) => Promise<void>;
  createInviteLink: (boardId: string, role: 'admin' | 'editor' | 'viewer', options?: {
    expiresAt?: string;
    maxUses?: number;
  }) => Promise<InviteLink | null>;
  revokeInviteLink: (boardId: string, linkId: string) => Promise<boolean>;
  
  checkBoardAccess: (boardId: string) => Promise<BoardAccess>;
  fetchSharingSettings: (boardId: string) => Promise<void>;
  updateSharingSettings: (boardId: string, settings: Partial<SharingSettings>) => Promise<boolean>;
  
  // Utility
  clearSharingData: () => void;
}

export const useSharingStore = create<SharingState>((set, get) => ({
  members: [],
  isLoadingMembers: false,
  inviteLinks: [],
  isLoadingInviteLinks: false,
  boardAccess: null,
  sharingSettings: null,

  fetchMembers: async (boardId: string) => {
    set({ isLoadingMembers: true });
    try {
      const token = localStorage.getItem('token');
      const members = await api.get(`/sharing/boards/${boardId}/members`, token);
      set({ members, isLoadingMembers: false });
    } catch (error) {
      console.error('Failed to fetch members:', error);
      set({ isLoadingMembers: false });
    }
  },

  addMember: async (boardId: string, userId: string, role: 'admin' | 'editor' | 'viewer') => {
    try {
      const token = localStorage.getItem('token');
      await api.post(`/sharing/boards/${boardId}/members`, { userId, role }, token);
      
      // Refresh members list
      await get().fetchMembers(boardId);
      return true;
    } catch (error) {
      console.error('Failed to add member:', error);
      return false;
    }
  },

  removeMember: async (boardId: string, userId: string) => {
    try {
      const token = localStorage.getItem('token');
      await api.delete(`/sharing/boards/${boardId}/members/${userId}`, token);
      
      // Refresh members list
      await get().fetchMembers(boardId);
      return true;
    } catch (error) {
      console.error('Failed to remove member:', error);
      return false;
    }
  },

  updateMemberRole: async (boardId: string, userId: string, role: 'admin' | 'editor' | 'viewer') => {
    try {
      const token = localStorage.getItem('token');
      await api.put(`/sharing/boards/${boardId}/members/${userId}/role`, { role }, token);
      
      // Refresh members list
      await get().fetchMembers(boardId);
      return true;
    } catch (error) {
      console.error('Failed to update member role:', error);
      return false;
    }
  },

  fetchInviteLinks: async (boardId: string) => {
    set({ isLoadingInviteLinks: true });
    try {
      const token = localStorage.getItem('token');
      const inviteLinks = await api.get(`/sharing/boards/${boardId}/invite-links`, token);
      set({ inviteLinks, isLoadingInviteLinks: false });
    } catch (error) {
      console.error('Failed to fetch invite links:', error);
      set({ isLoadingInviteLinks: false });
    }
  },

  createInviteLink: async (boardId: string, role: 'admin' | 'editor' | 'viewer', options?: {
    expiresAt?: string;
    maxUses?: number;
  }) => {
    try {
      const token = localStorage.getItem('token');
      const response = await api.post(`/sharing/boards/${boardId}/invite-links`, {
        role,
        ...options
      }, token);
      
      // Refresh invite links list
      await get().fetchInviteLinks(boardId);
      return response.inviteLink;
    } catch (error) {
      console.error('Failed to create invite link:', error);
      return null;
    }
  },

  revokeInviteLink: async (boardId: string, linkId: string) => {
    try {
      const token = localStorage.getItem('token');
      await api.delete(`/sharing/boards/${boardId}/invite-links/${linkId}`, token);
      
      // Refresh invite links list
      await get().fetchInviteLinks(boardId);
      return true;
    } catch (error) {
      console.error('Failed to revoke invite link:', error);
      return false;
    }
  },

  checkBoardAccess: async (boardId: string) => {
    try {
      const token = localStorage.getItem('token');
      const access = await api.get(`/sharing/boards/${boardId}/access`, token);
      set({ boardAccess: access });
      return access;
    } catch (error) {
      console.error('Failed to check board access:', error);
      const defaultAccess: BoardAccess = {
        hasAccess: false,
        permissions: {
          canView: false,
          canEdit: false,
          canDelete: false,
          canInvite: false,
          canManageMembers: false
        }
      };
      set({ boardAccess: defaultAccess });
      return defaultAccess;
    }
  },

  fetchSharingSettings: async (boardId: string) => {
    try {
      const token = localStorage.getItem('token');
      const settings = await api.get(`/sharing/boards/${boardId}/sharing-settings`, token);
      set({ sharingSettings: settings });
    } catch (error) {
      console.error('Failed to fetch sharing settings:', error);
    }
  },

  updateSharingSettings: async (boardId: string, settings: Partial<SharingSettings>) => {
    try {
      const token = localStorage.getItem('token');
      await api.put(`/sharing/boards/${boardId}/sharing-settings`, settings, token);
      
      // Refresh sharing settings
      await get().fetchSharingSettings(boardId);
      return true;
    } catch (error) {
      console.error('Failed to update sharing settings:', error);
      return false;
    }
  },

  clearSharingData: () => {
    set({
      members: [],
      inviteLinks: [],
      boardAccess: null,
      sharingSettings: null
    });
  }
})); 