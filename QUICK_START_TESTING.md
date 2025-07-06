# Quick Start Testing Guide

This guide helps you quickly test all major features of the task board application.

## Prerequisites

1. **Backend Server**: Running on `http://localhost:5000`
2. **Frontend Server**: Running on `http://localhost:3000`
3. **Database**: MongoDB running locally or cloud instance
4. **Two Browser Windows**: For testing real-time collaboration

## Quick Test Checklist

### 1. **Authentication & User Management**

- [ ] User registration
- [ ] User login/logout
- [ ] Profile management
- [ ] Password validation

### 2. **Board Management**

- [ ] Create new board
- [ ] Edit board name/description
- [ ] Delete board
- [ ] View board list
- [ ] Board access permissions

### 3. **Column Management**

- [ ] Add new column
- [ ] Edit column name
- [ ] Delete column
- [ ] Reorder columns (drag & drop)

### 4. **Task Management**

- [ ] Create new task
- [ ] Edit task details
- [ ] Delete task
- [ ] Move tasks between columns
- [ ] Assign tasks to users
- [ ] Set task priority
- [ ] Set due dates

### 5. **Real-time Collaboration**

- [ ] Multiple users on same board
- [ ] Real-time task updates
- [ ] Real-time column changes
- [ ] User presence indicators
- [ ] Connection status

### 6. **Sharing & Permissions**

- [ ] Add board members
- [ ] Remove board members
- [ ] Update member roles
- [ ] Permission-based access control
- [ ] View shared boards

### 7. **Search & Filtering**

- [ ] Search tasks by title
- [ ] Filter by priority
- [ ] Filter by assignee
- [ ] Filter by due date
- [ ] Sort tasks
- [ ] Clear filters

### 8. **UI/UX Features**

- [ ] Dark/light theme toggle
- [ ] Responsive design
- [ ] Loading states
- [ ] Error handling
- [ ] Toast notifications

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
   - Open multiple browser windows
   - Login with different accounts
   - Verify profile information

### 2. **Board Creation & Management**

1. **Create a test board**:

   - Click "Create Board"
   - Enter board name and description
   - Verify board appears in list

2. **Test board operations**:
   - Edit board name/description
   - Verify changes persist
   - Test board deletion

### 3. **Column & Task Management**

1. **Add columns**:

   - Click "Add Column" button
   - Create columns: "To Do", "In Progress", "Done"
   - Verify columns appear

2. **Create tasks**:

   - Click "Add Task" in any column
   - Fill in task details (title, description, assignee, priority, due date)
   - Verify task appears in column

3. **Test task operations**:
   - Edit task details
   - Move tasks between columns
   - Delete tasks
   - Verify all changes persist

### 4. **Real-time Collaboration**

1. **Open board in multiple browsers**:

   - Login with different users
   - Navigate to same board
   - Verify both users see the board

2. **Test real-time updates**:

   - User A: Create a new task
   - User B: Should see task appear immediately
   - User B: Move a task to different column
   - User A: Should see task move immediately
   - Test with multiple users simultaneously

3. **Test user presence**:
   - Verify active users are shown
   - Check connection status indicators
   - Test disconnection/reconnection

### 5. **Sharing & Permissions**

1. **Add board members**:

   - Click "Share" button
   - Add another user as member
   - Set appropriate role (viewer/editor/admin)

2. **Test permissions**:

   - Login as different user
   - Verify access based on role
   - Test permission restrictions

3. **Manage members**:
   - Change member roles
   - Remove members
   - Verify changes take effect

### 6. **Search & Filtering**

1. **Test search**:

   - Enter search terms
   - Verify tasks are filtered
   - Test search with different terms

2. **Test filters**:

   - Filter by priority (High/Medium/Low)
   - Filter by assignee
   - Filter by due date
   - Combine multiple filters

3. **Test sorting**:
   - Sort by creation date
   - Sort by priority
   - Sort by due date
   - Test ascending/descending

### 7. **Edge Cases & Error Handling**

1. **Test network issues**:

   - Disconnect internet
   - Verify error messages
   - Reconnect and verify recovery

2. **Test invalid data**:

   - Try to create empty tasks
   - Try to access non-existent boards
   - Test with invalid permissions

3. **Test concurrent edits**:
   - Multiple users editing same task
   - Verify conflict resolution
   - Test simultaneous column changes

## Performance Testing

### 1. **Load Testing**

- Create board with 100+ tasks
- Test scrolling and performance
- Verify real-time updates still work

### 2. **Stress Testing**

- Multiple users making rapid changes
- Test socket connection limits
- Verify system stability

### 3. **Memory Testing**

- Long session usage
- Multiple browser tabs
- Verify no memory leaks

## Security Testing

### 1. **Authentication**

- Test invalid login attempts
- Verify session management
- Test logout functionality

### 2. **Authorization**

- Test access to unauthorized boards
- Verify role-based permissions
- Test permission escalation attempts

### 3. **Data Validation**

- Test XSS prevention
- Test SQL injection prevention
- Verify input sanitization

## Browser Compatibility

### 1. **Modern Browsers**

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)

### 2. **Mobile Testing**

- Responsive design
- Touch interactions
- Mobile performance

## Common Issues & Solutions

### 1. **Socket Connection Issues**

- **Issue**: Real-time updates not working
- **Solution**: Check backend server is running, verify CORS settings

### 2. **Database Connection Issues**

- **Issue**: Data not persisting
- **Solution**: Check MongoDB connection, verify environment variables

### 3. **Permission Issues**

- **Issue**: Users can't access boards
- **Solution**: Check user roles, verify sharing settings

### 4. **Performance Issues**

- **Issue**: Slow loading or updates
- **Solution**: Check network connection, verify server resources

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
✅ **Cross-browser compatibility verified**

---

**Note**: This testing guide covers the core functionality. For comprehensive testing, consider automated testing frameworks and continuous integration.
