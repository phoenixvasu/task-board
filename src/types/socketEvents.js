"use strict";
// Global Socket Event Registry (Contract)
// This file defines all socket event names, payload types, ack types, and documentation for emit/listen direction.
// To be imported by both frontend and backend for type safety and event consistency.
Object.defineProperty(exports, "__esModule", { value: true });
exports.SOCKET_EVENTS = void 0;
// --- Event Name Constants ---
exports.SOCKET_EVENTS = {
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
};
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
