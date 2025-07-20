import { create } from 'zustand';
import { useBoardStore } from './useBoardStore';
import { useSharingStore } from './useSharingStore';
import toast from 'react-hot-toast';
import { onSocketEvent, emitSocketEvent } from '../api/socket';
import { SOCKET_EVENTS, PresenceUpdatePayload, UserTypingPayload, UserEditingPayload } from '../types/socketEvents';
import { useAuthStore } from './useAuthStore';
import { debounce } from '../utils';
import { useEffect } from 'react';

// Debounce utility
const debounce = (func: Function, wait: number) => {
  let timeout: ReturnType<typeof setTimeout>;
  return (...args: any[]) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func.apply(null, args), wait);
  };
};

interface CollaborationState {
  // Active users in current board
  activeUsers: { userId: string; username: string; boardId: string; socketId: string; lastActivity: Date }[];
  
  // Users currently editing tasks
  editingUsers: Map<string, { userId: string; username: string; taskId: string; timestamp: string }>;
  
  // Real-time update flags
  isReceivingUpdates: boolean;
  
  // Actions
  setActiveUsers: (users: { userId: string; username: string; boardId: string; socketId: string; lastActivity: Date }[]) => void;
  addActiveUser: (user: { userId: string; username: string; boardId: string; socketId: string; lastActivity: Date }) => void;
  removeActiveUser: (userId: string) => void;
  setEditingUser: (taskId: string, user: { userId: string; username: string; taskId: string; timestamp: string } | null) => void;
  clearEditingUsers: () => void;
  setIsReceivingUpdates: (isReceiving: boolean) => void;
  connectionStatus: 'connected' | 'reconnecting' | 'disconnected';
  setStatus: (status: 'connected' | 'reconnecting' | 'disconnected') => void;
}

export const useCollaborationStore = create<CollaborationState>((set, get) => ({
  activeUsers: [],
  editingUsers: new Map(),
  isReceivingUpdates: false,
  connectionStatus: 'connected',

  setActiveUsers: (users) => set({ activeUsers: users }),
  
  addActiveUser: (user) => set((state) => ({
    activeUsers: [...state.activeUsers.filter(u => u.userId !== user.userId), user]
  })),
  
  removeActiveUser: (userId) => set((state) => ({
    activeUsers: state.activeUsers.filter(u => u.userId !== userId)
  })),
  
  setEditingUser: (taskId, user) => set((state) => {
    const newEditingUsers = new Map(state.editingUsers);
    if (user) {
      newEditingUsers.set(taskId, user);
    } else {
      newEditingUsers.delete(taskId);
    }
    return { editingUsers: newEditingUsers };
  }),
  
  clearEditingUsers: () => {
    const currentState = get();
    if (currentState.editingUsers.size > 0) {
      set({ editingUsers: new Map() });
    }
  },
  
  setIsReceivingUpdates: (isReceiving) => set({ isReceivingUpdates: isReceiving }),

  setStatus: (status) => set({ connectionStatus: status }),

  // Remove all real-time update handler functions and references
  // Only keep local state and non-socket actions
})); 

// --- Real-time presence, typing, and editing ---
function registerCollaborationSocketListeners(set, get) {
  // Presence
  onSocketEvent(SOCKET_EVENTS.PRESENCE_UPDATE, (payload: PresenceUpdatePayload) => {
    set({ activeUsers: payload.users.map(u => ({ ...u, boardId: '', socketId: '', lastActivity: new Date() })) });
  });
  // Typing
  const typingTimeouts = new Map<string, NodeJS.Timeout>();
  onSocketEvent(SOCKET_EVENTS.USER_TYPING, (payload: UserTypingPayload) => {
    if (!payload.taskId) return;
    set(state => {
      const newEditingUsers = new Map(state.editingUsers);
      newEditingUsers.set(payload.taskId, { userId: payload.userId, username: '', taskId: payload.taskId, timestamp: new Date().toISOString() });
      return { editingUsers: newEditingUsers };
    });
    // Auto-clear after 2s
    if (typingTimeouts.has(payload.taskId)) clearTimeout(typingTimeouts.get(payload.taskId));
    typingTimeouts.set(payload.taskId, setTimeout(() => {
      set(state => {
        const newEditingUsers = new Map(state.editingUsers);
        newEditingUsers.delete(payload.taskId);
        return { editingUsers: newEditingUsers };
      });
    }, 2000));
  });
  // Editing
  const editingTimeouts = new Map<string, NodeJS.Timeout>();
  onSocketEvent(SOCKET_EVENTS.USER_EDITING, (payload: UserEditingPayload) => {
    if (!payload.taskId) return;
    set(state => {
      const newEditingUsers = new Map(state.editingUsers);
      newEditingUsers.set(payload.taskId, { userId: payload.userId, username: '', taskId: payload.taskId, timestamp: new Date().toISOString() });
      return { editingUsers: newEditingUsers };
    });
    // Auto-clear after 2s
    if (editingTimeouts.has(payload.taskId)) clearTimeout(editingTimeouts.get(payload.taskId));
    editingTimeouts.set(payload.taskId, setTimeout(() => {
      set(state => {
        const newEditingUsers = new Map(state.editingUsers);
        newEditingUsers.delete(payload.taskId);
        return { editingUsers: newEditingUsers };
      });
    }, 2000));
  });
}

export function useRegisterCollaborationSocketListeners() {
  useEffect(() => {
    registerCollaborationSocketListeners(useCollaborationStore.setState, useCollaborationStore.getState);
  }, []);
}

// Emit helpers with debounce/throttle
export const emitTyping = debounce((boardId: string, taskId: string, userId: string) => {
  emitSocketEvent<UserTypingPayload>(SOCKET_EVENTS.USER_TYPING, { boardId, taskId, userId });
}, 300);
export const emitEditing = debounce((boardId: string, taskId: string, userId: string) => {
  emitSocketEvent<UserEditingPayload>(SOCKET_EVENTS.USER_EDITING, { boardId, taskId, userId });
}, 300); 

let presenceHeartbeatInterval: NodeJS.Timeout | null = null;
export function startPresenceHeartbeat(boardId: string, userId: string) {
  if (presenceHeartbeatInterval) clearInterval(presenceHeartbeatInterval);
  presenceHeartbeatInterval = setInterval(() => {
    emitSocketEvent(SOCKET_EVENTS.PRESENCE_UPDATE, { boardId, users: [{ userId, username: '' }] });
  }, 15000); // 15s
}
export function stopPresenceHeartbeat() {
  if (presenceHeartbeatInterval) clearInterval(presenceHeartbeatInterval);
  presenceHeartbeatInterval = null;
} 