import React, { useState, useMemo, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  Plus, 
  Calendar, 
  Users, 
  Clock,
  Edit,
  Trash2
} from 'lucide-react';
import { useBoardStore } from '../store/useBoardStore';
import { useAuthStore } from '../store/useAuthStore';
import { useSearchStore } from '../store/useSearchStore';
import Button from '../components/ui/Button';
import Modal from '../components/ui/Modal';
import { formatDate } from '../utils';
import toast from 'react-hot-toast';

const BoardList: React.FC = () => {
  const { boards, fetchBoards, createBoard, deleteBoard, updateBoard } = useBoardStore();
  const { user } = useAuthStore();
  const { searchTerm, setPage } = useSearchStore();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingBoard, setEditingBoard] = useState<any>(null);
  const [newBoardName, setNewBoardName] = useState('');
  const [newBoardDescription, setNewBoardDescription] = useState('');
  const [editBoardName, setEditBoardName] = useState('');
  const [editBoardDescription, setEditBoardDescription] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    fetchBoards();
    setPage('boards');
    // eslint-disable-next-line
  }, [fetchBoards, setPage]);

  // Filter boards based on search term
  const filteredBoards = useMemo(() => {
    const boardsArray = Object.values(boards);
    if (!searchTerm) return boardsArray;
    
    return boardsArray.filter(board => 
      board.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (board.description && board.description.toLowerCase().includes(searchTerm.toLowerCase()))
    );
  }, [boards, searchTerm]);

  const handleCreateBoard = async () => {
    if (!newBoardName.trim()) {
      toast.error('Please enter a board name');
      return;
    }
    setIsLoading(true);
    await createBoard(newBoardName.trim(), newBoardDescription.trim());
    setNewBoardName('');
    setNewBoardDescription('');
    setShowCreateModal(false);
    setIsLoading(false);
    toast.success('Board created successfully!');
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
    if (window.confirm(`Are you sure you want to delete "${boardName}"?`)) {
      setIsLoading(true);
      await deleteBoard(boardId);
      setIsLoading(false);
      toast.success('Board deleted successfully!');
    }
  };

  const getTotalTasks = (board: any) => {
    return Object.keys(board.tasks).length;
  };

  const getTotalColumns = (board: any) => {
    return board.columns.length;
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

        {/* Boards Table */}
        <div className="bg-white dark:bg-secondary rounded-lg shadow overflow-hidden">
          {filteredBoards.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-gray-400 mb-4">
                <Calendar size={48} className="mx-auto" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                {searchTerm ? 'No boards found' : 'No boards yet'}
              </h3>
              <p className="text-gray-600 mb-6">
                {searchTerm 
                  ? 'Try adjusting your search terms' 
                  : 'Create your first board to get started'
                }
              </p>
              {!searchTerm && (
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
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Board Name
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Description
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Columns
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Tasks
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Created
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredBoards.map((board) => (
                    <motion.tr
                      key={board.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      whileHover={{ backgroundColor: '#f9fafb' }}
                      className="hover:bg-gray-50 transition-colors"
                    >
                      <td className="px-6 py-4 whitespace-nowrap">
                        <Link
                          to={`/board/${board.id}`}
                          className="text-sm font-medium text-primary hover:text-primary-dark transition-colors"
                        >
                          {board.name}
                        </Link>
                      </td>
                      <td className="px-6 py-4">
                        <p className="text-sm text-gray-600 truncate max-w-xs">
                          {board.description || 'No description'}
                        </p>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center text-sm text-gray-600">
                          <Users size={16} className="mr-1" />
                          {getTotalColumns(board)}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center text-sm text-gray-600">
                          <Clock size={16} className="mr-1" />
                          {getTotalTasks(board)}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                        {formatDate(board.createdAt)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex items-center space-x-2">
                          <Button
                            variant="outline"
                            size="sm"
                            icon={<Edit size={14} />}
                            onClick={() => handleEditBoard(board)}
                            disabled={isLoading}
                          >
                            Edit
                          </Button>
                          <Button
                            variant="danger"
                            size="sm"
                            icon={<Trash2 size={14} />}
                            onClick={() => handleDeleteBoard(board.id, board.name)}
                            disabled={isLoading}
                          >
                            Delete
                          </Button>
                        </div>
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Create Board Modal */}
      <Modal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        title="Create New Board"
        size="md"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Board Name *
            </label>
            <input
              type="text"
              value={newBoardName}
              onChange={(e) => setNewBoardName(e.target.value)}
              placeholder="Enter board name"
              className="input w-full"
              autoFocus
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Description
            </label>
            <textarea
              value={newBoardDescription}
              onChange={(e) => setNewBoardDescription(e.target.value)}
              placeholder="Enter board description (optional)"
              className="textarea w-full"
              rows={3}
            />
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button
              variant="outline"
              onClick={() => setShowCreateModal(false)}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              onClick={handleCreateBoard}
              loading={isLoading}
            >
              Create Board
            </Button>
          </div>
        </div>
      </Modal>

      {/* Edit Board Modal */}
      <Modal
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
        title="Edit Board"
        size="md"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Board Name *
            </label>
            <input
              type="text"
              value={editBoardName}
              onChange={(e) => setEditBoardName(e.target.value)}
              placeholder="Enter board name"
              className="input w-full"
              autoFocus
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Description
            </label>
            <textarea
              value={editBoardDescription}
              onChange={(e) => setEditBoardDescription(e.target.value)}
              placeholder="Enter board description (optional)"
              className="textarea w-full"
              rows={3}
            />
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button
              variant="outline"
              onClick={() => setShowEditModal(false)}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              onClick={handleUpdateBoard}
              loading={isLoading}
            >
              Update Board
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default BoardList; 