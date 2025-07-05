import { io, Socket } from 'socket.io-client';
import { useAuthStore } from '../store/useAuthStore';

export interface ActiveUser {
  userId: string;
  username: string;
  boardId: string;
  socketId: string;
  lastActivity: Date;
}

export interface SocketEvents {
  // User presence events
  'user-joined': (data: { userId: string; username: string; timestamp: string }) => void;
  'user-left': (data: { userId: string; username: string; timestamp: string }) => void;
  'active-users': (users: ActiveUser[]) => void;
  
  // Editing indicators
  'user-editing': (data: { userId: string; username: string; taskId: string; isEditing: boolean; timestamp: string }) => void;
  
  // Board events
  'board-updated': (data: { boardId: string; board: any; updatedBy: string; timestamp: string }) => void;
  'board-deleted': (data: { boardId: string; deletedBy: string; timestamp: string }) => void;
  
  // Column events
  'column-added': (data: { boardId: string; column: any; addedBy: string; timestamp: string }) => void;
  'column-updated': (data: { boardId: string; columnId: string; column: any; updatedBy: string; timestamp: string }) => void;
  'column-deleted': (data: { boardId: string; columnId: string; deletedBy: string; timestamp: string }) => void;
  'columns-reordered': (data: { boardId: string; columnIds: string[]; reorderedBy: string; timestamp: string }) => void;
  
  // Task events
  'task-added': (data: { boardId: string; columnId: string; taskId: string; task: any; addedBy: string; timestamp: string }) => void;
  'task-updated': (data: { boardId: string; taskId: string; task: any; updatedBy: string; timestamp: string }) => void;
  'task-deleted': (data: { boardId: string; taskId: string; deletedBy: string; timestamp: string }) => void;
  'task-moved': (data: { boardId: string; taskId: string; fromColumnId: string; toColumnId: string; newIndex: number; movedBy: string; timestamp: string }) => void;
  'tasks-reordered': (data: { boardId: string; columnId: string; taskIds: string[]; reorderedBy: string; timestamp: string }) => void;
}

class SocketService {
  private socket: Socket | null = null;
  private currentBoardId: string | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;

  connect(token: string): Promise<void> {
    return new Promise((resolve, reject) => {
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';
      
      this.socket = io(apiUrl, {
        auth: { token },
        transports: ['websocket', 'polling'],
        timeout: 10000,
      });

      this.socket.on('connect', () => {
        console.log('Socket connected');
        this.reconnectAttempts = 0;
        resolve();
      });

      this.socket.on('connect_error', (error) => {
        console.error('Socket connection error:', error);
        reject(error);
      });

      this.socket.on('disconnect', (reason) => {
        console.log('Socket disconnected:', reason);
        if (reason === 'io server disconnect') {
          // Server disconnected us, try to reconnect
          this.socket?.connect();
        }
      });
    });
  }

  disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.currentBoardId = null;
    }
  }

  joinBoard(boardId: string): void {
    if (!this.socket) {
      console.error('Socket not connected');
      return;
    }
    
    this.currentBoardId = boardId;
    this.socket.emit('join-board', boardId);
  }

  leaveBoard(): void {
    if (this.socket && this.currentBoardId) {
      this.socket.emit('leave-board', this.currentBoardId);
      this.currentBoardId = null;
    }
  }

  // User editing indicators
  notifyUserEditing(taskId: string, isEditing: boolean): void {
    if (!this.socket || !this.currentBoardId) return;
    
    this.socket.emit('user-editing', {
      boardId: this.currentBoardId,
      taskId,
      isEditing
    });
  }

  // Activity heartbeat
  sendActivity(): void {
    if (!this.socket || !this.currentBoardId) return;
    
    this.socket.emit('activity', this.currentBoardId);
  }

  // Event listeners
  on<T extends keyof SocketEvents>(event: T, callback: SocketEvents[T]): void {
    if (!this.socket) return;
    this.socket.on(event, callback as any);
  }

  off<T extends keyof SocketEvents>(event: T, callback?: SocketEvents[T]): void {
    if (!this.socket) return;
    if (callback) {
      this.socket.off(event, callback as any);
    } else {
      this.socket.off(event);
    }
  }

  // Emit events for real-time updates
  emitTaskUpdated(taskId: string, task: any): void {
    if (!this.socket || !this.currentBoardId) return;
    
    this.socket.emit('task-updated', {
      boardId: this.currentBoardId,
      taskId,
      task
    });
  }

  emitTaskMoved(taskId: string, fromColumnId: string, toColumnId: string, newIndex: number): void {
    if (!this.socket || !this.currentBoardId) return;
    
    this.socket.emit('task-moved', {
      boardId: this.currentBoardId,
      taskId,
      fromColumnId,
      toColumnId,
      newIndex
    });
  }

  emitColumnUpdated(columnId: string, column: any): void {
    if (!this.socket || !this.currentBoardId) return;
    
    this.socket.emit('column-updated', {
      boardId: this.currentBoardId,
      columnId,
      column
    });
  }

  emitColumnsReordered(columnIds: string[]): void {
    if (!this.socket || !this.currentBoardId) return;
    
    this.socket.emit('columns-reordered', {
      boardId: this.currentBoardId,
      columnIds
    });
  }

  isConnected(): boolean {
    return this.socket?.connected || false;
  }

  getCurrentBoardId(): string | null {
    return this.currentBoardId;
  }
}

// Create singleton instance
export const socketService = new SocketService();

// Hook for using socket service
export const useSocket = () => {
  const { token } = useAuthStore();
  
  const connect = async () => {
    if (!token) {
      console.error('No token available for socket connection');
      return;
    }
    
    try {
      await socketService.connect(token);
    } catch (error) {
      console.error('Failed to connect to socket:', error);
    }
  };

  const disconnect = () => {
    socketService.disconnect();
  };

  return {
    socketService,
    connect,
    disconnect,
    isConnected: socketService.isConnected.bind(socketService)
  };
}; 