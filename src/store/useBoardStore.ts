import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Board, Task, Column, User } from '../types';
import { api } from '../api';

interface BoardState {
  boards: Record<string, Board>;
  currentBoardId: string | null;
  users: User[];
  isLoading: boolean;
  
  // Board actions
  fetchBoards: () => Promise<void>;
  fetchBoard: (id: string) => Promise<Board | null>;
  createBoard: (name: string, description?: string) => Promise<Board>;
  updateBoard: (id: string, updates: Partial<Board>) => Promise<void>;
  deleteBoard: (id: string) => Promise<void>;
  setCurrentBoard: (id: string) => void;
  
  // Column actions
  createColumn: (boardId: string, name: string) => Promise<Column>;
  updateColumn: (boardId: string, columnId: string, updates: Partial<Column>) => Promise<void>;
  deleteColumn: (boardId: string, columnId: string) => Promise<void>;
  reorderColumns: (boardId: string, columnIds: string[]) => Promise<void>;
  
  // Task actions
  createTask: (boardId: string, columnId: string, task: Partial<Task>) => Promise<Task>;
  updateTask: (boardId: string, taskId: string, updates: Partial<Task>) => Promise<void>;
  deleteTask: (boardId: string, taskId: string) => Promise<void>;
  reorderTasks: (boardId: string, columnId: string, taskIds: string[]) => Promise<void>;
  moveTask: (boardId: string, taskId: string, fromColumnId: string, toColumnId: string, newIndex: number) => Promise<void>;
  
  // User actions
  addUser: (user: { name: string; email: string; avatar?: string }) => string;
  updateUser: (id: string, updates: Partial<{ name: string; email: string; avatar?: string }>) => void;
  deleteUser: (id: string) => void;
  fetchUsers: () => Promise<void>;
  getUsers: () => User[];
  
  // Utility actions
  getBoard: (id: string) => Board | null;
  getTask: (boardId: string, taskId: string) => Task | null;
  getColumn: (boardId: string, columnId: string) => Column | null;
  getUser: (id: string) => User | null;
  
  // Real-time update handlers
  handleRealTimeTaskUpdate: (boardId: string, taskId: string, task: Task) => void;
  handleRealTimeTaskMove: (boardId: string, taskId: string, fromColumnId: string, toColumnId: string, newIndex: number) => void;
  handleRealTimeColumnUpdate: (boardId: string, columnId: string, column: Column) => void;
  handleRealTimeColumnsReorder: (boardId: string, columnIds: string[]) => void;
  handleRealTimeTaskAdd: (boardId: string, columnId: string, taskId: string, task: Task) => void;
  handleRealTimeTaskDelete: (boardId: string, taskId: string) => void;
  handleRealTimeColumnAdd: (boardId: string, column: Column) => void;
  handleRealTimeColumnDelete: (boardId: string, columnId: string) => void;
  
  // Utility
  clearBoards: () => void;
}

const generateId = () => Math.random().toString(36).substr(2, 9);

export const useBoardStore = create<BoardState>()(
  persist(
    (set, get) => ({
      boards: {},
      currentBoardId: null,
      users: [],
      isLoading: false,

      fetchBoards: async () => {
        set({ isLoading: true });
        try {
          const token = localStorage.getItem('jwt');
          const boards = await api.get('/boards', token || undefined);
          const boardsMap = boards.reduce((acc: Record<string, Board>, board: Board) => {
            acc[board.id] = board;
            return acc;
          }, {});
          set({ boards: boardsMap, isLoading: false });
        } catch (error) {
          console.error('Failed to fetch boards:', error);
          set({ isLoading: false });
        }
      },

      fetchBoard: async (id: string) => {
        const token = localStorage.getItem('jwt');
        const board = await api.get(`/boards/${id}`, token || undefined);
        set(state => ({
          boards: { ...state.boards, [id]: board }
        }));
        return board;
      },

      createBoard: async (name: string, description?: string) => {
        const token = localStorage.getItem('jwt');
        const board = await api.post('/boards', { name, description }, token || undefined);
        set(state => ({
          boards: { ...state.boards, [board.id]: board }
        }));
        return board;
      },

      updateBoard: async (id: string, updates: Partial<Board>) => {
        const token = localStorage.getItem('jwt');
        const res = await api.put(`/boards/${id}`, updates, token || undefined);
        set(state => ({
          boards: { ...state.boards, [id]: { ...state.boards[id], ...res } }
        }));
      },

      deleteBoard: async (id: string) => {
        const token = localStorage.getItem('jwt');
        await api.delete(`/boards/${id}`, token || undefined);
        set(state => {
          const { [id]: deleted, ...remaining } = state.boards;
          return { boards: remaining };
        });
      },

      setCurrentBoard: (id: string) => {
        set({ currentBoardId: id });
      },

      createColumn: async (boardId: string, name: string) => {
        const token = localStorage.getItem('jwt');
        const res = await api.post(`/boards/${boardId}/columns`, { name }, token || undefined);
        set(state => ({
          boards: {
            ...state.boards,
            [boardId]: {
              ...state.boards[boardId],
              columns: [...state.boards[boardId].columns, res]
            }
          }
        }));
        return res;
      },

      updateColumn: async (boardId: string, columnId: string, updates: Partial<Column>) => {
        const token = localStorage.getItem('jwt');
        const res = await api.put(`/boards/${boardId}/columns/${columnId}`, updates, token || undefined);
        set(state => ({
          boards: {
            ...state.boards,
            [boardId]: {
              ...state.boards[boardId],
              columns: state.boards[boardId].columns.map(col =>
                col.id === columnId ? { ...col, ...res } : col
              )
            }
          }
        }));
      },

      deleteColumn: async (boardId: string, columnId: string) => {
        const token = localStorage.getItem('jwt');
        await api.delete(`/boards/${boardId}/columns/${columnId}`, token || undefined);
        set(state => ({
          boards: {
            ...state.boards,
            [boardId]: {
              ...state.boards[boardId],
              columns: state.boards[boardId].columns.filter(col => col.id !== columnId)
            }
          }
        }));
      },

      reorderColumns: async (boardId: string, columnIds: string[]) => {
        const token = localStorage.getItem('jwt');
        const res = await api.post(`/boards/${boardId}/columns/reorder`, { columnIds }, token || undefined);
        set(state => ({
          boards: {
            ...state.boards,
            [boardId]: {
              ...state.boards[boardId],
              columns: res
            }
          }
        }));
      },

      createTask: async (boardId: string, columnId: string, task: Partial<Task>) => {
        const token = localStorage.getItem('jwt');
        const res = await api.post(`/boards/${boardId}/columns/${columnId}/tasks`, task, token || undefined);
        set(state => ({
          boards: {
            ...state.boards,
            [boardId]: {
              ...state.boards[boardId],
              tasks: { ...state.boards[boardId].tasks, [res.id]: res },
              columns: state.boards[boardId].columns.map(col =>
                col.id === columnId
                  ? { ...col, taskIds: [...col.taskIds, res.id] }
                  : col
              )
            }
          }
        }));
        return res;
      },

      updateTask: async (boardId: string, taskId: string, updates: Partial<Task>) => {
        const token = localStorage.getItem('jwt');
        const res = await api.put(`/boards/${boardId}/tasks/${taskId}`, updates, token || undefined);
        set(state => ({
          boards: {
            ...state.boards,
            [boardId]: {
              ...state.boards[boardId],
              tasks: { ...state.boards[boardId].tasks, [taskId]: { ...state.boards[boardId].tasks[taskId], ...res } }
            }
          }
        }));
      },

      deleteTask: async (boardId: string, taskId: string) => {
        const token = localStorage.getItem('jwt');
        await api.delete(`/boards/${boardId}/tasks/${taskId}`, token || undefined);
        set(state => {
          const { [taskId]: deleted, ...remainingTasks } = state.boards[boardId].tasks;
          return {
            boards: {
              ...state.boards,
              [boardId]: {
                ...state.boards[boardId],
                tasks: remainingTasks,
                columns: state.boards[boardId].columns.map(col => ({
                  ...col,
                  taskIds: col.taskIds.filter(id => id !== taskId)
                }))
              }
            }
          };
        });
      },

      moveTask: async (boardId: string, taskId: string, fromColumnId: string, toColumnId: string, newIndex: number) => {
        const token = localStorage.getItem('jwt');
        const res = await api.post(`/boards/${boardId}/tasks/${taskId}/move`, { fromColumnId, toColumnId, newIndex }, token || undefined);
        set(state => ({
          boards: {
            ...state.boards,
            [boardId]: {
              ...state.boards[boardId],
              columns: res.columns,
              tasks: { ...state.boards[boardId].tasks, [taskId]: res.task }
            }
          }
        }));
      },

      reorderTasks: async (boardId: string, columnId: string, taskIds: string[]) => {
        const token = localStorage.getItem('jwt');
        const res = await api.post(`/boards/${boardId}/columns/${columnId}/tasks/reorder`, { taskIds }, token || undefined);
        set(state => ({
          boards: {
            ...state.boards,
            [boardId]: {
              ...state.boards[boardId],
              columns: state.boards[boardId].columns.map(col =>
                col.id === columnId ? { ...col, taskIds: res.taskIds } : col
              )
            }
          }
        }));
      },

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

      fetchUsers: async () => {
        try {
          const token = localStorage.getItem('jwt');
          const res = await api.get('/users', token || undefined);
          set({ users: res });
        } catch (error) {
          console.error('Failed to fetch users:', error);
        }
      },

      getUsers: () => {
        return get().users;
      },

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

      handleRealTimeTaskUpdate: (boardId: string, taskId: string, task: Task) => {
        set((state) => {
          const board = state.boards[boardId];
          if (!board) {
            console.warn('Board not found for real-time task update:', boardId);
            return state;
          }
          
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
          if (!board) {
            console.warn('Board not found for real-time task move:', boardId);
            return state;
          }
          
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
          if (!board) {
            console.warn('Board not found for real-time column update:', boardId);
            return state;
          }
          
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
          if (!board) {
            console.warn('Board not found for real-time columns reorder:', boardId);
            return state;
          }
          
          const columnMap = new Map(board.columns.map(col => [col.id, col]));
          const reorderedColumns = columnIds.map(id => columnMap.get(id)).filter(Boolean) as Column[];
          
          const updatedBoard = { ...board, columns: reorderedColumns };
          return { boards: { ...state.boards, [boardId]: updatedBoard } };
        });
      },

      handleRealTimeTaskAdd: (boardId: string, columnId: string, taskId: string, task: Task) => {
        set((state) => {
          const board = state.boards[boardId];
          if (!board) {
            console.warn('Board not found for real-time task add:', boardId);
            return state;
          }
          
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
          if (!board) {
            console.warn('Board not found for real-time task delete:', boardId);
            return state;
          }
          
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
          if (!board) {
            console.warn('Board not found for real-time column add:', boardId);
            return state;
          }
          
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
          if (!board) {
            console.warn('Board not found for real-time column delete:', boardId);
            return state;
          }
          
          const updatedBoard = {
            ...board,
            columns: board.columns.filter(col => col.id !== columnId)
          };
          
          return { boards: { ...state.boards, [boardId]: updatedBoard } };
        });
      },

      clearBoards: () => {
        set({ boards: {}, users: [] });
      }
    }),
    {
      name: 'board-storage',
      partialize: (state) => ({ boards: state.boards, users: state.users }),
    }
  )
); 