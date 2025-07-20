import { Server, Socket } from 'socket.io';
import Board from '../models/Board.js';
import User from '../models/User.js';
import { SOCKET_EVENTS, JoinBoardPayload, LeaveBoardPayload, UserTypingPayload, UserEditingPayload, CreateTaskPayload, UpdateTaskPayload, DeleteTaskPayload, MoveTaskPayload, ReorderTasksPayload, CreateColumnPayload, UpdateColumnPayload, DeleteColumnPayload, ReorderColumnsPayload, AddMemberPayload, RemoveMemberPayload, ChangeRolePayload, UpdatePermissionsPayload, UpdateBoardPayload, DeleteBoardPayload, BoardNotifyPayload, AckSuccess, AckError } from '../../src/types/socketEvents';

// Helper: get user from socket
function getUser(socket: Socket) {
  return (socket as any).user;
}

// Helper: permission check (simplified, expand as needed)
async function hasBoardPermission(boardId: string, userId: string, action: string): Promise<boolean> {
  const board = await Board.findOne({ id: boardId });
  if (!board) return false;
  if (board.createdBy.toString() === userId) return true;
  const member = board.members.find((m: any) => m.userId.toString() === userId);
  if (!member) return false;
  if (action === 'view') return member.permissions.canView;
  if (action === 'edit') return member.permissions.canEdit;
  if (action === 'delete') return member.permissions.canDelete;
  if (action === 'invite') return member.permissions.canInvite;
  if (action === 'manage') return member.permissions.canManageMembers;
  return false;
}

// --- UserId to SocketId(s) Map ---
const userIdToSockets = new Map();

export function registerSocketHandlers(io: Server) {
  io.on('connection', (socket: Socket) => {
    const user = getUser(socket);
    if (!user) {
      socket.disconnect(true);
      return;
    }
    // Add socket to userId map
    if (!userIdToSockets.has(user.id)) userIdToSockets.set(user.id, new Set());
    userIdToSockets.get(user.id).add(socket.id);

    // --- Room Join/Leave ---
    socket.on(SOCKET_EVENTS.JOIN_BOARD, async (payload: JoinBoardPayload, ack) => {
      try {
        const { boardId } = payload;
        if (!await hasBoardPermission(boardId, user.id, 'view')) throw new Error('No access');
        socket.join(boardId);
        ack && ack({ success: true });
        socket.to(boardId).emit(SOCKET_EVENTS.USER_JOINED, { boardId, userId: user.id, username: user.id });
      } catch (err: any) {
        ack && ack({ success: false, error: err.message });
      }
    });
    socket.on(SOCKET_EVENTS.LEAVE_BOARD, async (payload: LeaveBoardPayload, ack) => {
      try {
        const { boardId } = payload;
        socket.leave(boardId);
        ack && ack({ success: true });
        socket.to(boardId).emit(SOCKET_EVENTS.USER_LEFT, { boardId, userId: user.id, username: user.id });
      } catch (err: any) {
        ack && ack({ success: false, error: err.message });
      }
    });

    // --- Presence/Typing/Editing ---
    socket.on(SOCKET_EVENTS.USER_TYPING, (payload: UserTypingPayload) => {
      socket.to(payload.boardId).emit(SOCKET_EVENTS.USER_TYPING, payload);
    });
    socket.on(SOCKET_EVENTS.USER_EDITING, (payload: UserEditingPayload) => {
      socket.to(payload.boardId).emit(SOCKET_EVENTS.USER_EDITING, payload);
    });

    // --- Task Events ---
    socket.on(SOCKET_EVENTS.CREATE_TASK, async (payload: CreateTaskPayload, ack) => {
      try {
        if (!await hasBoardPermission(payload.boardId, user.id, 'edit')) throw new Error('No permission');
        const board = await Board.findOne({ id: payload.boardId });
        if (!board) throw new Error('Board not found');
        const task = { ...payload.task, id: payload.task.id, createdBy: user.id, createdAt: new Date(), updatedAt: new Date() };
        board.tasks.set(task.id, task);
        const col = board.columns.find((c: any) => c.id === payload.columnId);
        if (!col) throw new Error('Column not found');
        col.taskIds.push(task.id);
        await board.save();
        io.to(payload.boardId).emit(SOCKET_EVENTS.TASK_CREATED, { boardId: payload.boardId, columnId: payload.columnId, task, sourceClientId: socket.id });
        io.to(payload.boardId).emit(SOCKET_EVENTS.ACTIVITY_EVENT, {
          boardId: payload.boardId,
          userId: user.id,
          activity: `created a new task in column ${payload.columnId}`,
          timestamp: new Date().toISOString(),
        });
        io.to(payload.boardId).emit(SOCKET_EVENTS.BOARD_NOTIFY, {
          boardId: payload.boardId,
          message: 'A new task was created.',
          type: 'info',
        });
        ack && ack({ success: true, task });
      } catch (err: any) {
        ack && ack({ success: false, error: err.message });
      }
    });
    socket.on(SOCKET_EVENTS.UPDATE_TASK, async (payload: UpdateTaskPayload, ack) => {
      try {
        if (!await hasBoardPermission(payload.boardId, user.id, 'edit')) throw new Error('No permission');
        const board = await Board.findOne({ id: payload.boardId });
        if (!board) throw new Error('Board not found');
        const task = board.tasks.get(payload.taskId);
        if (!task) throw new Error('Task not found');
        Object.assign(task, payload.updates, { updatedAt: new Date() });
        board.tasks.set(payload.taskId, task);
        await board.save();
        io.to(payload.boardId).emit(SOCKET_EVENTS.TASK_UPDATED, { boardId: payload.boardId, taskId: payload.taskId, updates: payload.updates, sourceClientId: socket.id });
        io.to(payload.boardId).emit(SOCKET_EVENTS.ACTIVITY_EVENT, {
          boardId: payload.boardId,
          userId: user.id,
          activity: `updated task ${payload.taskId}`,
          timestamp: new Date().toISOString(),
        });
        io.to(payload.boardId).emit(SOCKET_EVENTS.BOARD_NOTIFY, {
          boardId: payload.boardId,
          message: 'A task was updated.',
          type: 'info',
        });
        ack && ack({ success: true });
      } catch (err: any) {
        ack && ack({ success: false, error: err.message });
      }
    });
    socket.on(SOCKET_EVENTS.DELETE_TASK, async (payload: DeleteTaskPayload, ack) => {
      try {
        if (!await hasBoardPermission(payload.boardId, user.id, 'edit')) throw new Error('No permission');
        const board = await Board.findOne({ id: payload.boardId });
        if (!board) throw new Error('Board not found');
        board.tasks.delete(payload.taskId);
        for (const col of board.columns) {
          col.taskIds = col.taskIds.filter((id: string) => id !== payload.taskId);
        }
        await board.save();
        io.to(payload.boardId).emit(SOCKET_EVENTS.TASK_DELETED, { boardId: payload.boardId, taskId: payload.taskId, sourceClientId: socket.id });
        io.to(payload.boardId).emit(SOCKET_EVENTS.ACTIVITY_EVENT, {
          boardId: payload.boardId,
          userId: user.id,
          activity: `deleted task ${payload.taskId}`,
          timestamp: new Date().toISOString(),
        });
        io.to(payload.boardId).emit(SOCKET_EVENTS.BOARD_NOTIFY, {
          boardId: payload.boardId,
          message: 'A task was deleted.',
          type: 'info',
        });
        ack && ack({ success: true });
      } catch (err: any) {
        ack && ack({ success: false, error: err.message });
      }
    });
    socket.on(SOCKET_EVENTS.MOVE_TASK, async (payload: MoveTaskPayload, ack) => {
      try {
        if (!await hasBoardPermission(payload.boardId, user.id, 'edit')) throw new Error('No permission');
        const board = await Board.findOne({ id: payload.boardId });
        if (!board) throw new Error('Board not found');
        const fromCol = board.columns.find((c: any) => c.id === payload.fromColumnId);
        const toCol = board.columns.find((c: any) => c.id === payload.toColumnId);
        if (!fromCol || !toCol) throw new Error('Column not found');
        fromCol.taskIds = fromCol.taskIds.filter((id: string) => id !== payload.taskId);
        toCol.taskIds.splice(payload.newIndex, 0, payload.taskId);
        await board.save();
        io.to(payload.boardId).emit(SOCKET_EVENTS.TASK_MOVED, { ...payload, sourceClientId: socket.id });
        io.to(payload.boardId).emit(SOCKET_EVENTS.ACTIVITY_EVENT, {
          boardId: payload.boardId,
          userId: user.id,
          activity: `moved task ${payload.taskId} from column ${payload.fromColumnId} to column ${payload.toColumnId}`,
          timestamp: new Date().toISOString(),
        });
        io.to(payload.boardId).emit(SOCKET_EVENTS.BOARD_NOTIFY, {
          boardId: payload.boardId,
          message: 'A task was moved.',
          type: 'info',
        });
        ack && ack({ success: true });
      } catch (err: any) {
        ack && ack({ success: false, error: err.message });
      }
    });
    socket.on(SOCKET_EVENTS.REORDER_TASKS, async (payload: ReorderTasksPayload, ack) => {
      try {
        if (!await hasBoardPermission(payload.boardId, user.id, 'edit')) throw new Error('No permission');
        const board = await Board.findOne({ id: payload.boardId });
        if (!board) throw new Error('Board not found');
        const col = board.columns.find((c: any) => c.id === payload.columnId);
        if (!col) throw new Error('Column not found');
        col.taskIds = payload.taskIds;
        await board.save();
        io.to(payload.boardId).emit(SOCKET_EVENTS.TASKS_REORDERED, { ...payload, sourceClientId: socket.id });
        io.to(payload.boardId).emit(SOCKET_EVENTS.ACTIVITY_EVENT, {
          boardId: payload.boardId,
          userId: user.id,
          activity: `reordered tasks in column ${payload.columnId}`,
          timestamp: new Date().toISOString(),
        });
        io.to(payload.boardId).emit(SOCKET_EVENTS.BOARD_NOTIFY, {
          boardId: payload.boardId,
          message: 'Tasks were reordered.',
          type: 'info',
        });
        ack && ack({ success: true });
      } catch (err: any) {
        ack && ack({ success: false, error: err.message });
      }
    });

    // --- Column Events ---
    socket.on(SOCKET_EVENTS.CREATE_COLUMN, async (payload: CreateColumnPayload, ack) => {
      try {
        if (!await hasBoardPermission(payload.boardId, user.id, 'edit')) throw new Error('No permission');
        const board = await Board.findOne({ id: payload.boardId });
        if (!board) throw new Error('Board not found');
        const column = { id: payload.name + '-' + Date.now(), name: payload.name, taskIds: [], createdAt: new Date(), updatedAt: new Date() };
        board.columns.push(column);
        await board.save();
        io.to(payload.boardId).emit(SOCKET_EVENTS.COLUMN_CREATED, { boardId: payload.boardId, column, sourceClientId: socket.id });
        io.to(payload.boardId).emit(SOCKET_EVENTS.ACTIVITY_EVENT, {
          boardId: payload.boardId,
          userId: user.id,
          activity: `created a new column: ${payload.name}`,
          timestamp: new Date().toISOString(),
        });
        io.to(payload.boardId).emit(SOCKET_EVENTS.BOARD_NOTIFY, {
          boardId: payload.boardId,
          message: 'A new column was created.',
          type: 'info',
        });
        ack && ack({ success: true, column });
      } catch (err: any) {
        ack && ack({ success: false, error: err.message });
      }
    });
    socket.on(SOCKET_EVENTS.UPDATE_COLUMN, async (payload: UpdateColumnPayload, ack) => {
      try {
        if (!await hasBoardPermission(payload.boardId, user.id, 'edit')) throw new Error('No permission');
        const board = await Board.findOne({ id: payload.boardId });
        if (!board) throw new Error('Board not found');
        const col = board.columns.find((c: any) => c.id === payload.columnId);
        if (!col) throw new Error('Column not found');
        Object.assign(col, payload.updates, { updatedAt: new Date() });
        await board.save();
        io.to(payload.boardId).emit(SOCKET_EVENTS.COLUMN_UPDATED, { boardId: payload.boardId, columnId: payload.columnId, updates: payload.updates, sourceClientId: socket.id });
        io.to(payload.boardId).emit(SOCKET_EVENTS.ACTIVITY_EVENT, {
          boardId: payload.boardId,
          userId: user.id,
          activity: `updated column ${payload.columnId}`,
          timestamp: new Date().toISOString(),
        });
        io.to(payload.boardId).emit(SOCKET_EVENTS.BOARD_NOTIFY, {
          boardId: payload.boardId,
          message: 'A column was updated.',
          type: 'info',
        });
        ack && ack({ success: true });
      } catch (err: any) {
        ack && ack({ success: false, error: err.message });
      }
    });
    socket.on(SOCKET_EVENTS.DELETE_COLUMN, async (payload: DeleteColumnPayload, ack) => {
      try {
        if (!await hasBoardPermission(payload.boardId, user.id, 'edit')) throw new Error('No permission');
        const board = await Board.findOne({ id: payload.boardId });
        if (!board) throw new Error('Board not found');
        board.columns = board.columns.filter((c: any) => c.id !== payload.columnId);
        await board.save();
        io.to(payload.boardId).emit(SOCKET_EVENTS.COLUMN_DELETED, { boardId: payload.boardId, columnId: payload.columnId, sourceClientId: socket.id });
        io.to(payload.boardId).emit(SOCKET_EVENTS.ACTIVITY_EVENT, {
          boardId: payload.boardId,
          userId: user.id,
          activity: `deleted column ${payload.columnId}`,
          timestamp: new Date().toISOString(),
        });
        io.to(payload.boardId).emit(SOCKET_EVENTS.BOARD_NOTIFY, {
          boardId: payload.boardId,
          message: 'A column was deleted.',
          type: 'info',
        });
        ack && ack({ success: true });
      } catch (err: any) {
        ack && ack({ success: false, error: err.message });
      }
    });
    socket.on(SOCKET_EVENTS.REORDER_COLUMNS, async (payload: ReorderColumnsPayload, ack) => {
      try {
        if (!await hasBoardPermission(payload.boardId, user.id, 'edit')) throw new Error('No permission');
        const board = await Board.findOne({ id: payload.boardId });
        if (!board) throw new Error('Board not found');
        board.columns = payload.columnIds.map((id: string) => board.columns.find((c: any) => c.id === id)).filter(Boolean);
        await board.save();
        io.to(payload.boardId).emit(SOCKET_EVENTS.COLUMNS_REORDERED, { ...payload, sourceClientId: socket.id });
        io.to(payload.boardId).emit(SOCKET_EVENTS.ACTIVITY_EVENT, {
          boardId: payload.boardId,
          userId: user.id,
          activity: `reordered columns`,
          timestamp: new Date().toISOString(),
        });
        io.to(payload.boardId).emit(SOCKET_EVENTS.BOARD_NOTIFY, {
          boardId: payload.boardId,
          message: 'Columns were reordered.',
          type: 'info',
        });
        ack && ack({ success: true });
      } catch (err: any) {
        ack && ack({ success: false, error: err.message });
      }
    });

    // --- Member/Sharing Events ---
    socket.on(SOCKET_EVENTS.ADD_MEMBER, async (payload: AddMemberPayload, ack) => {
      try {
        if (!await hasBoardPermission(payload.boardId, user.id, 'invite')) throw new Error('No permission');
        const board = await Board.findOne({ id: payload.boardId });
        if (!board) throw new Error('Board not found');
        if (board.members.some((m: any) => m.userId.toString() === payload.userId)) throw new Error('Already a member');
        const newMember = { userId: payload.userId, role: payload.role, invitedBy: user.id, invitedAt: new Date(), permissions: { canView: true, canEdit: payload.role === 'editor', canDelete: false, canInvite: false, canManageMembers: false } };
        board.members.push(newMember);
        await board.save();
        // Fetch user info for the new member
        const userDoc = await User.findById(payload.userId);
        const memberWithUserInfo = {
          ...newMember,
          username: userDoc?.name || '',
          email: userDoc?.email || ''
        };
        io.to(payload.boardId).emit(SOCKET_EVENTS.MEMBER_ADDED, { boardId: payload.boardId, member: memberWithUserInfo, sourceClientId: socket.id });
        // --- Emit directly to the added user's socket(s) ---
        const sockets = userIdToSockets.get(String(payload.userId));
        if (sockets) {
          for (const sid of sockets) {
            io.to(sid).emit(SOCKET_EVENTS.MEMBER_ADDED, { boardId: payload.boardId, member: memberWithUserInfo });
          }
        }
        io.to(payload.boardId).emit(SOCKET_EVENTS.ACTIVITY_EVENT, {
          boardId: payload.boardId,
          userId: user.id,
          activity: `invited user ${payload.userId} to the board`,
          timestamp: new Date().toISOString(),
        });
        io.to(payload.boardId).emit(SOCKET_EVENTS.BOARD_NOTIFY, {
          boardId: payload.boardId,
          message: 'A new member was invited.',
          type: 'info',
        });
        ack && ack({ success: true });
      } catch (err: any) {
        ack && ack({ success: false, error: err.message });
      }
    });
    socket.on(SOCKET_EVENTS.REMOVE_MEMBER, async (payload: RemoveMemberPayload, ack) => {
      try {
        if (!await hasBoardPermission(payload.boardId, user.id, 'manage')) throw new Error('No permission');
        const board = await Board.findOne({ id: payload.boardId });
        if (!board) throw new Error('Board not found');
        board.members = board.members.filter((m: any) => m.userId.toString() !== payload.userId);
        await board.save();
        io.to(payload.boardId).emit(SOCKET_EVENTS.MEMBER_REMOVED, { boardId: payload.boardId, userId: payload.userId, sourceClientId: socket.id });
        // --- Emit directly to the removed user's socket(s) ---
        const sockets = userIdToSockets.get(String(payload.userId));
        if (sockets) {
          for (const sid of sockets) {
            io.to(sid).emit(SOCKET_EVENTS.MEMBER_REMOVED, { boardId: payload.boardId, userId: payload.userId });
          }
        }
        io.to(payload.boardId).emit(SOCKET_EVENTS.ACTIVITY_EVENT, {
          boardId: payload.boardId,
          userId: user.id,
          activity: `removed member ${payload.userId} from the board`,
          timestamp: new Date().toISOString(),
        });
        io.to(payload.boardId).emit(SOCKET_EVENTS.BOARD_NOTIFY, {
          boardId: payload.boardId,
          message: 'A member was removed.',
          type: 'info',
        });
        ack && ack({ success: true });
      } catch (err: any) {
        ack && ack({ success: false, error: err.message });
      }
    });
    socket.on(SOCKET_EVENTS.CHANGE_ROLE, async (payload: ChangeRolePayload, ack) => {
      try {
        if (!await hasBoardPermission(payload.boardId, user.id, 'manage')) throw new Error('No permission');
        const board = await Board.findOne({ id: payload.boardId });
        if (!board) throw new Error('Board not found');
        const member = board.members.find((m: any) => m.userId.toString() === payload.userId);
        if (!member) throw new Error('Member not found');
        member.role = payload.role;
        member.permissions.canEdit = payload.role === 'editor';
        await board.save();
        io.to(payload.boardId).emit(SOCKET_EVENTS.ROLE_CHANGED, { boardId: payload.boardId, userId: payload.userId, role: payload.role, sourceClientId: socket.id });
        // --- Emit directly to the affected user's socket(s) ---
        const sockets = userIdToSockets.get(String(payload.userId));
        if (sockets) {
          for (const sid of sockets) {
            io.to(sid).emit(SOCKET_EVENTS.ROLE_CHANGED, { boardId: payload.boardId, userId: payload.userId, role: payload.role });
          }
        }
        io.to(payload.boardId).emit(SOCKET_EVENTS.ACTIVITY_EVENT, {
          boardId: payload.boardId,
          userId: user.id,
          activity: `changed role of user ${payload.userId} to ${payload.role}`,
          timestamp: new Date().toISOString(),
        });
        io.to(payload.boardId).emit(SOCKET_EVENTS.BOARD_NOTIFY, {
          boardId: payload.boardId,
          message: 'A role was changed.',
          type: 'info',
        });
        ack && ack({ success: true });
      } catch (err: any) {
        ack && ack({ success: false, error: err.message });
      }
    });
    socket.on(SOCKET_EVENTS.UPDATE_PERMISSIONS, async (payload: UpdatePermissionsPayload, ack) => {
      try {
        if (!await hasBoardPermission(payload.boardId, user.id, 'manage')) throw new Error('No permission');
        const board = await Board.findOne({ id: payload.boardId });
        if (!board) throw new Error('Board not found');
        const member = board.members.find((m: any) => m.userId.toString() === payload.userId);
        if (!member) throw new Error('Member not found');
        member.permissions = payload.permissions;
        await board.save();
        io.to(payload.boardId).emit(SOCKET_EVENTS.PERMISSIONS_UPDATED, { boardId: payload.boardId, userId: payload.userId, permissions: payload.permissions });
        io.to(payload.boardId).emit(SOCKET_EVENTS.ACTIVITY_EVENT, {
          boardId: payload.boardId,
          userId: user.id,
          activity: `updated permissions for user ${payload.userId}`,
          timestamp: new Date().toISOString(),
        });
        io.to(payload.boardId).emit(SOCKET_EVENTS.BOARD_NOTIFY, {
          boardId: payload.boardId,
          message: 'Permissions were updated.',
          type: 'info',
        });
        ack && ack({ success: true });
      } catch (err: any) {
        ack && ack({ success: false, error: err.message });
      }
    });

    // --- Board Events ---
    socket.on(SOCKET_EVENTS.UPDATE_BOARD, async (payload: UpdateBoardPayload, ack) => {
      try {
        if (!await hasBoardPermission(payload.boardId, user.id, 'edit')) throw new Error('No permission');
        const board = await Board.findOne({ id: payload.boardId });
        if (!board) throw new Error('Board not found');
        Object.assign(board, payload.updates, { updatedAt: new Date() });
        await board.save();
        io.to(payload.boardId).emit(SOCKET_EVENTS.BOARD_UPDATED, { boardId: payload.boardId, updates: payload.updates, sourceClientId: socket.id });
        io.to(payload.boardId).emit(SOCKET_EVENTS.ACTIVITY_EVENT, {
          boardId: payload.boardId,
          userId: user.id,
          activity: `updated board settings`,
          timestamp: new Date().toISOString(),
        });
        io.to(payload.boardId).emit(SOCKET_EVENTS.BOARD_NOTIFY, {
          boardId: payload.boardId,
          message: 'Board settings were updated.',
          type: 'info',
        });
        ack && ack({ success: true });
      } catch (err: any) {
        ack && ack({ success: false, error: err.message });
      }
    });
    socket.on(SOCKET_EVENTS.DELETE_BOARD, async (payload: DeleteBoardPayload, ack) => {
      try {
        if (!await hasBoardPermission(payload.boardId, user.id, 'delete')) throw new Error('No permission');
        await Board.deleteOne({ id: payload.boardId });
        io.to(payload.boardId).emit(SOCKET_EVENTS.BOARD_DELETED, { boardId: payload.boardId, sourceClientId: socket.id });
        io.to(payload.boardId).emit(SOCKET_EVENTS.ACTIVITY_EVENT, {
          boardId: payload.boardId,
          userId: user.id,
          activity: `deleted board ${payload.boardId}`,
          timestamp: new Date().toISOString(),
        });
        io.to(payload.boardId).emit(SOCKET_EVENTS.BOARD_NOTIFY, {
          boardId: payload.boardId,
          message: 'A board was deleted.',
          type: 'info',
        });
        ack && ack({ success: true });
      } catch (err: any) {
        ack && ack({ success: false, error: err.message });
      }
    });
    socket.on(SOCKET_EVENTS.BOARD_NOTIFY, (payload: BoardNotifyPayload) => {
      io.to(payload.boardId).emit(SOCKET_EVENTS.BOARD_NOTIFY, payload);
    });

    // --- Atomic bulk/transactional events ---
    socket.on(SOCKET_EVENTS.BULK_MOVE_TASKS, async (payload, ack) => {
      try {
        if (!await hasBoardPermission(payload.boardId, user.id, 'edit')) throw new Error('No permission');
        const board = await Board.findOne({ id: payload.boardId });
        if (!board) throw new Error('Board not found');
        // Process all moves atomically
        for (const move of payload.moves) {
          // Remove from old column
          const fromCol = board.columns.find((c: any) => c.id === move.fromColumnId);
          const toCol = board.columns.find((c: any) => c.id === move.toColumnId);
          if (!fromCol || !toCol) throw new Error('Column not found');
          fromCol.taskIds = fromCol.taskIds.filter((id: string) => id !== move.taskId);
          toCol.taskIds.splice(move.newIndex, 0, move.taskId);
        }
        await board.save();
        io.to(payload.boardId).emit(SOCKET_EVENTS.TASKS_BULK_MOVED, {
          boardId: payload.boardId,
          moves: payload.moves,
          newColumns: board.columns,
          newTasks: board.tasks,
          sourceClientId: socket.id,
        });
        io.to(payload.boardId).emit(SOCKET_EVENTS.ACTIVITY_EVENT, {
          boardId: payload.boardId,
          userId: user.id,
          activity: `bulk moved tasks`,
          timestamp: new Date().toISOString(),
        });
        io.to(payload.boardId).emit(SOCKET_EVENTS.BOARD_NOTIFY, {
          boardId: payload.boardId,
          message: 'Tasks were bulk moved.',
          type: 'info',
        });
        ack && ack({ success: true });
      } catch (err: any) {
        ack && ack({ success: false, error: err.message });
      }
    });
    socket.on(SOCKET_EVENTS.BULK_UPDATE_TASKS, async (payload, ack) => {
      try {
        if (!await hasBoardPermission(payload.boardId, user.id, 'edit')) throw new Error('No permission');
        const board = await Board.findOne({ id: payload.boardId });
        if (!board) throw new Error('Board not found');
        // Process all updates atomically
        for (const update of payload.updates) {
          const task = board.tasks.get(update.taskId);
          if (!task) throw new Error('Task not found');
          Object.assign(task, update.updates, { updatedAt: new Date() });
          board.tasks.set(update.taskId, task);
        }
        await board.save();
        io.to(payload.boardId).emit(SOCKET_EVENTS.TASKS_BULK_UPDATED, {
          boardId: payload.boardId,
          updates: payload.updates,
          newTasks: board.tasks,
          sourceClientId: socket.id,
        });
        io.to(payload.boardId).emit(SOCKET_EVENTS.ACTIVITY_EVENT, {
          boardId: payload.boardId,
          userId: user.id,
          activity: `bulk updated tasks`,
          timestamp: new Date().toISOString(),
        });
        io.to(payload.boardId).emit(SOCKET_EVENTS.BOARD_NOTIFY, {
          boardId: payload.boardId,
          message: 'Tasks were bulk updated.',
          type: 'info',
        });
        ack && ack({ success: true });
      } catch (err: any) {
        ack && ack({ success: false, error: err.message });
      }
    });
    socket.on(SOCKET_EVENTS.BULK_UPDATE_COLUMNS, async (payload, ack) => {
      try {
        if (!await hasBoardPermission(payload.boardId, user.id, 'edit')) throw new Error('No permission');
        const board = await Board.findOne({ id: payload.boardId });
        if (!board) throw new Error('Board not found');
        for (const update of payload.updates) {
          const col = board.columns.find((c: any) => c.id === update.columnId);
          if (!col) throw new Error('Column not found');
          Object.assign(col, update.updates, { updatedAt: new Date() });
        }
        await board.save();
        io.to(payload.boardId).emit(SOCKET_EVENTS.COLUMNS_BULK_UPDATED, {
          boardId: payload.boardId,
          updates: payload.updates,
          newColumns: board.columns,
          sourceClientId: socket.id,
        });
        ack && ack({ success: true });
      } catch (err: any) {
        ack && ack({ success: false, error: err.message });
      }
    });
    socket.on(SOCKET_EVENTS.BULK_UPDATE_MEMBERS, async (payload, ack) => {
      try {
        if (!await hasBoardPermission(payload.boardId, user.id, 'manage')) throw new Error('No permission');
        const board = await Board.findOne({ id: payload.boardId });
        if (!board) throw new Error('Board not found');
        for (const update of payload.updates) {
          const member = board.members.find((m: any) => m.userId.toString() === update.userId);
          if (!member) throw new Error('Member not found');
          Object.assign(member, update.updates);
        }
        await board.save();
        io.to(payload.boardId).emit(SOCKET_EVENTS.MEMBERS_BULK_UPDATED, {
          boardId: payload.boardId,
          updates: payload.updates,
          newMembers: board.members,
          sourceClientId: socket.id,
        });
        ack && ack({ success: true });
      } catch (err: any) {
        ack && ack({ success: false, error: err.message });
      }
    });

    // --- Disconnect ---
    socket.on('disconnect', () => {
      // Remove socket from userId map
      if (user && userIdToSockets.has(user.id)) {
        userIdToSockets.get(user.id).delete(socket.id);
        if (userIdToSockets.get(user.id).size === 0) {
          userIdToSockets.delete(user.id);
        }
      }
      // Optionally: broadcast presence update
    });
  });
} 