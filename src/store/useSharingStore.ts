import { create } from 'zustand';
import { api } from '../api';

export interface BoardMember {
  userId: string;
  username: string;
  email: string;
  role: 'owner' | 'editor' | 'viewer';
  invitedAt: string;
  joinedAt?: string;
}

export interface BoardAccess {
  hasAccess: boolean;
  role: 'owner' | 'editor' | 'viewer';
  permissions: {
    canView: boolean;
    canEdit: boolean;
    canDelete: boolean;
    canInvite: boolean;
    canManageMembers: boolean;
  };
}

interface SharingState {
  // Board members
  members: BoardMember[];
  isLoadingMembers: boolean;
  
  // Board access
  boardAccess: BoardAccess | null;
  
  // Actions
  fetchMembers: (boardId: string) => Promise<void>;
  addMember: (boardId: string, userId: string, role: 'editor' | 'viewer') => Promise<boolean>;
  removeMember: (boardId: string, userId: string) => Promise<boolean>;
  updateMemberRole: (boardId: string, userId: string, role: 'editor' | 'viewer') => Promise<boolean>;
  
  checkBoardAccess: (boardId: string) => Promise<BoardAccess>;
  
  // Utility
  clearSharingData: () => void;

  // New field
  getSharedBoards: () => Promise<any[]>;
}

export const useSharingStore = create<SharingState>((set, get) => ({
  // Initial state
  members: [],
  isLoadingMembers: false,
  boardAccess: null,

  fetchMembers: async (boardId: string) => {
    set({ isLoadingMembers: true });
    try {
      const token = localStorage.getItem('jwt');
      const members = await api.get(`/sharing/boards/${boardId}/members`, token || undefined);
      set({ members, isLoadingMembers: false });
    } catch (error) {
      console.error('Failed to fetch members:', error);
      set({ isLoadingMembers: false });
    }
  },

  addMember: async (boardId: string, userId: string, role: 'editor' | 'viewer') => {
    try {
      const token = localStorage.getItem('jwt');
      await api.post(`/sharing/boards/${boardId}/members`, { userId, role }, token || undefined);
      
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
      const token = localStorage.getItem('jwt');
      await api.delete(`/sharing/boards/${boardId}/members/${userId}`, token || undefined);
      
      // Refresh members list
      await get().fetchMembers(boardId);
      return true;
    } catch (error) {
      console.error('Failed to remove member:', error);
      return false;
    }
  },

  updateMemberRole: async (boardId: string, userId: string, role: 'editor' | 'viewer') => {
    try {
      const token = localStorage.getItem('jwt');
      console.log('Sending role update request:', { boardId, userId, role });
      const response = await api.put(`/sharing/boards/${boardId}/members/${userId}/role`, { role }, token || undefined);
      console.log('Role update response:', response);
      
      // Refresh members list
      await get().fetchMembers(boardId);
      return true;
    } catch (error) {
      console.error('Failed to update member role:', error);
      // Log more details about the error
      if (error instanceof Error) {
        console.error('Error message:', error.message);
      }
      return false;
    }
  },

  checkBoardAccess: async (boardId: string) => {
    try {
      const token = localStorage.getItem('jwt');
      const access = await api.get(`/sharing/boards/${boardId}/access`, token || undefined);
      set({ boardAccess: access });
      return access;
    } catch (error) {
      console.error('Failed to check board access:', error);
      const defaultAccess: BoardAccess = {
        hasAccess: false,
        role: 'viewer',
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

  clearSharingData: () => {
    set({
      members: [],
      boardAccess: null
    });
  },

  getSharedBoards: async () => {
    try {
      const token = localStorage.getItem('jwt');
      const sharedBoards = await api.get('/sharing/shared-boards', token || undefined);
      return Array.isArray(sharedBoards) ? sharedBoards : [];
    } catch (error) {
      console.error('Failed to fetch shared boards:', error);
      return [];
    }
  }
})); 