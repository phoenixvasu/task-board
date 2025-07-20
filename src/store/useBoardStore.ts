import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Board, Task, Column, User } from '../types';
import { api } from '../api';
import { socket, emitSocketEvent, onSocketEvent, setSocketAuthToken, getSocketId } from '../api/socket';
import {
  SOCKET_EVENTS,
  CreateTaskPayload, TaskCreatedPayload, UpdateTaskPayload, TaskUpdatedPayload, DeleteTaskPayload, TaskDeletedPayload, MoveTaskPayload, TaskMovedPayload, ReorderTasksPayload, TasksReorderedPayload,
  CreateColumnPayload, ColumnCreatedPayload, UpdateColumnPayload, ColumnUpdatedPayload, DeleteColumnPayload, ColumnDeletedPayload, ReorderColumnsPayload, ColumnsReorderedPayload,
  UpdateBoardPayload, BoardUpdatedPayload, DeleteBoardPayload, BoardDeletedPayload, AckSuccess, AckError, BulkMoveTasksPayload, TasksBulkMovedPayload, BulkUpdateTasksPayload, TasksBulkUpdatedPayload, BulkUpdateColumnsPayload, ColumnsBulkUpdatedPayload, JoinBoardPayload
} from '../types/socketEvents';
import { useEffect } from 'react';
import { toast } from 'react-toastify';
import { useCollaborationStore } from './useCollaborationStore';
import { useAuthStore } from './useAuthStore';
import { debounce, throttle } from '../utils';

function isColumn(col: any): col is Column {
  return (
    typeof col.id === 'string' &&
    typeof col.name === 'string' &&
    Array.isArray(col.taskIds) &&
    col.taskIds.every((id: any) => typeof id === 'string') &&
    typeof col.createdAt === 'string' &&
    typeof col.updatedAt === 'string'
  );
}

// --- Types ---
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
  // Utility
  clearBoards: () => void;
}

const generateId = () => Math.random().toString(36).substr(2, 9);

// --- Optimistic update tracking ---
const optimisticUpdates = {
  task: new Map<string, Task>(),
  column: new Map<string, Column>(),
  updateTask: new Map<string, any>(),
  deleteTask: new Map<string, any>(),
  moveTask: new Map<string, any>(),
  reorderTasks: new Map<string, any>(),
  updateColumn: new Map<string, any>(),
  deleteColumn: new Map<string, any>(),
  reorderColumns: new Map<string, any>(),
  updateBoard: new Map<string, any>(),
  deleteBoard: new Map<string, any>(),
};

// --- Activity feed ---
let activityFeed: Array<{ boardId: string; userId: string; activity: string; timestamp: string }> = [];
export function useActivityFeed(boardId: string) {
  return activityFeed.filter(a => a.boardId === boardId);
}

// --- Real-time integration ---
export function useBoardSocket(boardId: string | null, userId: string | null) {
  useEffect(() => {
    if (!boardId || !userId) return;
    if (!socket.connected) socket.connect();
    emitSocketEvent<JoinBoardPayload, AckSuccess | AckError>(
      SOCKET_EVENTS.JOIN_BOARD,
      { boardId, userId },
      (ack) => {
        if (!ack.success) console.error('Failed to join board room:', ack.error);
      }
    );
    return () => {
      emitSocketEvent(SOCKET_EVENTS.LEAVE_BOARD, { boardId, userId }, () => {});
    };
  }, [boardId, userId]);
}

const debouncedRejoinAndResync = debounce(async (boards, userId, fetchBoard) => {
  for (const boardId of Object.keys(boards)) {
    if (userId && boardId) {
      emitSocketEvent(SOCKET_EVENTS.JOIN_BOARD, { boardId, userId }, () => {});
      await fetchBoard(boardId); // Fetch latest state
    }
  }
}, 1000);

export function useRealtimeRejoinAndResync() {
  const { connectionStatus } = useCollaborationStore();
  const { user } = useAuthStore();
  const boards = useBoardStore.getState().boards;
  const fetchBoard = useBoardStore.getState().fetchBoard;
  useEffect(() => {
    if (connectionStatus === 'connected') {
      debouncedRejoinAndResync(boards, user?.id, fetchBoard);
    }
  }, [connectionStatus, user?.id, boards]);
}

// --- Zustand Store ---
export const useBoardStore = create<BoardState>()(
  persist(
    (set, get) => ({
      boards: {},
      currentBoardId: null,
      users: [],
      isLoading: false,
      // --- Board CRUD ---
      fetchBoards: async () => {
        set({ isLoading: true });
        try {
          const token = localStorage.getItem('jwt');
          const boards = await api.get('/api/boards', token || undefined);
          const boardsMap = boards.reduce((acc: Record<string, Board>, board: any) => {
            const boardId = board.id || board.boardId;
            if (boardId) {
              const tasks = board.tasks && typeof board.tasks === 'object' && !Array.isArray(board.tasks)
                ? board.tasks
                : {};
              const columns = (board.columns || []).map((col: any) => ({
                id: String(col.id),
                name: String(col.name),
                taskIds: Array.isArray(col.taskIds) ? col.taskIds.filter((id: any) => typeof id === 'string') : [],
                createdAt: typeof col.createdAt === 'string' ? col.createdAt : new Date().toISOString(),
                updatedAt: typeof col.updatedAt === 'string' ? col.updatedAt : new Date().toISOString(),
              }));
              // Defensive merge: if board exists in state, merge tasks
              const existing = acc[boardId] || get().boards[boardId];
              let mergedTasks = { ...tasks };
              if (existing && existing.tasks && Object.keys(existing.tasks).length > 0) {
                mergedTasks = { ...existing.tasks, ...tasks };
              }
              acc[boardId] = {
                ...existing,
                ...board,
                id: boardId,
                tasks: mergedTasks,
                columns
              };
            }
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
        const board = await api.get(`/api/boards/${id}`, token || undefined);
        const tasks = board.tasks && typeof board.tasks === 'object' && !Array.isArray(board.tasks)
          ? board.tasks
          : {};
        const columns = (board.columns || []).map((col: any) => ({
          id: String(col.id),
          name: String(col.name),
          taskIds: Array.isArray(col.taskIds) ? col.taskIds.filter((taskId: string) => tasks[taskId]) : [],
          createdAt: typeof col.createdAt === 'string' ? col.createdAt : new Date().toISOString(),
          updatedAt: typeof col.updatedAt === 'string' ? col.updatedAt : new Date().toISOString(),
        }));
        set(state => {
          const existing = state.boards[id];
          let mergedTasks = { ...tasks };
          if (existing && existing.tasks && Object.keys(existing.tasks).length > 0) {
            mergedTasks = { ...existing.tasks, ...tasks };
          }
          const newBoard = { ...existing, ...board, tasks: mergedTasks, columns };
          return { boards: { ...state.boards, [id]: newBoard } };
        });
        return { ...board, tasks, columns };
      },
      createBoard: async (name: string, description?: string) => {
        const token = localStorage.getItem('jwt');
        const board = await api.post('/api/boards', { name, description }, token || undefined);
        set(state => ({
          boards: { ...state.boards, [board.id]: board }
        }));
        return board;
      },
      updateBoard: async (id: string, updates: Partial<Board>) => {
        const token = localStorage.getItem('jwt');
        const res = await api.put(`/api/boards/${id}`, updates, token || undefined);
        set(state => {
          const prev = state.boards[id] || {};
          // Ensure columns and tasks are always present and correctly typed
          const columns = Array.isArray(res.columns)
            ? res.columns.map((col: any) => ({
                id: String(col.id),
                name: String(col.name),
                taskIds: Array.isArray(col.taskIds) ? col.taskIds.filter((id: any) => typeof id === 'string') : [],
                createdAt: typeof col.createdAt === 'string' ? col.createdAt : new Date().toISOString(),
                updatedAt: typeof col.updatedAt === 'string' ? col.updatedAt : new Date().toISOString(),
              } as Column))
            : (prev.columns as Column[]) || [];
          const tasks = res.tasks && typeof res.tasks === 'object' && !Array.isArray(res.tasks)
            ? res.tasks
            : prev.tasks || {};
          const updatedBoard: Board = {
            ...prev,
            ...res,
            id,
            columns,
            tasks,
          };
          return {
            boards: {
              ...state.boards,
              [id]: updatedBoard,
            },
          };
        });
        // Emit socket event for real-time update
        emitSocketEvent(
          SOCKET_EVENTS.UPDATE_BOARD,
          { boardId: id, updates },
          () => {}
        );
      },
      deleteBoard: async (id: string) => {
        const token = localStorage.getItem('jwt');
        await api.delete(`/api/boards/${id}`, token || undefined);
        set(state => {
          const { [id]: deleted, ...remaining } = state.boards;
          return { boards: remaining };
        });
      },
      setCurrentBoard: (id: string) => {
        set({ currentBoardId: id });
      },
      // --- Column CRUD ---
      createColumn: async (boardId: string, name: string) => {
        return new Promise<Column>((resolve, reject) => {
          const optimisticId = name + '-' + Date.now();
          const now = new Date().toISOString();
          const optimisticColumn = { id: optimisticId, name, taskIds: [], createdAt: now, updatedAt: now } as Column;
          set(state => {
            const board = state.boards[boardId];
            if (!board) return state;
            return { boards: { ...state.boards, [boardId]: { ...board, columns: [...board.columns, optimisticColumn] } } };
          });
          optimisticUpdates.column.set(optimisticId, optimisticColumn);
          emitSocketEvent<CreateColumnPayload, AckSuccess | AckError>(
            SOCKET_EVENTS.CREATE_COLUMN,
            { boardId, name },
            (ack) => {
              if (ack.success) {
                optimisticUpdates.column.delete(optimisticId);
                resolve(ack.column);
              } else {
                set(state => {
                  const board = state.boards[boardId];
                  if (!board) return state;
                  return {
          boards: {
            ...state.boards,
            [boardId]: {
                        ...board,
                        columns: board.columns
                          .filter(col => col.id !== optimisticId)
                          .map((col: any) => ({
                            id: String(col.id),
                            name: String(col.name),
                            taskIds: Array.isArray(col.taskIds) ? col.taskIds.filter((id: any) => typeof id === 'string') : [],
                            createdAt: typeof col.createdAt === 'string' ? col.createdAt : new Date().toISOString(),
                            updatedAt: typeof col.updatedAt === 'string' ? col.updatedAt : new Date().toISOString(),
                          }))
                          .filter(isColumn)
                          .map((col: any) => col as Column)
                      }
                    }
                  };
                });
                optimisticUpdates.column.delete(optimisticId);
                toast.error(ack.error);
                reject(new Error(ack.error));
              }
            }
          );
        });
      },
      updateColumn: async (boardId: string, columnId: string, updates: Partial<Column>) => {
        return new Promise<void>((resolve, reject) => {
          const prevCol = get().boards[boardId]?.columns.find(col => col.id === columnId);
          if (!prevCol) return reject(new Error('Column not found'));
          set(state => {
            const board = state.boards[boardId];
            if (!board) return state;
            const columns = board.columns.map(col =>
              col.id === columnId ? { ...col, ...updates } : col
            );
            return { boards: { ...state.boards, [boardId]: { ...board, columns } } };
          });
          optimisticUpdates.updateColumn.set(columnId, prevCol);
          emitSocketEvent<UpdateColumnPayload, AckSuccess | AckError>(
            SOCKET_EVENTS.UPDATE_COLUMN,
            { boardId, columnId, updates },
            (ack) => {
              if (ack.success) {
                optimisticUpdates.updateColumn.delete(columnId);
                resolve();
              } else {
                set(state => {
                  const board = state.boards[boardId];
                  if (!board) return state;
                  const columns = board.columns.map(col =>
                    col.id === columnId ? prevCol : col
                  );
                  return { boards: { ...state.boards, [boardId]: { ...board, columns } } };
                });
                optimisticUpdates.updateColumn.delete(columnId);
                toast.error(ack.error);
                reject(new Error(ack.error));
              }
            }
          );
        });
      },
      deleteColumn: async (boardId: string, columnId: string) => {
        return new Promise<void>((resolve, reject) => {
          const prevColumns = get().boards[boardId]?.columns.map(col => ({ ...col }));
          set(state => {
            const board = state.boards[boardId];
            if (!board) return state;
            const columns = board.columns.filter(col => col.id !== columnId);
            return { boards: { ...state.boards, [boardId]: { ...board, columns } } };
          });
          optimisticUpdates.deleteColumn.set(columnId, get().boards[boardId]?.columns.find(col => col.id === columnId));
          emitSocketEvent<DeleteColumnPayload, AckSuccess | AckError>(
            SOCKET_EVENTS.DELETE_COLUMN,
            { boardId, columnId },
            (ack) => {
              if (ack.success) {
                optimisticUpdates.deleteColumn.delete(columnId);
                resolve();
              } else {
                set(state => {
                  const board = state.boards[boardId];
                  if (!board) return state;
                  return { boards: { ...state.boards, [boardId]: { ...board, columns: prevColumns } } };
                });
                optimisticUpdates.deleteColumn.delete(columnId);
                toast.error(ack.error);
                reject(new Error(ack.error));
              }
            }
          );
        });
      },
      reorderColumns: async (boardId: string, columnIds: string[]) => {
        return new Promise<void>((resolve, reject) => {
          const prevColumnIds = get().boards[boardId]?.columns.map(col => col.id);
          set(state => {
            const board = state.boards[boardId];
            if (!board) return state;
            const columns = columnIds.map(id => board.columns.find(col => col.id === id)).filter(Boolean) as Column[];
            return { boards: { ...state.boards, [boardId]: { ...board, columns } } };
          });
          optimisticUpdates.reorderColumns.set(boardId, columnIds);
          emitSocketEvent<ReorderColumnsPayload, AckSuccess | AckError>(
            SOCKET_EVENTS.REORDER_COLUMNS,
            { boardId, columnIds },
            (ack) => {
              if (ack.success) {
                optimisticUpdates.reorderColumns.delete(boardId);
                resolve();
              } else {
                set(state => {
                  const board = state.boards[boardId];
                  if (!board) return state;
                  const columns = prevColumnIds.map(id => board.columns.find(col => col.id === id)).filter(Boolean) as Column[];
                  return { boards: { ...state.boards, [boardId]: { ...board, columns } } };
                });
                optimisticUpdates.reorderColumns.delete(boardId);
                toast.error(ack.error);
                reject(new Error(ack.error));
              }
            }
          );
        });
      },
      // --- Task CRUD ---
      createTask: async (boardId: string, columnId: string, task: Partial<Task>) => {
        return new Promise<Task>((resolve, reject) => {
          const optimisticId = task.id || generateId();
          const optimisticTask = { ...task, id: optimisticId } as Task;
          set(state => {
            const board = state.boards[boardId];
            if (!board) return state;
            const tasks = { ...board.tasks, [optimisticId]: optimisticTask };
            const columns = board.columns.map(col =>
              col.id === columnId ? { ...col, taskIds: [...col.taskIds, optimisticId] } : col
            );
            return { boards: { ...state.boards, [boardId]: { ...board, tasks, columns } } };
          });
          optimisticUpdates.task.set(optimisticId, optimisticTask);
          emitSocketEvent<CreateTaskPayload, AckSuccess | AckError>(
            SOCKET_EVENTS.CREATE_TASK,
            { boardId, columnId, task: optimisticTask },
            (ack) => {
              if (ack.success) {
                optimisticUpdates.task.delete(optimisticId);
                resolve(ack.task);
              } else {
                set(state => {
                  const board = state.boards[boardId];
                  if (!board) return state;
                  const { [optimisticId]: _, ...tasks } = board.tasks;
                  const columns = board.columns.map(col =>
                    col.id === columnId ? { ...col, taskIds: col.taskIds.filter(id => id !== optimisticId) } : col
                  );
                  return { boards: { ...state.boards, [boardId]: { ...board, tasks, columns } } };
                });
                optimisticUpdates.task.delete(optimisticId);
                toast.error(ack.error);
                reject(new Error(ack.error));
              }
            }
          );
        });
      },
      updateTask: async (boardId: string, taskId: string, updates: Partial<Task>) => {
        return new Promise<void>((resolve, reject) => {
          const prevTask = get().boards[boardId]?.tasks[taskId];
          if (!prevTask) return reject(new Error('Task not found'));
          set(state => {
            const board = state.boards[boardId];
            if (!board) return state;
            const task = { ...board.tasks[taskId], ...updates };
            return { boards: { ...state.boards, [boardId]: { ...board, tasks: { ...board.tasks, [taskId]: task } } } };
          });
          optimisticUpdates.updateTask.set(taskId, updates);
          emitSocketEvent<UpdateTaskPayload, AckSuccess | AckError>(
            SOCKET_EVENTS.UPDATE_TASK,
            { boardId, taskId, updates },
            (ack) => {
              if (ack.success) {
                optimisticUpdates.updateTask.delete(taskId);
                resolve();
              } else {
                set(state => {
                  const board = state.boards[boardId];
                  if (!board) return state;
                  return { boards: { ...state.boards, [boardId]: { ...board, tasks: { ...board.tasks, [taskId]: prevTask } } } };
                });
                optimisticUpdates.updateTask.delete(taskId);
                toast.error(ack.error);
                reject(new Error(ack.error));
              }
            }
          );
        });
      },
      deleteTask: async (boardId: string, taskId: string) => {
        return new Promise<void>((resolve, reject) => {
          const prevTask = get().boards[boardId]?.tasks[taskId];
          const prevColumns = get().boards[boardId]?.columns.map(col => ({ ...col }));
          if (!prevTask) return reject(new Error('Task not found'));
          set(state => {
            const board = state.boards[boardId];
            if (!board) return state;
            const { [taskId]: _, ...tasks } = board.tasks;
            const columns = board.columns.map(col => ({ ...col, taskIds: col.taskIds.filter(id => id !== taskId) }));
            return { boards: { ...state.boards, [boardId]: { ...board, tasks, columns } } };
          });
          optimisticUpdates.deleteTask.set(taskId, prevTask);
          emitSocketEvent<DeleteTaskPayload, AckSuccess | AckError>(
            SOCKET_EVENTS.DELETE_TASK,
            { boardId, taskId },
            (ack) => {
              if (ack.success) {
                optimisticUpdates.deleteTask.delete(taskId);
                resolve();
              } else {
        set(state => {
                  const board = state.boards[boardId];
                  if (!board) return state;
                  const tasks = { ...board.tasks, [taskId]: prevTask };
                  return { boards: { ...state.boards, [boardId]: { ...board, tasks, columns: prevColumns } } };
                });
                optimisticUpdates.deleteTask.delete(taskId);
                toast.error(ack.error);
                reject(new Error(ack.error));
              }
            }
          );
        });
      },
      moveTask: async (boardId: string, taskId: string, fromColumnId: string, toColumnId: string, newIndex: number) => {
        return new Promise<void>((resolve, reject) => {
          const prevColumns = get().boards[boardId]?.columns.map(col => ({ ...col }));
          set(state => {
            const board = state.boards[boardId];
            if (!board) return state;
            const columns = board.columns.map(col => {
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
            return { boards: { ...state.boards, [boardId]: { ...board, columns } } };
          });
          optimisticUpdates.moveTask.set(taskId, { fromColumnId, toColumnId, newIndex });
          emitSocketEvent<MoveTaskPayload, AckSuccess | AckError>(
            SOCKET_EVENTS.MOVE_TASK,
            { boardId, taskId, fromColumnId, toColumnId, newIndex },
            (ack) => {
              if (ack.success) {
                optimisticUpdates.moveTask.delete(taskId);
                resolve();
              } else {
                set(state => {
                  const board = state.boards[boardId];
                  if (!board) return state;
                  return { boards: { ...state.boards, [boardId]: { ...board, columns: prevColumns } } };
                });
                optimisticUpdates.moveTask.delete(taskId);
                toast.error(ack.error);
                reject(new Error(ack.error));
              }
            }
          );
        });
      },
      reorderTasks: async (boardId: string, columnId: string, taskIds: string[]) => {
        return new Promise<void>((resolve, reject) => {
          const prevTaskIds = get().boards[boardId]?.columns.find(col => col.id === columnId)?.taskIds;
          set(state => {
            const board = state.boards[boardId];
            if (!board) return state;
            const columns = board.columns.map(col =>
              col.id === columnId ? { ...col, taskIds } : col
            );
            return { boards: { ...state.boards, [boardId]: { ...board, columns } } };
          });
          optimisticUpdates.reorderTasks.set(columnId, taskIds);
          emitSocketEvent<ReorderTasksPayload, AckSuccess | AckError>(
            SOCKET_EVENTS.REORDER_TASKS,
            { boardId, columnId, taskIds },
            (ack) => {
              if (ack.success) {
                optimisticUpdates.reorderTasks.delete(columnId);
                resolve();
              } else {
                set(state => {
                  const board = state.boards[boardId];
                  if (!board) return state;
                  const columns = board.columns.map(col =>
                    col.id === columnId ? { ...col, taskIds: prevTaskIds } : col
                  );
                  return { boards: { ...state.boards, [boardId]: { ...board, columns } } };
                });
                optimisticUpdates.reorderTasks.delete(columnId);
                toast.error(ack.error);
                reject(new Error(ack.error));
              }
            }
          );
        });
      },
      // --- User CRUD ---
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
          const res = await api.get('/api/users', token || undefined);
          set({ users: res });
        } catch (error) {
          console.error('Failed to fetch users:', error);
        }
      },
      getUsers: () => {
        return get().users;
      },
      // --- Utility ---
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
      clearBoards: () => {
        set({ boards: {}, users: [] });
      },
    }),
    {
      name: 'board-storage',
      partialize: (state) => ({ boards: state.boards, users: state.users }),
    }
  )
); 

// --- Register socket listeners once ---
(function registerBoardSocketListeners() {
  const set = useBoardStore.setState;
  const get = useBoardStore.getState;
  // Add at the top, after imports:
  // Task events
  onSocketEvent(SOCKET_EVENTS.TASK_CREATED, (payload: TaskCreatedPayload) => {
    if (payload.sourceClientId && payload.sourceClientId === getSocketId()) return;
    set((state: any) => {
      const board = state.boards[payload.boardId];
      if (!board) return state;
      const optimistic = optimisticUpdates.task.get(payload.task.id);
      if (optimistic) {
        const isEqual = JSON.stringify(optimistic) === JSON.stringify(payload.task);
        optimisticUpdates.task.delete(payload.task.id);
        if (!isEqual) {
          toast.info('Task state updated by server due to conflict.');
        }
      }
      const tasks = { ...board.tasks, [payload.task.id]: payload.task };
      const columns = board.columns.map((col: any) =>
        col.id === payload.columnId ? { ...col, taskIds: [...col.taskIds, payload.task.id] } : col
      );
      return { boards: { ...state.boards, [payload.boardId]: { ...board, tasks, columns } } };
    });
  });
  onSocketEvent(SOCKET_EVENTS.TASK_UPDATED, (payload: TaskUpdatedPayload) => {
    if (payload.sourceClientId && payload.sourceClientId === getSocketId()) return;
    set(state => {
      const board = state.boards[payload.boardId];
      if (!board) return state;
      const optimistic = optimisticUpdates.updateTask.get(payload.taskId);
      if (optimistic) {
        const serverTask = { ...board.tasks[payload.taskId], ...payload.updates };
        const isEqual = JSON.stringify(optimistic) === JSON.stringify(payload.updates);
        optimisticUpdates.updateTask.delete(payload.taskId);
        if (!isEqual) {
          toast.info('Task update overwritten by server.');
        }
      }
      const task = { ...board.tasks[payload.taskId], ...payload.updates };
      return { boards: { ...state.boards, [payload.boardId]: { ...board, tasks: { ...board.tasks, [payload.taskId]: task } } } };
    });
  });
  onSocketEvent(SOCKET_EVENTS.TASK_DELETED, (payload: TaskDeletedPayload) => {
    if (payload.sourceClientId && payload.sourceClientId === getSocketId()) return;
    set(state => {
      const board = state.boards[payload.boardId];
      if (!board) return state;
      const { [payload.taskId]: _, ...tasks } = board.tasks;
      const columns = board.columns.map(col => ({ ...col, taskIds: col.taskIds.filter(id => id !== payload.taskId) }));
      return { boards: { ...state.boards, [payload.boardId]: { ...board, tasks, columns } } };
    });
  });
  onSocketEvent(SOCKET_EVENTS.TASK_MOVED, (payload: TaskMovedPayload) => {
    if (payload.sourceClientId && payload.sourceClientId === getSocketId()) return;
    set(state => {
      const board = state.boards[payload.boardId];
      if (!board) return state;
      const columns = board.columns.map(col => {
        if (col.id === payload.fromColumnId) {
          return { ...col, taskIds: col.taskIds.filter(id => id !== payload.taskId) };
        }
        if (col.id === payload.toColumnId) {
          const newTaskIds = [...col.taskIds];
          newTaskIds.splice(payload.newIndex, 0, payload.taskId);
          return { ...col, taskIds: newTaskIds };
        }
        return col;
      });
      return { boards: { ...state.boards, [payload.boardId]: { ...board, columns } } };
    });
  });
  onSocketEvent(SOCKET_EVENTS.TASKS_REORDERED, (payload: TasksReorderedPayload) => {
    if (payload.sourceClientId && payload.sourceClientId === getSocketId()) return;
    set(state => {
      const board = state.boards[payload.boardId];
      if (!board) return state;
      const columns = board.columns.map(col =>
        col.id === payload.columnId ? { ...col, taskIds: payload.taskIds } : col
      );
      return { boards: { ...state.boards, [payload.boardId]: { ...board, columns } } };
    });
  });
  // Column events
  onSocketEvent(SOCKET_EVENTS.COLUMN_CREATED, (payload: ColumnCreatedPayload) => {
    if (payload.sourceClientId && payload.sourceClientId === getSocketId()) return;
    set(state => {
      const board = state.boards[payload.boardId];
      if (!board) return state;
      const optimistic = optimisticUpdates.column.get(payload.column.id);
      if (optimistic) {
        const isEqual = JSON.stringify(optimistic) === JSON.stringify(payload.column);
        optimisticUpdates.column.delete(payload.column.id);
        if (!isEqual) {
          toast.info('Column state updated by server due to conflict.');
        }
      }
      return { boards: { ...state.boards, [payload.boardId]: { ...board, columns: [...board.columns, payload.column] } } };
    });
  });
  onSocketEvent(SOCKET_EVENTS.COLUMN_UPDATED, (payload: ColumnUpdatedPayload) => {
    if (payload.sourceClientId && payload.sourceClientId === getSocketId()) return;
    set(state => {
      const board = state.boards[payload.boardId];
      if (!board) return state;
      const optimistic = optimisticUpdates.updateColumn.get(payload.columnId);
      if (optimistic) {
        const isEqual = JSON.stringify(optimistic) === JSON.stringify(payload.updates);
        optimisticUpdates.updateColumn.delete(payload.columnId);
        if (!isEqual) {
          toast.info('Column update overwritten by server.');
        }
      }
      const columns = board.columns.map(col =>
        col.id === payload.columnId ? { ...col, ...payload.updates } : col
      );
      return { boards: { ...state.boards, [payload.boardId]: { ...board, columns } } };
    });
  });
  onSocketEvent(SOCKET_EVENTS.COLUMN_DELETED, (payload: ColumnDeletedPayload) => {
    if (payload.sourceClientId && payload.sourceClientId === getSocketId()) return;
    set(state => {
      const board = state.boards[payload.boardId];
      if (!board) return state;
      const optimistic = optimisticUpdates.deleteColumn.get(payload.columnId);
      if (optimistic) {
        const isEqual = JSON.stringify(optimistic) === JSON.stringify(board.columns.find(col => col.id === payload.columnId));
        optimisticUpdates.deleteColumn.delete(payload.columnId);
        if (!isEqual) {
          toast.info('Column deleted by server.');
        }
      }
      const columns = board.columns.filter(col => col.id !== payload.columnId);
      return { boards: { ...state.boards, [payload.boardId]: { ...board, columns } } };
    });
  });
  onSocketEvent(SOCKET_EVENTS.COLUMNS_REORDERED, (payload: ColumnsReorderedPayload) => {
    if (payload.sourceClientId && payload.sourceClientId === getSocketId()) return;
    set(state => {
      const board = state.boards[payload.boardId];
      if (!board) return state;
      const optimistic = optimisticUpdates.reorderColumns.get(payload.boardId);
      if (optimistic) {
        const isEqual = JSON.stringify(optimistic) === JSON.stringify(payload.columnIds);
        optimisticUpdates.reorderColumns.delete(payload.boardId);
        if (!isEqual) {
          toast.info('Columns reordered by server.');
        }
      }
      const columns = payload.columnIds.map(id => board.columns.find(col => col.id === id)).filter(Boolean) as Column[];
      return { boards: { ...state.boards, [payload.boardId]: { ...board, columns } } };
    });
  });
  // Board events
  onSocketEvent(SOCKET_EVENTS.BOARD_UPDATED, (payload: BoardUpdatedPayload) => {
    if (payload.sourceClientId && payload.sourceClientId === getSocketId()) return;
    set(state => {
      const board = state.boards[payload.boardId];
      if (!board) return state;
      const optimistic = optimisticUpdates.updateBoard.get(payload.boardId);
      if (optimistic) {
        const isEqual = JSON.stringify(optimistic) === JSON.stringify(payload.updates);
        optimisticUpdates.updateBoard.delete(payload.boardId);
        if (!isEqual) {
          toast.info('Board updated by server.');
        }
      }
      return { boards: { ...state.boards, [payload.boardId]: { ...board, ...payload.updates } } };
    });
  });
  onSocketEvent(SOCKET_EVENTS.BOARD_DELETED, (payload: BoardDeletedPayload) => {
    if (payload.sourceClientId && payload.sourceClientId === getSocketId()) return;
    set(state => {
      const optimistic = optimisticUpdates.deleteBoard.get(payload.boardId);
      if (optimistic) {
        const isEqual = JSON.stringify(optimistic) === JSON.stringify(get().boards[payload.boardId]);
        optimisticUpdates.deleteBoard.delete(payload.boardId);
        if (!isEqual) {
          toast.info('Board deleted by server.');
        }
      }
      const { [payload.boardId]: _, ...boards } = state.boards;
      return { boards };
    });
  });
  // Bulk move tasks
  onSocketEvent(SOCKET_EVENTS.TASKS_BULK_MOVED, (payload: TasksBulkMovedPayload) => {
    if (payload.sourceClientId && payload.sourceClientId === getSocketId()) return;
    set(state => {
      const board = state.boards[payload.boardId];
      if (!board) return state;
      return { boards: { ...state.boards, [payload.boardId]: { ...board, columns: payload.newColumns, tasks: payload.newTasks } } };
    });
  });
  // Bulk update tasks
  onSocketEvent(SOCKET_EVENTS.TASKS_BULK_UPDATED, (payload: TasksBulkUpdatedPayload) => {
    if (payload.sourceClientId && payload.sourceClientId === getSocketId()) return;
    set(state => {
      const board = state.boards[payload.boardId];
      if (!board) return state;
      return { boards: { ...state.boards, [payload.boardId]: { ...board, tasks: payload.newTasks } } };
    });
  });
  // Bulk update columns
  onSocketEvent(SOCKET_EVENTS.COLUMNS_BULK_UPDATED, (payload: ColumnsBulkUpdatedPayload) => {
    if (payload.sourceClientId && payload.sourceClientId === getSocketId()) return;
    set(state => {
      const board = state.boards[payload.boardId];
      if (!board) return state;
      return { boards: { ...state.boards, [payload.boardId]: { ...board, columns: payload.newColumns } } };
    });
  });
  // Activity feed
  onSocketEvent(SOCKET_EVENTS.ACTIVITY_EVENT, (payload: unknown) => {
    const activity = payload as { boardId: string; userId: string; activity: string; timestamp: string };
    activityFeed.push(activity);
    if (activityFeed.length > 100) activityFeed = activityFeed.slice(-100);
  });
  // Board notifications
  onSocketEvent(SOCKET_EVENTS.BOARD_NOTIFY, (payload) => {
    const notify = payload as { type: string; message: string };
    toast[notify.type === 'error' ? 'error' : notify.type === 'warning' ? 'warn' : 'info'](notify.message);
  });
  onSocketEvent(SOCKET_EVENTS.MEMBER_REMOVED, (payload) => {
    const userId = useAuthStore.getState().user?.id;
    if (payload.userId === userId) {
      set(state => {
        const { [payload.boardId]: _, ...boards } = state.boards;
        return { boards };
      });
    }
  });
})();