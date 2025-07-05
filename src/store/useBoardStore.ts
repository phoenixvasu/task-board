import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Board, Task, Column } from '../types';
import { api } from '../api';
import { useAuthStore } from './useAuthStore';

interface BoardState {
  boards: Record<string, Board>;
  currentBoardId: string | null;
  users: Array<{ id: string; name: string; email: string; avatar?: string }>;
  
  // Board actions
  fetchBoards: () => Promise<void>;
  createBoard: (name: string, description?: string) => Promise<string | null>;
  updateBoard: (id: string, updates: Partial<Board>) => Promise<void>;
  deleteBoard: (id: string) => Promise<void>;
  setCurrentBoard: (id: string) => void;
  
  // Column actions
  createColumn: (boardId: string, name: string) => Promise<string | null>;
  updateColumn: (boardId: string, columnId: string, updates: Partial<Column>) => Promise<void>;
  deleteColumn: (boardId: string, columnId: string) => Promise<void>;
  reorderColumns: (boardId: string, columnIds: string[]) => Promise<void>;
  
  // Task actions
  createTask: (boardId: string, columnId: string, task: Omit<Task, 'id' | 'createdAt' | 'updatedAt'>) => Promise<string | null>;
  updateTask: (boardId: string, taskId: string, updates: Partial<Task>) => Promise<void>;
  deleteTask: (boardId: string, taskId: string) => Promise<void>;
  reorderTasks: (boardId: string, columnId: string, taskIds: string[]) => Promise<void>;
  
  // User actions
  addUser: (user: { name: string; email: string; avatar?: string }) => string;
  updateUser: (id: string, updates: Partial<{ name: string; email: string; avatar?: string }>) => void;
  deleteUser: (id: string) => void;
  
  // Utility actions
  getBoard: (id: string) => Board | null;
  getTask: (boardId: string, taskId: string) => Task | null;
  getColumn: (boardId: string, columnId: string) => Column | null;
  getUser: (id: string) => { id: string; name: string; email: string; avatar?: string } | null;
  
  // Real-time update handlers
  handleRealTimeTaskUpdate: (boardId: string, taskId: string, task: Task) => void;
  handleRealTimeTaskMove: (boardId: string, taskId: string, fromColumnId: string, toColumnId: string, newIndex: number) => void;
  handleRealTimeColumnUpdate: (boardId: string, columnId: string, column: Column) => void;
  handleRealTimeColumnsReorder: (boardId: string, columnIds: string[]) => void;
  handleRealTimeTaskAdd: (boardId: string, columnId: string, taskId: string, task: Task) => void;
  handleRealTimeTaskDelete: (boardId: string, taskId: string) => void;
  handleRealTimeColumnAdd: (boardId: string, column: Column) => void;
  handleRealTimeColumnDelete: (boardId: string, columnId: string) => void;
}

const generateId = () => Math.random().toString(36).substr(2, 9);

export const useBoardStore = create<BoardState>()(
  persist(
    (set, get) => ({
      boards: {},
      currentBoardId: null,
      users: [
        { id: '1', name: 'John Doe', email: 'john@example.com', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=John' },
        { id: '2', name: 'Jane Smith', email: 'jane@example.com', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Jane' },
        { id: '3', name: 'Mike Johnson', email: 'mike@example.com', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Mike' },
      ],

      fetchBoards: async () => {
        const token = useAuthStore.getState().token ?? undefined;
        const res = await api.get('/boards', token);
        if (Array.isArray(res)) {
          const boards: Record<string, Board> = {};
          res.forEach((b: Board) => { boards[b.id] = b; });
          set({ boards });
        }
      },

      createBoard: async (name: string, description?: string) => {
        const token = useAuthStore.getState().token ?? undefined;
        const res = await api.post('/boards', { name, description }, token);
        if (res && res.id) {
          set((state) => ({ boards: { ...state.boards, [res.id]: res }, currentBoardId: res.id }));
          return res.id;
        }
        return null;
      },

      updateBoard: async (id: string, updates: Partial<Board>) => {
        const token = useAuthStore.getState().token ?? undefined;
        const res = await api.put(`/boards/${id}`, updates, token);
        if (res && res.id) {
          set((state) => ({ boards: { ...state.boards, [id]: res } }));
        }
      },

      deleteBoard: async (id: string) => {
        const token = useAuthStore.getState().token ?? undefined;
        await api.delete(`/boards/${id}`, token);
        set((state) => {
          const { [id]: deleted, ...remaining } = state.boards;
          return { boards: remaining, currentBoardId: state.currentBoardId === id ? null : state.currentBoardId };
        });
      },

      setCurrentBoard: (id: string) => {
        set({ currentBoardId: id });
      },

      // Column actions
      createColumn: async (boardId: string, name: string) => {
        const token = useAuthStore.getState().token ?? undefined;
        const res = await api.post(`/boards/${boardId}/columns`, { name }, token);
        if (res && res.id) {
          set((state) => ({ boards: { ...state.boards, [boardId]: res } }));
          const col = res.columns[res.columns.length - 1];
          return col.id;
        }
        return null;
      },

      updateColumn: async (boardId: string, columnId: string, updates: Partial<Column>) => {
        const token = useAuthStore.getState().token ?? undefined;
        const res = await api.put(`/boards/${boardId}/columns/${columnId}`, updates, token);
        if (res && res.id) {
          set((state) => ({ boards: { ...state.boards, [boardId]: res } }));
        }
      },

      deleteColumn: async (boardId: string, columnId: string) => {
        const token = useAuthStore.getState().token ?? undefined;
        const res = await api.delete(`/boards/${boardId}/columns/${columnId}`, token);
        if (res && res.id) {
          set((state) => ({ boards: { ...state.boards, [boardId]: res } }));
        }
      },

      reorderColumns: async (boardId: string, columnIds: string[]) => {
        const token = useAuthStore.getState().token ?? undefined;
        const res = await api.post(`/boards/${boardId}/columns/reorder`, { columnIds }, token);
        if (res && res.id) {
          set((state) => ({ boards: { ...state.boards, [boardId]: res } }));
        }
      },

      // Task actions
      createTask: async (boardId: string, columnId: string, task: Omit<Task, 'id' | 'createdAt' | 'updatedAt'>) => {
        const token = useAuthStore.getState().token ?? undefined;
        const res = await api.post(`/boards/${boardId}/columns/${columnId}/tasks`, task, token);
        if (res && res.id) {
          set((state) => ({ boards: { ...state.boards, [boardId]: res } }));
          const col = res.columns.find((c: Column) => c.id === columnId);
          if (col && col.taskIds.length > 0) return col.taskIds[col.taskIds.length - 1];
        }
        return null;
      },

      updateTask: async (boardId: string, taskId: string, updates: Partial<Task>) => {
        const token = useAuthStore.getState().token ?? undefined;
        const res = await api.put(`/boards/${boardId}/tasks/${taskId}`, updates, token);
        if (res && res.id) {
          set((state) => ({ boards: { ...state.boards, [boardId]: res } }));
        }
      },

      deleteTask: async (boardId: string, taskId: string) => {
        const token = useAuthStore.getState().token ?? undefined;
        const res = await api.delete(`/boards/${boardId}/tasks/${taskId}`, token);
        if (res && res.id) {
          set((state) => ({ boards: { ...state.boards, [boardId]: res } }));
        }
      },

      reorderTasks: async (boardId: string, columnId: string, taskIds: string[]) => {
        const token = useAuthStore.getState().token ?? undefined;
        const res = await api.post(`/boards/${boardId}/columns/${columnId}/tasks/reorder`, { taskIds }, token);
        if (res && res.id) {
          set((state) => ({ boards: { ...state.boards, [boardId]: res } }));
        }
      },

      // User actions
      addUser: (user: { name: string; email: string; avatar?: string }) => {
        const id = generateId();
        const newUser = { id, ...user };
        
        set((state) => ({
          users: [...state.users, newUser],
        }));

        return id;
      },

      updateUser: (id: string, updates: Partial<{ name: string; email: string; avatar?: string }>) => {
        set((state) => ({
          users: state.users.map((user) =>
            user.id === id ? { ...user, ...updates } : user
          ),
        }));
      },

      deleteUser: (id: string) => {
        set((state) => ({
          users: state.users.filter((user) => user.id !== id),
        }));
      },

      // Utility actions
      getBoard: (id: string) => {
        return get().boards[id] || null;
      },

      getTask: (boardId: string, taskId: string) => {
        const board = get().boards[boardId];
        return board?.tasks[taskId] || null;
      },

      getColumn: (boardId: string, columnId: string) => {
        const board = get().boards[boardId];
        return board?.columns.find((col) => col.id === columnId) || null;
      },

      getUser: (id: string) => {
        return get().users.find((user) => user.id === id) || null;
      },

      // Real-time update handlers
      handleRealTimeTaskUpdate: (boardId: string, taskId: string, task: Task) => {
        set((state) => {
          const board = state.boards[boardId];
          if (!board) return state;
          
          const updatedBoard = {
            ...board,
            tasks: { ...board.tasks, [taskId]: task }
          };
          
          return { boards: { ...state.boards, [boardId]: updatedBoard } };
        });
      },

      handleRealTimeTaskMove: (boardId: string, taskId: string, fromColumnId: string, toColumnId: string, newIndex: number) => {
        set((state) => {
          const board = state.boards[boardId];
          if (!board) return state;
          
          const updatedColumns = board.columns.map(col => {
            if (col.id === fromColumnId) {
              return { ...col, taskIds: col.taskIds.filter(id => id !== taskId) };
            }
            if (col.id === toColumnId) {
              const newTaskIds = [...col.taskIds];
              newTaskIds.splice(newIndex, 0, taskId);
              return { ...col, taskIds: newTaskIds };
            }
            return col;
          });
          
          const updatedBoard = { ...board, columns: updatedColumns };
          return { boards: { ...state.boards, [boardId]: updatedBoard } };
        });
      },

      handleRealTimeColumnUpdate: (boardId: string, columnId: string, column: Column) => {
        set((state) => {
          const board = state.boards[boardId];
          if (!board) return state;
          
          const updatedColumns = board.columns.map(col => 
            col.id === columnId ? column : col
          );
          
          const updatedBoard = { ...board, columns: updatedColumns };
          return { boards: { ...state.boards, [boardId]: updatedBoard } };
        });
      },

      handleRealTimeColumnsReorder: (boardId: string, columnIds: string[]) => {
        set((state) => {
          const board = state.boards[boardId];
          if (!board) return state;
          
          const columnMap = new Map(board.columns.map(col => [col.id, col]));
          const reorderedColumns = columnIds.map(id => columnMap.get(id)).filter(Boolean) as Column[];
          
          const updatedBoard = { ...board, columns: reorderedColumns };
          return { boards: { ...state.boards, [boardId]: updatedBoard } };
        });
      },

      handleRealTimeTaskAdd: (boardId: string, columnId: string, taskId: string, task: Task) => {
        set((state) => {
          const board = state.boards[boardId];
          if (!board) return state;
          
          const updatedColumns = board.columns.map(col => 
            col.id === columnId 
              ? { ...col, taskIds: [...col.taskIds, taskId] }
              : col
          );
          
          const updatedBoard = {
            ...board,
            columns: updatedColumns,
            tasks: { ...board.tasks, [taskId]: task }
          };
          
          return { boards: { ...state.boards, [boardId]: updatedBoard } };
        });
      },

      handleRealTimeTaskDelete: (boardId: string, taskId: string) => {
        set((state) => {
          const board = state.boards[boardId];
          if (!board) return state;
          
          const updatedColumns = board.columns.map(col => ({
            ...col,
            taskIds: col.taskIds.filter(id => id !== taskId)
          }));
          
          const updatedTasks = { ...board.tasks };
          delete updatedTasks[taskId];
          
          const updatedBoard = {
            ...board,
            columns: updatedColumns,
            tasks: updatedTasks
          };
          
          return { boards: { ...state.boards, [boardId]: updatedBoard } };
        });
      },

      handleRealTimeColumnAdd: (boardId: string, column: Column) => {
        set((state) => {
          const board = state.boards[boardId];
          if (!board) return state;
          
          const updatedBoard = {
            ...board,
            columns: [...board.columns, column]
          };
          
          return { boards: { ...state.boards, [boardId]: updatedBoard } };
        });
      },

      handleRealTimeColumnDelete: (boardId: string, columnId: string) => {
        set((state) => {
          const board = state.boards[boardId];
          if (!board) return state;
          
          const updatedBoard = {
            ...board,
            columns: board.columns.filter(col => col.id !== columnId)
          };
          
          return { boards: { ...state.boards, [boardId]: updatedBoard } };
        });
      }
    }),
    {
      name: 'board-storage',
      partialize: (state) => ({ boards: state.boards, users: state.users }),
    }
  )
); 