import { create } from 'zustand';
import { socketService, ActiveUser } from '../api/socket';
import { useBoardStore } from './useBoardStore';
import toast from 'react-hot-toast';

interface CollaborationState {
  // Active users in current board
  activeUsers: ActiveUser[];
  
  // Users currently editing tasks
  editingUsers: Map<string, { userId: string; username: string; taskId: string; timestamp: string }>;
  
  // Real-time update flags
  isReceivingUpdates: boolean;
  
  // Actions
  setActiveUsers: (users: ActiveUser[]) => void;
  addActiveUser: (user: ActiveUser) => void;
  removeActiveUser: (userId: string) => void;
  setEditingUser: (taskId: string, user: { userId: string; username: string; taskId: string; timestamp: string } | null) => void;
  clearEditingUsers: () => void;
  setIsReceivingUpdates: (isReceiving: boolean) => void;
  
  // Socket event handlers
  handleUserJoined: (data: { userId: string; username: string; timestamp: string }) => void;
  handleUserLeft: (data: { userId: string; username: string; timestamp: string }) => void;
  handleActiveUsers: (users: ActiveUser[]) => void;
  handleUserEditing: (data: { userId: string; username: string; taskId: string; isEditing: boolean; timestamp: string }) => void;
  
  // Real-time update handlers
  handleTaskUpdated: (data: { taskId: string; task: any; updatedBy: string; timestamp: string }) => void;
  handleTaskMoved: (data: { taskId: string; fromColumnId: string; toColumnId: string; newIndex: number; movedBy: string; timestamp: string }) => void;
  handleColumnUpdated: (data: { columnId: string; column: any; updatedBy: string; timestamp: string }) => void;
  handleColumnsReordered: (data: { columnIds: string[]; reorderedBy: string; timestamp: string }) => void;
  handleTaskAdded: (data: { columnId: string; taskId: string; task: any; addedBy: string; timestamp: string }) => void;
  handleTaskDeleted: (data: { taskId: string; deletedBy: string; timestamp: string }) => void;
  handleColumnAdded: (data: { column: any; addedBy: string; timestamp: string }) => void;
  handleColumnDeleted: (data: { columnId: string; deletedBy: string; timestamp: string }) => void;
}

export const useCollaborationStore = create<CollaborationState>((set, get) => ({
  activeUsers: [],
  editingUsers: new Map(),
  isReceivingUpdates: false,

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
  
  clearEditingUsers: () => set({ editingUsers: new Map() }),
  
  setIsReceivingUpdates: (isReceiving) => set({ isReceivingUpdates: isReceiving }),

  // Socket event handlers
  handleUserJoined: (data) => {
    set((state) => ({
      activeUsers: [...state.activeUsers, {
        userId: data.userId,
        username: data.username,
        boardId: socketService.getCurrentBoardId() || '',
        socketId: '',
        lastActivity: new Date(data.timestamp)
      }]
    }));
    
    toast.success(`${data.username} joined the board`, {
      duration: 2000,
      position: 'top-right'
    });
  },

  handleUserLeft: (data) => {
    set((state) => ({
      activeUsers: state.activeUsers.filter(u => u.userId !== data.userId)
    }));
    
    toast(`${data.username} left the board`, {
      duration: 2000,
      position: 'top-right',
      icon: '👋'
    });
  },

  handleActiveUsers: (users) => {
    set({ activeUsers: users });
  },

  handleUserEditing: (data) => {
    if (data.isEditing) {
      get().setEditingUser(data.taskId, {
        userId: data.userId,
        username: data.username,
        taskId: data.taskId,
        timestamp: data.timestamp
      });
    } else {
      get().setEditingUser(data.taskId, null);
    }
  },

  // Real-time update handlers
  handleTaskUpdated: (data) => {
    set({ isReceivingUpdates: true });
    
    // Update the task in the board store
    const boardId = socketService.getCurrentBoardId();
    if (boardId) {
      useBoardStore.getState().handleRealTimeTaskUpdate(boardId, data.taskId, data.task);
    }
    
    toast.success(`Task updated by ${data.updatedBy}`, {
      duration: 2000,
      position: 'top-right'
    });
  },

  handleTaskMoved: (data) => {
    set({ isReceivingUpdates: true });
    
    // Update task position in the board store
    const boardId = socketService.getCurrentBoardId();
    if (boardId) {
      useBoardStore.getState().handleRealTimeTaskMove(boardId, data.taskId, data.fromColumnId, data.toColumnId, data.newIndex);
    }
    
    toast.success(`Task moved by ${data.movedBy}`, {
      duration: 2000,
      position: 'top-right'
    });
  },

  handleColumnUpdated: (data) => {
    set({ isReceivingUpdates: true });
    
    // Update column in the board store
    const boardId = socketService.getCurrentBoardId();
    if (boardId) {
      useBoardStore.getState().handleRealTimeColumnUpdate(boardId, data.columnId, data.column);
    }
    
    toast.success(`Column updated by ${data.updatedBy}`, {
      duration: 2000,
      position: 'top-right'
    });
  },

  handleColumnsReordered: (data) => {
    set({ isReceivingUpdates: true });
    
    // Update column order in the board store
    const boardId = socketService.getCurrentBoardId();
    if (boardId) {
      useBoardStore.getState().handleRealTimeColumnsReorder(boardId, data.columnIds);
    }
    
    toast.success(`Columns reordered by ${data.reorderedBy}`, {
      duration: 2000,
      position: 'top-right'
    });
  },

  handleTaskAdded: (data) => {
    set({ isReceivingUpdates: true });
    
    // Add task to the board store
    const boardId = socketService.getCurrentBoardId();
    if (boardId) {
      useBoardStore.getState().handleRealTimeTaskAdd(boardId, data.columnId, data.taskId, data.task);
    }
    
    toast.success(`Task added by ${data.addedBy}`, {
      duration: 2000,
      position: 'top-right'
    });
  },

  handleTaskDeleted: (data) => {
    set({ isReceivingUpdates: true });
    
    // Remove task from the board store
    const boardId = socketService.getCurrentBoardId();
    if (boardId) {
      useBoardStore.getState().handleRealTimeTaskDelete(boardId, data.taskId);
    }
    
    toast.success(`Task deleted by ${data.deletedBy}`, {
      duration: 2000,
      position: 'top-right'
    });
  },

  handleColumnAdded: (data) => {
    set({ isReceivingUpdates: true });
    
    // Add column to the board store
    const boardId = socketService.getCurrentBoardId();
    if (boardId) {
      useBoardStore.getState().handleRealTimeColumnAdd(boardId, data.column);
    }
    
    toast.success(`Column added by ${data.addedBy}`, {
      duration: 2000,
      position: 'top-right'
    });
  },

  handleColumnDeleted: (data) => {
    set({ isReceivingUpdates: true });
    
    // Remove column from the board store
    const boardId = socketService.getCurrentBoardId();
    if (boardId) {
      useBoardStore.getState().handleRealTimeColumnDelete(boardId, data.columnId);
    }
    
    toast.success(`Column deleted by ${data.deletedBy}`, {
      duration: 2000,
      position: 'top-right'
    });
  }
})); 