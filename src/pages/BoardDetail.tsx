import React, { useEffect, useState } from 'react';
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
import { ChevronLeft, SortAsc, SortDesc, Calendar, Share2, Lock, Users } from 'lucide-react';
import Dropdown from '../components/ui/Dropdown';
import { useSearchStore } from '../store/useSearchStore';
import toast from 'react-hot-toast';

const BoardDetail: React.FC = () => {
  const { boardId } = useParams();
  const { getBoard, users } = useBoardStore();
  const board = getBoard(boardId!);
  const navigate = useNavigate();
  const [priority, setPriority] = useState('');
  const [assignee, setAssignee] = useState('');
  const [sort, setSort] = useState<'priority'|'dueDate'|'createdAt'|'title'>('createdAt');
  const [sortDir, setSortDir] = useState<'asc'|'desc'>('asc');
  const { searchTerm, setPage } = useSearchStore();
  const [showShareModal, setShowShareModal] = useState(false);
  
  // Socket.io integration
  const { socketService, connect, disconnect, isConnected } = useSocket();
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
    clearEditingUsers
  } = useCollaborationStore();

  // Sharing integration
  const { boardAccess, checkBoardAccess } = useSharingStore();

  useEffect(() => {
    setPage('tasks');
  }, [setPage]);

  // Check board access on component mount
  useEffect(() => {
    if (boardId) {
      checkBoardAccess(boardId);
    }
  }, [boardId, checkBoardAccess]);

  // Socket.io connection and event handling
  useEffect(() => {
    if (!boardId) return;

    const setupSocket = async () => {
      try {
        await connect();
        
        // Join the board room
        socketService.joinBoard(boardId);
        
        // Set up event listeners
        socketService.on('user-joined', handleUserJoined);
        socketService.on('user-left', handleUserLeft);
        socketService.on('active-users', handleActiveUsers);
        socketService.on('user-editing', handleUserEditing);
        
        // Real-time update handlers
        socketService.on('task-updated', handleTaskUpdated);
        socketService.on('task-moved', handleTaskMoved);
        socketService.on('column-updated', handleColumnUpdated);
        socketService.on('columns-reordered', handleColumnsReordered);
        socketService.on('task-added', handleTaskAdded);
        socketService.on('task-deleted', handleTaskDeleted);
        socketService.on('column-added', handleColumnAdded);
        socketService.on('column-deleted', handleColumnDeleted);
        
        toast.success('Connected to real-time collaboration');
      } catch (error) {
        console.error('Failed to connect to socket:', error);
        toast.error('Failed to connect to real-time features');
      }
    };

    setupSocket();

    // Activity heartbeat
    const activityInterval = setInterval(() => {
      if (isConnected()) {
        socketService.sendActivity();
      }
    }, 30000); // Send activity every 30 seconds

    return () => {
      clearInterval(activityInterval);
      socketService.leaveBoard();
      clearEditingUsers();
      disconnect();
    };
  }, [boardId, connect, disconnect, socketService, isConnected, handleUserJoined, handleUserLeft, handleActiveUsers, handleUserEditing, handleTaskUpdated, handleTaskMoved, handleColumnUpdated, handleColumnsReordered, handleTaskAdded, handleTaskDeleted, handleColumnAdded, handleColumnDeleted, clearEditingUsers]);

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

  if (!board) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
        <Calendar size={48} className="text-gray-300 mb-4" />
        <h2 className="text-xl font-semibold mb-2">Loading board...</h2>
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
              boardAccess.role === 'admin' ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200' :
              boardAccess.role === 'editor' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200' :
              'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200'
            }`}>
              {boardAccess.role}
            </span>
          )}
        </div>
        <div className="flex flex-wrap gap-2 items-center">
          <ConnectionStatus />
          <ActiveUsers />
          
          {/* Share button - only show if user has invite permission */}
          {boardAccess?.permissions.canInvite && (
            <Button
              variant="outline"
              size="sm"
              icon={<Share2 size={16} />}
              onClick={() => setShowShareModal(true)}
            >
              Share
            </Button>
          )}
          
          <Dropdown
            options={[{value:'',label:'All Priorities'},{value:'high',label:'High'},{value:'medium',label:'Medium'},{value:'low',label:'Low'}]}
            value={priority}
            onChange={setPriority}
            placeholder="Priority"
          />
          <Dropdown
            options={[{value:'',label:'All Assignees'},...users.map(u=>({value:u.id,label:u.name}))]}
            value={assignee}
            onChange={setAssignee}
            placeholder="Assignee"
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
        </div>
      </div>
      
      {/* Board description */}
      {board.description && (
        <div className="mb-6 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
          <p className="text-gray-700 dark:text-gray-300">{board.description}</p>
        </div>
      )}
      
      {/* Columns and Tasks */}
      <BoardColumns boardId={boardId!} search={searchTerm} />
      
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