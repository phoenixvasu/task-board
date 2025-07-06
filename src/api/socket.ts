import { io, Socket } from 'socket.io-client';

export interface ActiveUser {
  userId: string;
  username: string;
  boardId: string;
  socketId: string;
  lastActivity: Date;
}

export interface SocketEvents {
  'user-joined': (data: { userId: string; username: string }) => void;
  'user-left': (data: { userId: string }) => void;
  'active-users': (data: { users: Array<{ id: string; name: string }> }) => void;
  'user-editing': (data: { taskId: string; userId: string; username: string; isEditing: boolean }) => void;
  'task-updated': (data: { boardId: string; taskId: string; task: any }) => void;
  'task-moved': (data: { boardId: string; taskId: string; fromColumnId: string; toColumnId: string; newIndex: number }) => void;
  'column-updated': (data: { boardId: string; columnId: string; column: any }) => void;
  'columns-reordered': (data: { boardId: string; columnIds: string[] }) => void;
  'task-added': (data: { boardId: string; columnId: string; task: any }) => void;
  'task-deleted': (data: { boardId: string; taskId: string }) => void;
  'column-added': (data: { boardId: string; column: any }) => void;
  'column-deleted': (data: { boardId: string; columnId: string }) => void;
  'member-role-updated': (data: { boardId: string; userId: string; role: string }) => void;
}

class SocketService {
  private socket: Socket | null = null;
  private currentBoardId: string | null = null;
  private isConnecting = false;

  connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (this.socket?.connected) {
        resolve();
        return;
      }

      if (this.isConnecting) {
        resolve();
        return;
      }

      this.isConnecting = true;

      const API_URL = import.meta.env.VITE_API_URL;
      if (!API_URL) {
        reject(new Error('VITE_API_URL environment variable is required'));
        return;
      }

      this.socket = io(API_URL, {
        auth: {
          token: localStorage.getItem('jwt')
        }
      });

      this.socket.on('connect', () => {
        console.log('Connected to socket server');
        this.isConnecting = false;
        resolve();
      });

      this.socket.on('connect_error', (error) => {
        console.error('Socket connection error:', error);
        this.isConnecting = false;
        reject(error);
      });

      this.socket.on('disconnect', () => {
        console.log('Disconnected from socket server');
      });
    });
  }

  disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
    this.currentBoardId = null;
  }

  joinBoard(boardId: string): void {
    if (this.socket && this.socket.connected) {
      this.socket.emit('join-board', { boardId });
      this.currentBoardId = boardId;
    }
  }

  leaveBoard(): void {
    if (this.socket && this.socket.connected && this.currentBoardId) {
      this.socket.emit('leave-board', { boardId: this.currentBoardId });
      this.currentBoardId = null;
    }
  }

  sendActivity(): void {
    if (this.socket && this.socket.connected && this.currentBoardId) {
      this.socket.emit('activity', { boardId: this.currentBoardId });
    }
  }

  notifyUserEditing(taskId: string, isEditing: boolean): void {
    if (this.socket && this.socket.connected && this.currentBoardId) {
      this.socket.emit('user-editing', { 
        boardId: this.currentBoardId, 
        taskId, 
        isEditing 
      });
    }
  }

  on<T extends keyof SocketEvents>(event: T, callback: SocketEvents[T]): void {
    if (this.socket) {
      this.socket.on(event, callback as any);
    }
  }

  off<T extends keyof SocketEvents>(event: T): void {
    if (this.socket) {
      this.socket.off(event);
    }
  }

  isConnected(): boolean {
    return this.socket?.connected || false;
  }

  getCurrentBoardId(): string | null {
    return this.currentBoardId;
  }
}

export const socketService = new SocketService();

// Hook for using socket service
export const useSocket = () => {
  const connect = async () => {
    try {
      await socketService.connect();
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