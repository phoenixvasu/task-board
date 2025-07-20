import { create } from 'zustand';
import { onSocketEvent, emitSocketEvent } from '../api/socket';
import { SOCKET_EVENTS, PresenceUpdatePayload, UserTypingPayload, UserEditingPayload } from '../types/socketEvents';
import { debounce } from '../utils';
import { useEffect } from 'react';

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
})); 

// --- Real-time presence, typing, and editing ---
function registerCollaborationSocketListeners(set: (state: any) => void) {
  // Presence
  onSocketEvent(SOCKET_EVENTS.PRESENCE_UPDATE, (payload: PresenceUpdatePayload) => {
    set({ activeUsers: payload.users.map(u => ({ ...u, boardId: '', socketId: '', lastActivity: new Date() })) });
  });
  
  // Typing
  const typingTimeouts = new Map<string, number>();
  onSocketEvent(SOCKET_EVENTS.USER_TYPING, (payload: UserTypingPayload) => {
    // Check if taskId exists and is a string
    if (!payload.taskId || typeof payload.taskId !== 'string') return;
    
    const taskId = payload.taskId; // Now TypeScript knows this is a string
    
    set((state: CollaborationState) => {
      const newEditingUsers: Map<string, { userId: string; username: string; taskId: string; timestamp: string }> = new Map(state.editingUsers);
      newEditingUsers.set(taskId, { 
        userId: payload.userId, 
        username: '', 
        taskId: taskId, 
        timestamp: new Date().toISOString() 
      });
      return { editingUsers: newEditingUsers };
    });
    
    // Auto-clear after 2s
    if (typingTimeouts.has(taskId)) {
      const timeoutId = typingTimeouts.get(taskId);
      if (timeoutId) clearTimeout(timeoutId);
    }
    
    const timeoutId = window.setTimeout(() => {
      set((state: CollaborationState) => {
        const newEditingUsers: Map<string, { userId: string; username: string; taskId: string; timestamp: string }> = new Map(state.editingUsers);
        newEditingUsers.delete(taskId);
        return { editingUsers: newEditingUsers };
      });
    }, 2000);
    
    typingTimeouts.set(taskId, timeoutId);
  });
  
  // Editing
  const editingTimeouts = new Map<string, number>();
  onSocketEvent(SOCKET_EVENTS.USER_EDITING, (payload: UserEditingPayload) => {
    // Check if taskId exists and is a string
    if (!payload.taskId || typeof payload.taskId !== 'string') return;
    
    const taskId = payload.taskId; // Now TypeScript knows this is a string
    
    set((state: CollaborationState) => {
      const newEditingUsers = new Map(state.editingUsers);
      newEditingUsers.set(taskId, { 
        userId: payload.userId, 
        username: '', 
        taskId: taskId, 
        timestamp: new Date().toISOString() 
      });
      return { editingUsers: newEditingUsers };
    });
    
    // Auto-clear after 2s
    if (editingTimeouts.has(taskId)) {
      const timeoutId = editingTimeouts.get(taskId);
      if (timeoutId) clearTimeout(timeoutId);
    }
    
    const timeoutId = window.setTimeout(() => {
      set((state: CollaborationState) => {
        const newEditingUsers = new Map(state.editingUsers);
        newEditingUsers.delete(taskId);
        return { editingUsers: newEditingUsers };
      });
    }, 2000);
    
    editingTimeouts.set(taskId, timeoutId);
  });
}

export function useRegisterCollaborationSocketListeners() {
  useEffect(() => {
    registerCollaborationSocketListeners(useCollaborationStore.setState);
  }, []);
}

// Emit helpers with debounce/throttle
export const emitTyping = debounce((boardId: string, taskId: string, userId: string) => {
  emitSocketEvent<UserTypingPayload>(SOCKET_EVENTS.USER_TYPING, { boardId, taskId, userId });
}, 300);

export const emitEditing = debounce((boardId: string, taskId: string, userId: string) => {
  emitSocketEvent<UserEditingPayload>(SOCKET_EVENTS.USER_EDITING, { boardId, taskId, userId });
}, 300); 

let presenceHeartbeatInterval: number | null = null;

export function startPresenceHeartbeat(boardId: string, userId: string) {
  if (presenceHeartbeatInterval) clearInterval(presenceHeartbeatInterval);
  presenceHeartbeatInterval = window.setInterval(() => {
    emitSocketEvent(SOCKET_EVENTS.PRESENCE_UPDATE, { boardId, users: [{ userId, username: '' }] });
  }, 15000); // 15s
}

export function stopPresenceHeartbeat() {
  if (presenceHeartbeatInterval) {
    clearInterval(presenceHeartbeatInterval);
    presenceHeartbeatInterval = null;
  }
}