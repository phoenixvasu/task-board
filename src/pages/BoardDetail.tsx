import React, { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useBoardStore } from '../store/useBoardStore';
import { useSocket } from '../api/socket';
import { useCollaborationStore } from '../store/useCollaborationStore';
import { useSharingStore } from '../store/useSharingStore';
import BoardColumns from '../components/board/BoardColumns';
import ActiveUsers from '../components/collaboration/ActiveUsers';
import ConnectionStatus from '../components/collaboration/ConnectionStatus';
import ShareBoard from '../components/sharing/ShareBoard';
import Button from '../components/ui/Button';
import { ChevronLeft, SortAsc, SortDesc, Calendar, Share2, Lock } from 'lucide-react';
import Dropdown from '../components/ui/Dropdown';
import { useSearchStore } from '../store/useSearchStore';
import { Priority } from '../types';

const BoardDetail: React.FC = () => {
  const { boardId } = useParams();
  const { getBoard, fetchBoard, users } = useBoardStore();
  const board = getBoard(boardId!);
  const navigate = useNavigate();
  const [priority, setPriority] = useState('');
  const [assignee, setAssignee] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [sort, setSort] = useState<'priority'|'dueDate'|'createdAt'|'title'>('createdAt');
  const [sortDir, setSortDir] = useState<'asc'|'desc'>('asc');
  const { searchTerm, setPage } = useSearchStore();
  const [showShareModal, setShowShareModal] = useState(false);
  const [isLoadingBoard, setIsLoadingBoard] = useState(false);
  
  // Socket.io integration
  const { socketService, connect } = useSocket();
  const {
    handleUserJoined,
    handleUserLeft,
    handleActiveUsers,
    handleUserEditing,
    handleTaskUpdated,
    handleTaskMoved,
    handleColumnUpdated,
    handleColumnsReordered,
    handleTaskAdded,
    handleTaskDeleted,
    handleColumnAdded,
    handleColumnDeleted,
    handleMemberRoleUpdated,
    clearEditingUsers
  } = useCollaborationStore();

  // Track socket connection status
  const [socketConnected, setSocketConnected] = useState(false);
  const socketConnectedRef = useRef(false);
  const boardLoadedRef = useRef(false);

  // Sharing integration
  const { boardAccess, checkBoardAccess } = useSharingStore();

  useEffect(() => {
    setPage('tasks');
  }, [setPage]);

  // Check board access and fetch board if needed
  useEffect(() => {
    if (boardId && !boardLoadedRef.current) {
      const loadBoard = async () => {
        setIsLoadingBoard(true);
        try {
          // First check board access
          await checkBoardAccess(boardId);
          
          // If board is not in local store, fetch it
          if (!board) {
            await fetchBoard(boardId);
          }
          boardLoadedRef.current = true;
        } catch (error) {
          console.error('Failed to load board:', error);
        } finally {
          setIsLoadingBoard(false);
        }
      };
      
      loadBoard();
    }
  }, [boardId, checkBoardAccess, fetchBoard]);

  // Refresh board data when socket reconnects to ensure consistency
  useEffect(() => {
    if (socketConnected && boardId && board && !boardLoadedRef.current) {
      // When socket connects, refresh board data to ensure we have the latest state
      const refreshBoardData = async () => {
        await fetchBoard(boardId);
      };
      
      // Add a small delay to let the socket connection stabilize
      const timeoutId = setTimeout(refreshBoardData, 500);
      return () => clearTimeout(timeoutId);
    }
  }, [socketConnected, boardId, fetchBoard]);

  // Socket.io connection and event handling
  useEffect(() => {
    if (!boardId) return;

    // Prevent multiple connections for the same board
    if (socketConnectedRef.current && socketService.getCurrentBoardId() === boardId) {
      return;
    }

    let isConnecting = false;

    const setupSocket = async () => {
      if (isConnecting || socketConnectedRef.current) return;
      isConnecting = true;

      try {
        await connect();
        
        // Join the board room
        socketService.joinBoard(boardId);
        
        // Set up event listeners with adapters
        socketService.on('user-joined', (data) => {
          handleUserJoined({ ...data, timestamp: '' });
        });
        socketService.on('user-left', (data) => {
          handleUserLeft({ ...data, username: '', timestamp: '' });
        });
        socketService.on('active-users', (data) => {
          // Convert to ActiveUser[] format
          const activeUsers = (data.users || []).map(user => ({
            userId: user.id,
            username: user.name,
            boardId: boardId,
            socketId: '',
            lastActivity: new Date()
          }));
          handleActiveUsers(activeUsers);
        });
        socketService.on('user-editing', (data) => {
          handleUserEditing({ ...data, timestamp: '' });
        });
        socketService.on('task-updated', (data) => {
          handleTaskUpdated({ ...data, updatedBy: '', timestamp: '' });
        });
        socketService.on('task-moved', (data) => {
          handleTaskMoved({ ...data, movedBy: '', timestamp: '' });
        });
        socketService.on('column-updated', (data) => {
          handleColumnUpdated({ ...data, updatedBy: '', timestamp: '' });
        });
        socketService.on('columns-reordered', (data) => {
          handleColumnsReordered({ ...data, reorderedBy: '', timestamp: '' });
        });
        socketService.on('task-added', (data) => {
          handleTaskAdded({ 
            columnId: data.columnId, 
            taskId: data.task?.id || '', 
            task: data.task, 
            addedBy: '', 
            timestamp: '' 
          });
        });
        socketService.on('task-deleted', (data) => {
          handleTaskDeleted({ ...data, deletedBy: '', timestamp: '' });
        });
        socketService.on('column-added', (data) => {
          handleColumnAdded({ ...data, addedBy: '', timestamp: '' });
        });
        socketService.on('column-deleted', (data) => {
          handleColumnDeleted({ ...data, deletedBy: '', timestamp: '' });
        });
        socketService.on('member-role-updated', (data) => {
          handleMemberRoleUpdated({ ...data, newRole: '', updatedBy: '', timestamp: '' });
        });
        
        setSocketConnected(true);
        socketConnectedRef.current = true;
      } catch (error) {
        console.error('Failed to connect to socket:', error);
        setSocketConnected(false);
        socketConnectedRef.current = false;
      } finally {
        isConnecting = false;
      }
    };

    // Add a small delay to prevent connection attempts during rapid navigation
    const timeoutId = setTimeout(setupSocket, 100);

    // Activity heartbeat
    const activityInterval = setInterval(() => {
      if (socketService.isConnected()) {
        socketService.sendActivity();
      }
    }, 30000);

    // Cleanup function
    return () => {
      clearTimeout(timeoutId);
      clearInterval(activityInterval);
      
      // Remove event listeners
      socketService.off('user-joined');
      socketService.off('user-left');
      socketService.off('active-users');
      socketService.off('user-editing');
      socketService.off('task-updated');
      socketService.off('task-moved');
      socketService.off('column-updated');
      socketService.off('columns-reordered');
      socketService.off('task-added');
      socketService.off('task-deleted');
      socketService.off('column-added');
      socketService.off('column-deleted');
      socketService.off('member-role-updated');
      
      // Clear editing users when leaving
      clearEditingUsers();
      
      socketConnectedRef.current = false;
    };
  }, [boardId, connect, handleUserJoined, handleUserLeft, handleActiveUsers, handleUserEditing, handleTaskUpdated, handleTaskMoved, handleColumnUpdated, handleColumnsReordered, handleTaskAdded, handleTaskDeleted, handleColumnAdded, handleColumnDeleted, handleMemberRoleUpdated, clearEditingUsers]);

  // Check if user has access to the board
  if (boardAccess && !boardAccess.hasAccess) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
        <Lock size={48} className="text-gray-300 mb-4" />
        <h2 className="text-xl font-semibold mb-2">Access Denied</h2>
        <p className="text-gray-600 dark:text-gray-400 mb-4">
          You don't have permission to view this board.
        </p>
        <Button variant="primary" onClick={() => navigate('/')}>Back to Boards</Button>
      </div>
    );
  }

  if (!board && isLoadingBoard) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
        <Calendar size={48} className="text-gray-300 mb-4" />
        <h2 className="text-xl font-semibold mb-2">Loading board...</h2>
        <Button variant="primary" onClick={() => navigate('/')}>Back to Boards</Button>
      </div>
    );
  }

  if (!board) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
        <Calendar size={48} className="text-gray-300 mb-4" />
        <h2 className="text-xl font-semibold mb-2">Board not found</h2>
        <p className="text-gray-600 dark:text-gray-400 mb-4">
          The board you're looking for doesn't exist or you don't have access to it.
        </p>
        <Button variant="primary" onClick={() => navigate('/')}>Back to Boards</Button>
      </div>
    );
  }

  return (
    <div className="max-w-full px-4 py-6 mx-auto dark:bg-darkbg min-h-screen">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" icon={<ChevronLeft size={18} />} onClick={() => navigate('/')}>Boards</Button>
          <h1 className="text-2xl font-bold dark:text-white">{board.name}</h1>
          {/* Board access indicator */}
          {boardAccess && (
            <span className={`px-2 py-1 text-xs font-medium rounded ${
              boardAccess.role === 'owner' ? 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200' :
              boardAccess.role === 'editor' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200' :
              'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200'
            }`}>
              {boardAccess.role}
            </span>
          )}
        </div>
        <div className="flex flex-wrap gap-2 items-center">
          <ConnectionStatus isConnected={socketConnected} />
          <ActiveUsers />
          
          {/* Share button - only show if user has manage members permission */}
          {boardAccess?.permissions.canManageMembers && (
            <Button
              variant="outline"
              size="sm"
              icon={<Share2 size={16} />}
              onClick={() => setShowShareModal(true)}
            >
              Share
            </Button>
          )}
          
          {/* Filter controls - only show if user can view */}
          {boardAccess?.permissions.canView && (
            <>
              <Dropdown
                options={[
                  {value:'',label:'All Priorities'},
                  {value:'high',label:'High'},
                  {value:'medium',label:'Medium'},
                  {value:'low',label:'Low'}
                ]}
                value={priority}
                onChange={setPriority}
                placeholder="Priority"
              />
              <Dropdown
                options={[
                  {value:'',label:'All Assignees'},
                  ...users.map(u=>({value:u.id,label:u.name}))
                ]}
                value={assignee}
                onChange={setAssignee}
                placeholder="Assignee"
              />
              <Dropdown
                options={[
                  {value:'',label:'All Due Dates'},
                  {value:'overdue',label:'Overdue'},
                  {value:'today',label:'Due Today'},
                  {value:'this-week',label:'This Week'},
                  {value:'this-month',label:'This Month'}
                ]}
                value={dueDate}
                onChange={setDueDate}
                placeholder="Due Date"
              />
              <Dropdown
                options={[
                  {value:'createdAt',label:'Created'},
                  {value:'priority',label:'Priority'},
                  {value:'dueDate',label:'Due Date'},
                  {value:'title',label:'Title'}
                ]}
                value={sort}
                onChange={val=>setSort(val as any)}
                placeholder="Sort by"
              />
              <Button variant="ghost" size="sm" icon={sortDir==='asc'?<SortAsc size={16}/>:<SortDesc size={16}/>} onClick={()=>setSortDir(d=>d==='asc'?'desc':'asc')}>
                {sortDir==='asc'?'Asc':'Desc'}
              </Button>
            </>
          )}
        </div>
      </div>
      
      {/* Permission-based info message */}
      {boardAccess && (
        <div className={`mb-4 p-3 rounded-lg border ${
          boardAccess.role === 'owner' ? 'bg-purple-50 border-purple-200 dark:bg-purple-900/20 dark:border-purple-700' :
          boardAccess.role === 'editor' ? 'bg-blue-50 border-blue-200 dark:bg-blue-900/20 dark:border-blue-700' :
          'bg-gray-50 border-gray-200 dark:bg-gray-800 dark:border-gray-700'
        }`}>
          <div className={`text-sm ${
            boardAccess.role === 'owner' ? 'text-purple-700 dark:text-purple-300' :
            boardAccess.role === 'editor' ? 'text-blue-700 dark:text-blue-300' :
            'text-gray-700 dark:text-gray-300'
          }`}>
            <span className="font-medium">You are a {boardAccess.role}:</span>
            {boardAccess.role === 'owner' && ' You have full control over this board including managing members and deleting the board.'}
            {boardAccess.role === 'editor' && ' You can view, edit, and organize tasks and columns, but cannot manage members or delete the board.'}
            {boardAccess.role === 'viewer' && ' You can view the board and use filters, but cannot make any changes.'}
          </div>
        </div>
      )}
      
      {/* Board description */}
      {board.description && (
        <div className="mb-6 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
          <p className="text-gray-700 dark:text-gray-300">{board.description}</p>
        </div>
      )}
      
      {/* Filter status */}
      {(priority || assignee || dueDate || searchTerm) && (
        <div className="mb-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-700">
          <div className="flex items-center gap-2 text-sm text-blue-700 dark:text-blue-300">
            <span className="font-medium">Active filters:</span>
            {priority && <span className="px-2 py-1 bg-blue-100 dark:bg-blue-800 rounded text-xs">Priority: {priority}</span>}
            {assignee && <span className="px-2 py-1 bg-blue-100 dark:bg-blue-800 rounded text-xs">Assignee: {users.find(u => u.id === assignee)?.name || assignee}</span>}
            {dueDate && <span className="px-2 py-1 bg-blue-100 dark:bg-blue-800 rounded text-xs">Due: {dueDate}</span>}
            {searchTerm && <span className="px-2 py-1 bg-blue-100 dark:bg-blue-800 rounded text-xs">Search: "{searchTerm}"</span>}
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => {
                setPriority('');
                setAssignee('');
                setDueDate('');
              }}
              className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-200"
            >
              Clear all
            </Button>
          </div>
        </div>
      )}
      
      {/* Sort status */}
      {sort !== 'createdAt' && (
        <div className="mb-4 p-3 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-700">
          <div className="flex items-center gap-2 text-sm text-green-700 dark:text-green-300">
            <span className="font-medium">Active sorting:</span>
            <span className="px-2 py-1 bg-green-100 dark:bg-green-800 rounded text-xs">
              {sort === 'priority' ? 'Priority' : 
               sort === 'dueDate' ? 'Due Date' : 
               sort === 'title' ? 'Title' : 'Created'} 
              ({sortDir === 'asc' ? 'Ascending' : 'Descending'})
            </span>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => {
                setSort('createdAt');
                setSortDir('asc');
              }}
              className="text-green-600 hover:text-green-800 dark:text-green-400 dark:hover:text-green-200"
            >
              Reset sort
            </Button>
          </div>
        </div>
      )}
      
      {/* Columns and Tasks */}
      <BoardColumns 
        boardId={boardId!} 
        filters={{
          priority: (priority as Priority) || undefined,
          assignedTo: assignee || undefined,
          dueDate: (dueDate as 'overdue' | 'today' | 'this-week' | 'this-month') || undefined,
        }}
        sortOptions={{
          field: sort,
          direction: sortDir
        }}
      />
      
      {/* Share Board Modal */}
      <ShareBoard
        boardId={boardId!}
        isOpen={showShareModal}
        onClose={() => setShowShareModal(false)}
      />
    </div>
  );
};

export default BoardDetail; 