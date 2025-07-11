import React, { useState, useMemo, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  Plus, 
  Calendar, 
  Users, 
  Clock,
  Edit,
  Trash2,
  Share2,
} from 'lucide-react';
import { useBoardStore } from '../store/useBoardStore';
import { useAuthStore } from '../store/useAuthStore';
import { useSearchStore } from '../store/useSearchStore';
import { useSharingStore } from '../store/useSharingStore';
import Button from '../components/ui/Button';
import Modal from '../components/ui/Modal';
import { formatDate } from '../utils';
import toast from 'react-hot-toast';

const BoardList: React.FC = () => {
  const { boards, fetchBoards, createBoard, deleteBoard, updateBoard } = useBoardStore();
  const { user } = useAuthStore();
  const { searchTerm, setPage } = useSearchStore();
  const { getSharedBoards } = useSharingStore();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingBoard, setEditingBoard] = useState<any>(null);
  const [newBoardName, setNewBoardName] = useState('');
  const [newBoardDescription, setNewBoardDescription] = useState('');
  const [editBoardName, setEditBoardName] = useState('');
  const [editBoardDescription, setEditBoardDescription] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [sharedBoards, setSharedBoards] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<'owned' | 'shared'>('owned');

  useEffect(() => {
    fetchBoards();
    fetchSharedBoards();
    setPage('boards');
    // eslint-disable-next-line
  }, [fetchBoards, setPage]);

  // Fetch shared boards when switching to shared tab
  useEffect(() => {
    if (activeTab === 'shared') {
      fetchSharedBoards();
    }
    // eslint-disable-next-line
  }, [activeTab]);

  const fetchSharedBoards = async () => {
    try {
      const shared = await getSharedBoards();
      setSharedBoards(shared);
    } catch (error) {
      console.error('Failed to fetch shared boards:', error);
    }
  };

  // Filter boards based on search term and active tab
  const filteredBoards = useMemo(() => {
    if (activeTab === 'owned') {
      const boardsArray = Object.values(boards || {});
      if (!searchTerm) return boardsArray;
      return boardsArray.filter(board =>
        board.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (board.description && board.description.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    } else {
      if (!Array.isArray(sharedBoards)) return [];
      if (!searchTerm) return sharedBoards;
      return sharedBoards.filter(board =>
        board.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (board.description && board.description.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }
  }, [boards, sharedBoards, searchTerm, activeTab]);

  const handleCreateBoard = async () => {
    if (!newBoardName.trim()) {
      toast.error('Please enter a board name');
      return;
    }
    
    setIsLoading(true);
    try {
      const boardId = await createBoard(newBoardName.trim(), newBoardDescription.trim());
      if (boardId) {
        setNewBoardName('');
        setNewBoardDescription('');
        setShowCreateModal(false);
        toast.success('Board created successfully!');
      } else {
        toast.error('Failed to create board. Please try again.');
      }
    } catch (error) {
      console.error('Board creation error:', error);
      toast.error('Failed to create board. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleEditBoard = (board: any) => {
    setEditingBoard(board);
    setEditBoardName(board.name);
    setEditBoardDescription(board.description || '');
    setShowEditModal(true);
  };

  const handleUpdateBoard = async () => {
    if (!editBoardName.trim()) {
      toast.error('Please enter a board name');
      return;
    }
    setIsLoading(true);
    if (editingBoard) {
      await updateBoard(editingBoard.id, {
        name: editBoardName.trim(),
        description: editBoardDescription.trim(),
      });
      setShowEditModal(false);
      setEditingBoard(null);
      toast.success('Board updated successfully!');
    }
    setIsLoading(false);
  };

  const handleDeleteBoard = async (boardId: string, boardName: string) => {
    console.log('Attempting to delete board:', { boardId, boardName });
    
    if (!boardId || !boardId.trim()) {
      toast.error('Invalid board ID');
      return;
    }
    
    if (window.confirm(`Are you sure you want to delete "${boardName}"?`)) {
      setIsLoading(true);
      try {
        console.log('Calling deleteBoard with ID:', boardId);
        await deleteBoard(boardId);
        console.log('Board deleted successfully');
        toast.success('Board deleted successfully!');
      } catch (error) {
        console.error('Board deletion error:', error);
        toast.error('Failed to delete board. Please try again.');
      } finally {
        setIsLoading(false);
      }
    }
  };

  const getTotalTasks = (board: any) => {
    return Object.keys(board.tasks || {}).length;
  };

  const getTotalColumns = (board: any) => {
    return board.columns?.length || 0;
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'owner': return 'text-purple-600 bg-purple-100 dark:bg-purple-900 dark:text-purple-300';
      case 'admin': return 'text-red-600 bg-red-100 dark:bg-red-900 dark:text-red-300';
      case 'editor': return 'text-blue-600 bg-blue-100 dark:bg-blue-900 dark:text-blue-300';
      case 'viewer': return 'text-gray-600 bg-gray-100 dark:bg-gray-700 dark:text-gray-300';
      default: return 'text-gray-600 bg-gray-100 dark:bg-gray-700 dark:text-gray-300';
    }
  };

  if (!user) return null;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-darkbg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">My Boards</h1>
            <p className="mt-2 text-gray-600 dark:text-gray-300">Manage and organize your task boards</p>
          </div>
          <Button
            variant="primary"
            icon={<Plus size={16} />}
            onClick={() => setShowCreateModal(true)}
            className="mt-4 sm:mt-0"
            disabled={isLoading}
          >
            Create Board
          </Button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-200 dark:border-gray-700 mb-6">
          <button
            onClick={() => setActiveTab('owned')}
            className={`px-4 py-2 font-medium ${
              activeTab === 'owned'
                ? 'border-b-2 border-blue-500 text-blue-600 dark:text-blue-400'
                : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'
            }`}
          >
            My Boards ({Object.keys(boards).length})
          </button>
          <button
            onClick={() => setActiveTab('shared')}
            className={`px-4 py-2 font-medium ${
              activeTab === 'shared'
                ? 'border-b-2 border-blue-500 text-blue-600 dark:text-blue-400'
                : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'
            }`}
          >
            Shared with Me ({sharedBoards.length})
          </button>
        </div>

        {/* Boards Table */}
        <div className="bg-white dark:bg-secondary rounded-lg shadow overflow-hidden">
          {Array.isArray(filteredBoards) && filteredBoards.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-gray-400 mb-4">
                <Calendar size={48} className="mx-auto" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                {searchTerm ? 'No boards found' : `No ${activeTab === 'owned' ? 'boards' : 'shared boards'} yet`}
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                {searchTerm 
                  ? 'Try adjusting your search terms' 
                  : activeTab === 'owned' 
                    ? 'Create your first board to get started'
                    : 'You haven\'t been shared any boards yet'
                }
              </p>
              {!searchTerm && activeTab === 'owned' && (
                <Button
                  variant="primary"
                  icon={<Plus size={16} />}
                  onClick={() => setShowCreateModal(true)}
                  disabled={isLoading}
                >
                  Create Your First Board
                </Button>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead className="bg-gray-50 dark:bg-gray-800">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Board Name
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Description
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Role
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Columns
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Tasks
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Created
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-secondary divide-y divide-gray-200 dark:divide-gray-700">
                  {Array.isArray(filteredBoards) && filteredBoards.map((board, idx) => {
                    // Ensure we have the correct board ID
                    const boardId = board.id || board.boardId;
                    if (!boardId) {
                      console.error('Board missing ID:', board);
                      return null;
                    }
                    console.log('Rendering board:', { boardId, boardName: board.name, index: idx });
                    const uniqueKey = `${boardId}-${activeTab}-${idx}`;
                    
                    return (
                      <motion.tr
                        key={uniqueKey}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        whileHover={{ backgroundColor: '#f9fafb' }}
                        className="hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                      >
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <Link
                              to={`/board/${boardId}`}
                              className="text-sm font-medium text-primary hover:text-primary-dark transition-colors"
                            >
                              {board.name}
                            </Link>
                            {activeTab === 'shared' && (
                              <Share2 size={14} className="ml-2 text-gray-400" />
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <p className="text-sm text-gray-600 dark:text-gray-400 truncate max-w-xs">
                            {board.description || 'No description'}
                          </p>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 py-1 text-xs font-medium rounded ${getRoleColor(board.role || 'owner')}`}>
                            {board.role || 'owner'}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-400">
                          <div className="flex items-center">
                            <Users size={14} className="mr-1" />
                            {getTotalColumns(board)}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-400">
                          <div className="flex items-center">
                            <Calendar size={14} className="mr-1" />
                            {getTotalTasks(board)}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-400">
                          <div className="flex items-center">
                            <Clock size={14} className="mr-1" />
                            {formatDate(board.createdAt)}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <div className="flex items-center space-x-2">
                            <Link
                              to={`/board/${boardId}`}
                              className="text-primary hover:text-primary-dark transition-colors"
                            >
                              Open
                            </Link>
                            {activeTab === 'owned' && (
                              <>
                                <button
                                  onClick={() => handleEditBoard(board)}
                                  className="text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-200 transition-colors"
                                >
                                  <Edit size={14} />
                                </button>
                                <button
                                  onClick={() => handleDeleteBoard(boardId, board.name)}
                                  className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300 transition-colors"
                                >
                                  <Trash2 size={14} />
                                </button>
                              </>
                            )}
                          </div>
                        </td>
                      </motion.tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Create Board Modal */}
        <Modal isOpen={showCreateModal} onClose={() => setShowCreateModal(false)} title="Create New Board">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Board Name</label>
              <input
                type="text"
                value={newBoardName}
                onChange={(e) => setNewBoardName(e.target.value)}
                className="input w-full"
                placeholder="Enter board name"
                autoFocus
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Description (Optional)</label>
              <textarea
                value={newBoardDescription}
                onChange={(e) => setNewBoardDescription(e.target.value)}
                className="textarea w-full"
                placeholder="Enter board description"
                rows={3}
              />
            </div>
            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={() => setShowCreateModal(false)}>Cancel</Button>
              <Button variant="primary" onClick={handleCreateBoard} loading={isLoading}>Create Board</Button>
            </div>
          </div>
        </Modal>

        {/* Edit Board Modal */}
        <Modal isOpen={showEditModal} onClose={() => setShowEditModal(false)} title="Edit Board">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Board Name</label>
              <input
                type="text"
                value={editBoardName}
                onChange={(e) => setEditBoardName(e.target.value)}
                className="input w-full"
                placeholder="Enter board name"
                autoFocus
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Description (Optional)</label>
              <textarea
                value={editBoardDescription}
                onChange={(e) => setEditBoardDescription(e.target.value)}
                className="textarea w-full"
                placeholder="Enter board description"
                rows={3}
              />
            </div>
            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={() => setShowEditModal(false)}>Cancel</Button>
              <Button variant="primary" onClick={handleUpdateBoard} loading={isLoading}>Update Board</Button>
            </div>
          </div>
        </Modal>
      </div>
    </div>
  );
};

export default BoardList; 