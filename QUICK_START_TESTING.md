# Quick Start & Comprehensive Testing Guide

This guide helps you thoroughly test all major and advanced features of the task board application, including real-time collaboration, edge cases, and advanced socket behaviors.

## Prerequisites

1. **Backend Server**: Running on `http://localhost:5000`
2. **Frontend Server**: Running on `http://localhost:3000`
3. **Database**: MongoDB running locally or cloud instance
4. **Two or More Browser Windows/Tabs**: For testing real-time collaboration and presence

## Quick Test Checklist

### 1. **Authentication & User Management**

- [ ] User registration
- [ ] User login/logout
- [ ] Profile management (edit, avatar, etc.)
- [ ] Password validation and error messages
- [ ] Session persistence (refresh, new tab)
- [ ] Invalid/expired token handling

### 2. **Board Management**

- [ ] Create new board
- [ ] Edit board name/description
- [ ] Delete board
- [ ] View board list (owned & shared)
- [ ] Board access permissions (owner/editor/viewer)
- [ ] Board appears/disappears in real time for members
- [ ] Board deletion removes access for all members in real time

### 3. **Column Management**

- [ ] Add new column
- [ ] Edit column name
- [ ] Delete column
- [ ] Reorder columns (drag & drop)
- [ ] Real-time column updates for all users
- [ ] Optimistic UI for column actions (rollback on error)
- [ ] Atomic/bulk column operations

### 4. **Task Management**

- [ ] Create new task
- [ ] Edit task details (title, description, etc.)
- [ ] Delete task
- [ ] Move tasks between columns (drag & drop)
- [ ] Assign tasks to users
- [ ] Set task priority
- [ ] Set due dates
- [ ] Real-time task updates for all users
- [ ] Optimistic UI for task actions (rollback on error)
- [ ] Atomic/bulk task operations
- [ ] Task order and column consistency after refresh

### 5. **Real-time Collaboration & Socket Features**

- [ ] Multiple users on same board (test with 2+ browsers)
- [ ] Real-time task/column/board/member updates
- [ ] User presence indicators (active users, avatars)
- [ ] Typing/editing indicators (debounced/throttled)
- [ ] Connection status (connected, reconnecting, offline)
- [ ] Socket reconnection and state resync (simulate disconnect/reconnect)
- [ ] Infinite loop prevention (no duplicate or echo events)
- [ ] Event acknowledgements and error handling (UI feedback)
- [ ] Permission drift handling (role/permission changes in real time)
- [ ] Activity feed and notifications (real-time events, toasts)
- [ ] Atomic multi-step changes (bulk move, bulk update)
- [ ] Debouncing/throttling of frequent events (typing, editing)

### 6. **Sharing & Permissions**

- [ ] Add board members (real-time update for added user)
- [ ] Remove board members (real-time removal for removed user)
- [ ] Update member roles (real-time permission/UI update)
- [ ] Permission-based access control (UI and backend)
- [ ] View shared boards (owned, shared with me)
- [ ] Permission escalation attempts are blocked
- [ ] Access loss triggers redirect and UI update

### 7. **Search, Filtering & Sorting**

- [ ] Search tasks by title/description
- [ ] Filter by priority, assignee, due date
- [ ] Combine multiple filters
- [ ] Sort tasks (creation date, priority, due date, ascending/descending)
- [ ] Clear filters and search

### 8. **UI/UX & Accessibility**

- [ ] Dark/light theme toggle
- [ ] Responsive design (desktop, tablet, mobile)
- [ ] Loading states and skeletons
- [ ] Error handling and user feedback (toasts, modals)
- [ ] Keyboard navigation and accessibility (tab, screen reader)
- [ ] Toast notifications for all major actions/errors

### 9. **Edge Cases & Error Handling**

- [ ] Network disconnect/reconnect (simulate offline)
- [ ] Invalid data (empty tasks, invalid board/column IDs)
- [ ] Accessing non-existent or unauthorized boards
- [ ] Concurrent edits (conflict resolution, last-write-wins)
- [ ] Simultaneous column/task/member changes
- [ ] Socket event spam/infinite loop prevention
- [ ] UI remains consistent after errors/rollbacks

### 10. **Performance & Stress Testing**

- [ ] Create board with 100+ tasks/columns
- [ ] Test scrolling and UI performance
- [ ] Real-time updates under heavy load
- [ ] Multiple users making rapid changes
- [ ] Socket connection limits and stability
- [ ] Long session usage, multiple tabs
- [ ] No memory leaks or performance degradation

### 11. **Security Testing**

- [ ] Invalid login attempts and brute force
- [ ] Session management and logout
- [ ] Access to unauthorized boards (blocked)
- [ ] Role-based permission enforcement (backend & frontend)
- [ ] Permission escalation attempts (blocked)
- [ ] XSS, SQL/NoSQL injection, input sanitization
- [ ] JWT/token security and expiry

### 12. **Browser & Device Compatibility**

- [ ] Chrome (latest)
- [ ] Firefox (latest)
- [ ] Safari (latest)
- [ ] Edge (latest)
- [ ] Mobile browsers (responsive, touch, performance)

## Step-by-Step Testing

### 1. **Setup & Authentication**

1. **Start both servers**:
   ```bash
   # Terminal 1 - Backend
   cd backend
   npm start
   # Terminal 2 - Frontend
   npm run dev
   ```
2. **Register test users**:
   - Go to `http://localhost:3000/signup`
   - Create user accounts for testing collaboration
   - Note down usernames/passwords
3. **Login with different users**:
   - Open multiple browser windows/tabs
   - Login with different accounts
   - Verify profile information, session persistence, and error handling

### 2. **Board Creation & Management**

1. **Create a test board**:
   - Click "Create Board"
   - Enter board name and description
   - Verify board appears in list for owner
2. **Test board operations**:
   - Edit board name/description (real-time for all members)
   - Delete board (removes for all members in real time)
   - Test board list updates (owned/shared)
   - Test board access permissions (owner/editor/viewer)

### 3. **Column & Task Management**

1. **Add columns**:
   - Click "Add Column" button
   - Create columns: "To Do", "In Progress", "Done"
   - Verify columns appear for all users in real time
2. **Create tasks**:
   - Click "Add Task" in any column
   - Fill in task details (title, description, assignee, priority, due date)
   - Verify task appears in column for all users
3. **Test task operations**:
   - Edit task details (real-time sync)
   - Move tasks between columns (drag & drop, real-time)
   - Delete tasks (real-time removal)
   - Test optimistic UI and rollback (simulate error)
   - Test bulk/atomic operations (multi-select, bulk move)
   - Verify all changes persist after refresh

### 4. **Real-time Collaboration & Socket Features**

1. **Open board in multiple browsers/tabs**:
   - Login with different users
   - Navigate to same board
   - Verify both users see the board and all updates
2. **Test real-time updates**:
   - User A: Create/edit/move/delete a task/column
   - User B: Should see changes immediately
   - Test with 3+ users for race conditions
3. **Test user presence & indicators**:
   - Verify active users are shown (avatars, names)
   - Typing/editing indicators (debounced, auto-clear)
   - Connection status (connected, reconnecting, offline)
4. **Test socket reconnection & state resync**:
   - Simulate disconnect (disable network, close tab)
   - Reconnect and verify state is resynced (no data loss)
   - Test optimistic UI rollback on error
5. **Test permission drift & role changes**:
   - Change a member's role (viewer/editor)
   - Affected user sees UI/permissions update in real time
   - Remove member: user is removed in real time
   - Add member: user sees board in "Shared with me" instantly
6. **Test event acknowledgements & error handling**:
   - Simulate backend errors (invalid data, permission denied)
   - UI shows error, rolls back optimistic update
   - No infinite event loops or duplicate events
7. **Test activity feed & notifications**:
   - All major actions appear in activity feed
   - Toasts/notifications for all real-time events

### 5. **Sharing & Permissions**

1. **Add board members**:
   - Click "Share" button
   - Add another user as member (real-time for both)
   - Set role (viewer/editor)
2. **Test permissions**:
   - Login as different user
   - Verify access and UI based on role
   - Test permission restrictions (UI and backend)
3. **Manage members**:
   - Change member roles (real-time update for affected user)
   - Remove members (real-time removal)
   - Verify changes take effect instantly
   - Attempt permission escalation (should be blocked)

### 6. **Search, Filtering & Sorting**

1. **Test search**:
   - Enter search terms (title, description)
   - Verify tasks are filtered in real time
2. **Test filters**:
   - Filter by priority, assignee, due date
   - Combine multiple filters
3. **Test sorting**:
   - Sort by creation date, priority, due date
   - Test ascending/descending
   - Clear filters and search

### 7. **Edge Cases & Error Handling**

1. **Test network issues**:
   - Disconnect internet
   - Verify error messages and UI state
   - Reconnect and verify recovery (no data loss)
2. **Test invalid data**:
   - Try to create empty tasks, columns, boards
   - Try to access non-existent or unauthorized boards
   - Test with invalid permissions (UI and backend)
3. **Test concurrent edits**:
   - Multiple users editing same task/column
   - Verify conflict resolution (last-write-wins, UI feedback)
   - Simultaneous column/task/member changes
4. **Test socket event spam/infinite loop prevention**:
   - No duplicate or echo events in logs/UI
   - UI remains consistent after errors/rollbacks

### 8. **Performance & Stress Testing**

1. **Load Testing**:
   - Create board with 100+ tasks/columns
   - Test scrolling and UI performance
   - Verify real-time updates under load
2. **Stress Testing**:
   - Multiple users making rapid changes
   - Test socket connection limits and stability
3. **Memory Testing**:
   - Long session usage, multiple tabs
   - Verify no memory leaks or performance degradation

### 9. **Security Testing**

1. **Authentication**:
   - Test invalid login attempts, brute force
   - Verify session management and logout
2. **Authorization**:
   - Test access to unauthorized boards (blocked)
   - Verify role-based permission enforcement (backend & frontend)
   - Attempt permission escalation (should be blocked)
3. **Data Validation**:
   - Test XSS, SQL/NoSQL injection, input sanitization
   - JWT/token security and expiry

### 10. **Browser & Device Compatibility**

1. **Modern Browsers**:
   - Chrome (latest)
   - Firefox (latest)
   - Safari (latest)
   - Edge (latest)
2. **Mobile Testing**:
   - Responsive design
   - Touch interactions
   - Mobile performance

## Common Issues & Solutions

### 1. **Socket Connection Issues**

- **Issue**: Real-time updates not working
- **Solution**: Check backend server is running, verify CORS settings, check browser console for errors

### 2. **Database Connection Issues**

- **Issue**: Data not persisting
- **Solution**: Check MongoDB connection, verify environment variables, check backend logs

### 3. **Permission Issues**

- **Issue**: Users can't access boards or perform actions
- **Solution**: Check user roles, verify sharing settings, test with different roles

### 4. **Performance Issues**

- **Issue**: Slow loading or updates
- **Solution**: Check network connection, verify server resources, test with fewer tasks/boards

### 5. **UI/UX Issues**

- **Issue**: Inconsistent UI after real-time events or errors
- **Solution**: Refresh page, check for optimistic update rollbacks, report bugs

## Reporting Issues

When reporting issues, include:

1. **Steps to reproduce**
2. **Expected vs actual behavior**
3. **Browser and version**
4. **Console errors**
5. **Network tab information**

## Success Criteria

✅ **All features work as expected**
✅ **Real-time collaboration functions properly**
✅ **No critical errors in console**
✅ **Performance is acceptable**
✅ **Security measures are working**
✅ **Cross-browser/device compatibility verified**
✅ **Edge cases and error handling are robust**

---

**Note**: This testing guide now covers all core and advanced functionality, including real-time, edge cases, and socket-specific behaviors. For comprehensive testing, consider automated testing frameworks and continuous integration.
