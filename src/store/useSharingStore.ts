import { create } from 'zustand';
import { api } from '../api';
import { emitSocketEvent, onSocketEvent, getSocketId } from '../api/socket';
import { SOCKET_EVENTS, AddMemberPayload, MemberAddedPayload, RemoveMemberPayload, MemberRemovedPayload, ChangeRolePayload, RoleChangedPayload, AckSuccess, AckError, BulkUpdateMembersPayload, MembersBulkUpdatedPayload } from '../types/socketEvents';
import { toast } from 'react-toastify';
import { useAuthStore } from './useAuthStore';
import { useBoardStore } from './useBoardStore';

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
  addMember: (boardId: string, userId: string, role: 'owner' | 'editor' | 'viewer') => Promise<boolean>;
  removeMember: (boardId: string, userId: string) => Promise<boolean>;
  updateMemberRole: (boardId: string, userId: string, role: 'owner' | 'editor' | 'viewer') => Promise<boolean>;
  
  checkBoardAccess: (boardId: string) => Promise<BoardAccess>;
  
  // Utility
  clearSharingData: () => void;

  // New field
  getSharedBoards: () => Promise<any[]>;
}

// Track optimistic updates for members by userId (move these outside the store definition)
const optimisticMemberAdds = new Map<string, any>();
const optimisticMemberRemoves = new Map<string, any>();
const optimisticRoleChanges = new Map<string, any>();

function registerSharingSocketListeners(set: (state: any) => void) {
  onSocketEvent(SOCKET_EVENTS.MEMBER_ADDED, (payload: MemberAddedPayload) => {
    if (payload.sourceClientId && payload.sourceClientId === getSocketId()) return;
    const optimistic = optimisticMemberAdds.get(payload.member.userId);
    if (optimistic) {
      const isEqual = JSON.stringify(optimistic) === JSON.stringify(payload.member);
      optimisticMemberAdds.delete(payload.member.userId);
      if (!isEqual) {
        toast.info('Member add overwritten by server.');
      }
    }
    // Replace any member with the same userId
    set((state: SharingState) => ({
      members: [
      ...state.members.filter((m: BoardMember) => m.userId !== payload.member.userId),
      payload.member as BoardMember
      ]
    }));
  });
  onSocketEvent(SOCKET_EVENTS.MEMBER_REMOVED, (payload: MemberRemovedPayload) => {
    if (payload.sourceClientId && payload.sourceClientId === getSocketId()) return;
    const optimistic = optimisticMemberRemoves.get(payload.userId);
    if (optimistic) {
      optimisticMemberRemoves.delete(payload.userId);
      toast.info('Member removal overwritten by server.');
    }
    set((state: SharingState) => ({ members: state.members.filter((m: BoardMember) => m.userId !== payload.userId) }));
  });
  onSocketEvent(SOCKET_EVENTS.ROLE_CHANGED, (payload: RoleChangedPayload & { role: BoardMember['role'] }) => {
    if (payload.sourceClientId && payload.sourceClientId === getSocketId()) return;
    const optimistic = optimisticRoleChanges.get(payload.userId);
    if (optimistic) {
      const isEqual = optimistic === payload.role;
      optimisticRoleChanges.delete(payload.userId);
      if (!isEqual) {
        toast.info('Role change overwritten by server.');
      }
    }
    set((state: SharingState) => ({
      members: state.members.map((m: BoardMember) =>
      m.userId === payload.userId ? { ...m, role: payload.role as BoardMember['role'] } : m
      ),
    }));
    // --- If the affected user is the current user, update boardAccess.role and permissions ---
    const userId = useAuthStore.getState().user?.id;
    if (payload.userId === userId) {
      // Fetch new permissions for the new role
      const role = payload.role as BoardMember['role'];
      const permissions = role === 'owner'
        ? { canView: true, canEdit: true, canDelete: true, canInvite: true, canManageMembers: true }
        : role === 'editor'
        ? { canView: true, canEdit: true, canDelete: false, canInvite: false, canManageMembers: false }
        : { canView: true, canEdit: false, canDelete: false, canInvite: false, canManageMembers: false };
      set((state: SharingState) => ({
        boardAccess: {
          ...state.boardAccess,
          role,
          permissions,
        },
      }));
      toast.info(`Your role on this board is now: ${role}`);
    }
  });
  onSocketEvent(SOCKET_EVENTS.PERMISSIONS_UPDATED, (payload) => {
    // Type assertion for payload
    const typedPayload = payload as { userId: string; permissions: { canView: boolean } };
    const userId = useAuthStore.getState().user?.id;
    if (typedPayload.userId === userId) {
      // Update boardAccess
      set((state: SharingState) => ({
        boardAccess: {
          ...state.boardAccess,
          permissions: typedPayload.permissions as BoardAccess['permissions'],
          hasAccess: typedPayload.permissions.canView,
        },
      }));
      if (!typedPayload.permissions.canView) {
        toast.error('Your access to this board has been revoked.');
        // Redirect to board list
        window.location.href = '/';
      } else {
        toast.info('Your board permissions have changed.');
      }
    }
  });
  onSocketEvent(SOCKET_EVENTS.MEMBERS_BULK_UPDATED, (payload: MembersBulkUpdatedPayload) => {
    if (payload.sourceClientId && payload.sourceClientId === getSocketId()) return;
    set(() => ({ members: payload.newMembers }));
  });
}

// Move these function declarations outside the store
const addMember = async (boardId: string, userId: string, role: 'owner' | 'editor' | 'viewer') => {
  return new Promise<boolean>((resolve, reject) => {
    // Fill in as much info as possible from local user list
    const user = useBoardStore.getState().users.find(u => u.id === userId);
    const optimisticMember = {
      userId,
      username: user?.name || '',
      email: user?.email || '',
      role,
      invitedAt: new Date().toISOString(),
    };
    useSharingStore.setState(state => ({ members: [...state.members, optimisticMember] }));
    optimisticMemberAdds.set(userId, optimisticMember);

    // Only allow 'editor' or 'viewer' roles for AddMemberPayload
    const allowedRole = role === 'owner' ? 'editor' : role;

    emitSocketEvent<AddMemberPayload, AckSuccess | AckError>(
      SOCKET_EVENTS.ADD_MEMBER,
      { boardId, userId, role: allowedRole },
      (ack) => {
        if (ack.success) {
          optimisticMemberAdds.delete(userId);
          resolve(true);
        } else {
          // Rollback
          useSharingStore.setState(state => ({ members: state.members.filter(m => m.userId !== userId) }));
          optimisticMemberAdds.delete(userId);
          toast.error(ack.error);
          reject(new Error(ack.error));
        }
      }
    );
  });
};
const removeMember = async (boardId: string, userId: string) => {
  return new Promise<boolean>((resolve, reject) => {
    const prevMembers = useSharingStore.getState().members;
    // Optimistic update
    useSharingStore.setState(state => ({ members: state.members.filter(m => m.userId !== userId) }));
    optimisticMemberRemoves.set(userId, true);
    emitSocketEvent<RemoveMemberPayload, AckSuccess | AckError>(
      SOCKET_EVENTS.REMOVE_MEMBER,
      { boardId, userId },
      (ack) => {
        if (ack.success) {
          optimisticMemberRemoves.delete(userId);
          resolve(true);
        } else {
          // Rollback
          useSharingStore.setState(() => ({ members: prevMembers }));
          optimisticMemberRemoves.delete(userId);
          toast.error(ack.error);
          reject(new Error(ack.error));
        }
      }
    );
  });
};
const updateMemberRole = async (boardId: string, userId: string, role: 'owner' | 'editor' | 'viewer') => {
  return new Promise<boolean>((resolve, reject) => {
    const prevMembers = useSharingStore.getState().members;
    // Optimistic update
    useSharingStore.setState(state => ({ members: state.members.map(m => m.userId === userId ? { ...m, role } : m) }));
    optimisticRoleChanges.set(userId, role);
    // Only allow 'editor' or 'viewer' roles for ChangeRolePayload
    const allowedRole = role === 'owner' ? 'editor' : role;
    emitSocketEvent<ChangeRolePayload, AckSuccess | AckError>(
      SOCKET_EVENTS.CHANGE_ROLE,
      { boardId, userId, role: allowedRole },
      (ack) => {
        if (ack.success) {
          optimisticRoleChanges.delete(userId);
          resolve(true);
        } else {
          // Rollback
          useSharingStore.setState(() => ({ members: prevMembers }));
          optimisticRoleChanges.delete(userId);
          toast.error(ack.error);
          reject(new Error(ack.error));
        }
      }
    );
  });
};
const bulkUpdateMembers = async (boardId: string, updates: Array<{ userId: string; updates: any; }>) => {
  return new Promise<void>((resolve, reject) => {
    // Optimistic update: apply all updates
    useSharingStore.setState(state => {
      let members = [...state.members];
      for (const update of updates) {
        const member = members.find(m => m.userId === update.userId);
        if (member) Object.assign(member, update.updates);
      }
      return { members };
    });
    emitSocketEvent<BulkUpdateMembersPayload, AckSuccess | AckError>(
      SOCKET_EVENTS.BULK_UPDATE_MEMBERS,
      { boardId, updates },
      (ack) => {
        if (ack.success) {
          resolve();
        } else {
          // Rollback: refetch members
          useSharingStore.getState().fetchMembers(boardId);
          toast.error(ack.error);
          reject(new Error(ack.error));
        }
      }
    );
  });
};

export const useSharingStore = create<SharingState>((set) => ({
  // Initial state
  members: [],
  isLoadingMembers: false,
  boardAccess: null,

  fetchMembers: async (boardId: string) => {
    set({ isLoadingMembers: true });
    try {
      const token = localStorage.getItem('jwt');
      const members = await api.get(`/api/sharing/boards/${boardId}/members`, token || undefined);
      set({ members, isLoadingMembers: false });
    } catch (error) {
      console.error('Failed to fetch members:', error);
      set({ isLoadingMembers: false });
    }
  },

  // --- Real-time member/role CRUD with atomic events ---
  // Track optimistic updates for members by userId
  // This function is now defined outside the store

  addMember,
  removeMember,
  updateMemberRole,
  bulkUpdateMembers,
  // This listener is now defined outside the store

  checkBoardAccess: async (boardId: string) => {
    try {
      const token = localStorage.getItem('jwt');
      const access = await api.get(`/api/sharing/boards/${boardId}/access`, token || undefined);
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
      const sharedBoards = await api.get('/api/sharing/shared-boards', token || undefined);
      return Array.isArray(sharedBoards) ? sharedBoards : [];
    } catch (error) {
      console.error('Failed to fetch shared boards:', error);
      return [];
    }
  }
})); 

registerSharingSocketListeners(useSharingStore.setState); 

// Log members array after every update
useSharingStore.subscribe(state => {
  console.log('[useSharingStore] Members updated:', state.members);
}); 