// Global Socket Event Registry (Contract)
// This file defines all socket event names, payload types, ack types, and documentation for emit/listen direction.
// To be imported by both frontend and backend for type safety and event consistency.

// --- Event Name Constants ---
export const SOCKET_EVENTS = {
  // Room/Presence
  JOIN_BOARD: 'join-board',
  LEAVE_BOARD: 'leave-board',
  USER_JOINED: 'user-joined',
  USER_LEFT: 'user-left',
  PRESENCE_UPDATE: 'presence-update',
  USER_TYPING: 'user-typing',
  USER_EDITING: 'user-editing',
  ACTIVITY_EVENT: 'activity-event',

  // Task Events
  CREATE_TASK: 'create-task',
  TASK_CREATED: 'task-created',
  UPDATE_TASK: 'update-task',
  TASK_UPDATED: 'task-updated',
  DELETE_TASK: 'delete-task',
  TASK_DELETED: 'task-deleted',
  MOVE_TASK: 'move-task',
  TASK_MOVED: 'task-moved',
  REORDER_TASKS: 'reorder-tasks',
  TASKS_REORDERED: 'tasks-reordered',
  BULK_MOVE_TASKS: 'bulk-move-tasks',
  TASKS_BULK_MOVED: 'tasks-bulk-moved',
  BULK_UPDATE_TASKS: 'bulk-update-tasks',
  TASKS_BULK_UPDATED: 'tasks-bulk-updated',

  // Column Events
  CREATE_COLUMN: 'create-column',
  COLUMN_CREATED: 'column-created',
  UPDATE_COLUMN: 'update-column',
  COLUMN_UPDATED: 'column-updated',
  DELETE_COLUMN: 'delete-column',
  COLUMN_DELETED: 'column-deleted',
  REORDER_COLUMNS: 'reorder-columns',
  COLUMNS_REORDERED: 'columns-reordered',
  BULK_UPDATE_COLUMNS: 'bulk-update-columns',
  COLUMNS_BULK_UPDATED: 'columns-bulk-updated',

  // Board Member/Sharing Events
  ADD_MEMBER: 'add-member',
  MEMBER_ADDED: 'member-added',
  REMOVE_MEMBER: 'remove-member',
  MEMBER_REMOVED: 'member-removed',
  CHANGE_ROLE: 'change-role',
  ROLE_CHANGED: 'role-changed',
  UPDATE_PERMISSIONS: 'update-permissions',
  PERMISSIONS_UPDATED: 'permissions-updated',
  BULK_UPDATE_MEMBERS: 'bulk-update-members',
  MEMBERS_BULK_UPDATED: 'members-bulk-updated',

  // Board Events
  UPDATE_BOARD: 'update-board',
  BOARD_UPDATED: 'board-updated',
  DELETE_BOARD: 'delete-board',
  BOARD_DELETED: 'board-deleted',
  BOARD_NOTIFY: 'board-notify',

  // Connection
  CONNECT: 'connect',
  DISCONNECT: 'disconnect',
} as const;

export type SocketEventName = typeof SOCKET_EVENTS[keyof typeof SOCKET_EVENTS];

// --- Payload & Ack Types ---
// Room/Presence
export interface JoinBoardPayload { boardId: string; userId: string; }
export interface LeaveBoardPayload { boardId: string; userId: string; }
export interface UserJoinedPayload { boardId: string; userId: string; username: string; }
export interface UserLeftPayload { boardId: string; userId: string; username: string; }
export interface PresenceUpdatePayload { boardId: string; users: Array<{ userId: string; username: string; }> }
export interface UserTypingPayload { boardId: string; taskId?: string; userId: string; }
export interface UserEditingPayload { boardId: string; taskId?: string; userId: string; }
export interface ActivityEventPayload { boardId: string; userId: string; activity: string; timestamp: string; }
export interface BoardNotifyPayload { boardId: string; message: string; type: 'info' | 'warning' | 'error'; }

// Task Events
export interface CreateTaskPayload { boardId: string; columnId: string; task: any; }
export interface TaskCreatedPayload { boardId: string; columnId: string; task: any; sourceClientId?: string; }
export interface UpdateTaskPayload { boardId: string; taskId: string; updates: any; }
export interface TaskUpdatedPayload { boardId: string; taskId: string; updates: any; sourceClientId?: string; }
export interface DeleteTaskPayload { boardId: string; taskId: string; }
export interface TaskDeletedPayload { boardId: string; taskId: string; sourceClientId?: string; }
export interface MoveTaskPayload { boardId: string; taskId: string; fromColumnId: string; toColumnId: string; newIndex: number; }
export interface TaskMovedPayload { boardId: string; taskId: string; fromColumnId: string; toColumnId: string; newIndex: number; sourceClientId?: string; }
export interface ReorderTasksPayload { boardId: string; columnId: string; taskIds: string[]; }
export interface TasksReorderedPayload { boardId: string; columnId: string; taskIds: string[]; sourceClientId?: string; }

// Atomic bulk/transactional events
export interface BulkMoveTasksPayload { boardId: string; moves: Array<{ taskId: string; fromColumnId: string; toColumnId: string; newIndex: number; }>; }
export interface TasksBulkMovedPayload { boardId: string; moves: Array<{ taskId: string; fromColumnId: string; toColumnId: string; newIndex: number; }>; newColumns: any[]; newTasks: any; sourceClientId?: string; }
export interface BulkUpdateTasksPayload { boardId: string; updates: Array<{ taskId: string; updates: any; }>; }
export interface TasksBulkUpdatedPayload { boardId: string; updates: Array<{ taskId: string; updates: any; }>; newTasks: any; sourceClientId?: string; }

// Column Events
export interface CreateColumnPayload { boardId: string; name: string; }
export interface ColumnCreatedPayload { boardId: string; column: any; sourceClientId?: string; }
export interface UpdateColumnPayload { boardId: string; columnId: string; updates: any; }
export interface ColumnUpdatedPayload { boardId: string; columnId: string; updates: any; sourceClientId?: string; }
export interface DeleteColumnPayload { boardId: string; columnId: string; }
export interface ColumnDeletedPayload { boardId: string; columnId: string; sourceClientId?: string; }
export interface ReorderColumnsPayload { boardId: string; columnIds: string[]; }
export interface ColumnsReorderedPayload { boardId: string; columnIds: string[]; sourceClientId?: string; }
export interface BulkUpdateColumnsPayload { boardId: string; updates: Array<{ columnId: string; updates: any; }>; }
export interface ColumnsBulkUpdatedPayload { boardId: string; updates: Array<{ columnId: string; updates: any; }>; newColumns: any[]; sourceClientId?: string; }

// Board Member/Sharing Events
export interface AddMemberPayload { boardId: string; userId: string; role: 'editor' | 'viewer'; }
export interface MemberAddedPayload { boardId: string; member: any; sourceClientId?: string; }
export interface RemoveMemberPayload { boardId: string; userId: string; }
export interface MemberRemovedPayload { boardId: string; userId: string; sourceClientId?: string; }
export interface ChangeRolePayload { boardId: string; userId: string; role: 'editor' | 'viewer'; }
export interface RoleChangedPayload { boardId: string; userId: string; role: 'editor' | 'viewer'; sourceClientId?: string; }
export interface UpdatePermissionsPayload { boardId: string; userId: string; permissions: any; }
export interface PermissionsUpdatedPayload { boardId: string; userId: string; permissions: any; }
export interface BulkUpdateMembersPayload { boardId: string; updates: Array<{ userId: string; updates: any; }>; }
export interface MembersBulkUpdatedPayload { boardId: string; updates: Array<{ userId: string; updates: any; }>; newMembers: any[]; sourceClientId?: string; }

// Board Events
export interface UpdateBoardPayload { boardId: string; updates: any; }
export interface BoardUpdatedPayload { boardId: string; updates: any; sourceClientId?: string; }
export interface DeleteBoardPayload { boardId: string; }
export interface BoardDeletedPayload { boardId: string; sourceClientId?: string; }
export interface BoardNotifyPayload { boardId: string; message: string; type: 'info' | 'warning' | 'error'; }

// --- Ack Types ---
export interface AckSuccess { success: true; [key: string]: any; }
export interface AckError { success: false; error: string; }

// --- Event Documentation Table ---
// | Event Name         | Payload Type                | Ack Type         | Who Emits | Who Listens |
// |--------------------|----------------------------|------------------|-----------|-------------|
// | join-board         | JoinBoardPayload            | AckSuccess/Error | Client    | Server      |
// | leave-board        | LeaveBoardPayload           | AckSuccess/Error | Client    | Server      |
// | user-joined        | UserJoinedPayload           | -                | Server    | Client(room)|
// | user-left          | UserLeftPayload             | -                | Server    | Client(room)|
// | presence-update    | PresenceUpdatePayload       | -                | Server    | Client(room)|
// | user-typing        | UserTypingPayload           | -                | Client    | Server, Client(room) |
// | user-editing       | UserEditingPayload          | -                | Client    | Server, Client(room) |
// | activity-event     | ActivityEventPayload        | -                | Client    | Server, Client(room) |
// | create-task        | CreateTaskPayload           | AckSuccess/Error | Client    | Server      |
// | task-created       | TaskCreatedPayload          | -                | Server    | Client(room)|
// | update-task        | UpdateTaskPayload           | AckSuccess/Error | Client    | Server      |
// | task-updated       | TaskUpdatedPayload          | -                | Server    | Client(room)|
// | delete-task        | DeleteTaskPayload           | AckSuccess/Error | Client    | Server      |
// | task-deleted       | TaskDeletedPayload          | -                | Server    | Client(room)|
// | move-task          | MoveTaskPayload             | AckSuccess/Error | Client    | Server      |
// | task-moved         | TaskMovedPayload            | -                | Server    | Client(room)|
// | reorder-tasks      | ReorderTasksPayload         | AckSuccess/Error | Client    | Server      |
// | tasks-reordered    | TasksReorderedPayload       | -                | Server    | Client(room)|
// | create-column      | CreateColumnPayload         | AckSuccess/Error | Client    | Server      |
// | column-created     | ColumnCreatedPayload        | -                | Server    | Client(room)|
// | update-column      | UpdateColumnPayload         | AckSuccess/Error | Client    | Server      |
// | column-updated     | ColumnUpdatedPayload        | -                | Server    | Client(room)|
// | delete-column      | DeleteColumnPayload         | AckSuccess/Error | Client    | Server      |
// | column-deleted     | ColumnDeletedPayload        | -                | Server    | Client(room)|
// | reorder-columns    | ReorderColumnsPayload       | AckSuccess/Error | Client    | Server      |
// | columns-reordered  | ColumnsReorderedPayload     | -                | Server    | Client(room)|
// | add-member         | AddMemberPayload            | AckSuccess/Error | Client    | Server      |
// | member-added       | MemberAddedPayload          | -                | Server    | Client(room)|
// | remove-member      | RemoveMemberPayload         | AckSuccess/Error | Client    | Server      |
// | member-removed     | MemberRemovedPayload        | -                | Server    | Client(room)|
// | change-role        | ChangeRolePayload           | AckSuccess/Error | Client    | Server      |
// | role-changed       | RoleChangedPayload          | -                | Server    | Client(room)|
// | update-permissions | UpdatePermissionsPayload    | AckSuccess/Error | Client    | Server      |
// | permissions-updated| PermissionsUpdatedPayload   | -                | Server    | Client(room)|
// | update-board       | UpdateBoardPayload          | AckSuccess/Error | Client    | Server      |
// | board-updated      | BoardUpdatedPayload         | -                | Server    | Client(room)|
// | delete-board       | DeleteBoardPayload          | AckSuccess/Error | Client    | Server      |
// | board-deleted      | BoardDeletedPayload         | -                | Server    | Client(room)|
// | board-notify       | BoardNotifyPayload          | -                | Server    | Client(room)|
// | connect            | -                          | -                | SocketIO  | Both        |
// | disconnect         | -                          | -                | SocketIO  | Both        |

// --- Usage ---
// 1. Import SOCKET_EVENTS and payload types in both frontend and backend.
// 2. Use SOCKET_EVENTS.JOIN_BOARD, etc., for all emit/on calls.
// 3. Use payload/ack types for type safety in handlers.
// 4. Keep this file as the single source of truth for all socket events.
