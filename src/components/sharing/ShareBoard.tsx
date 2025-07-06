import React, { useState, useEffect } from 'react';
import { useSharingStore } from '../../store/useSharingStore';
import { useBoardStore } from '../../store/useBoardStore';
import Modal from '../ui/Modal';
import Button from '../ui/Button';
import Dropdown from '../ui/Dropdown';
import { Trash2, UserPlus, Crown, Eye, Edit } from 'lucide-react';
import toast from 'react-hot-toast';

interface ShareBoardProps {
  boardId: string;
  isOpen: boolean;
  onClose: () => void;
}

const ShareBoard: React.FC<ShareBoardProps> = ({ boardId, isOpen, onClose }) => {
  const [showAddMember, setShowAddMember] = useState(false);
  const [selectedUser, setSelectedUser] = useState('');
  const [selectedRole, setSelectedRole] = useState<'editor' | 'viewer'>('viewer');

  const {
    members,
    isLoadingMembers,
    fetchMembers,
    addMember,
    removeMember,
    updateMemberRole
  } = useSharingStore();

  const { users } = useBoardStore();

  useEffect(() => {
    if (isOpen && boardId) {
      fetchMembers(boardId);
    }
  }, [isOpen, boardId, fetchMembers]);

  const handleAddMember = async () => {
    if (!selectedUser) {
      toast.error('Please select a user');
      return;
    }

    const success = await addMember(boardId, selectedUser, selectedRole);
    if (success) {
      toast.success('Member added successfully');
      setShowAddMember(false);
      setSelectedUser('');
      setSelectedRole('viewer');
    } else {
      toast.error('Failed to add member');
    }
  };

  const handleRemoveMember = async (userId: string) => {
    if (window.confirm('Are you sure you want to remove this member?')) {
      const success = await removeMember(boardId, userId);
      if (success) {
        toast.success('Member removed successfully');
      } else {
        toast.error('Failed to remove member');
      }
    }
  };

  const handleUpdateRole = async (userId: string, newRole: 'editor' | 'viewer') => {
    const success = await updateMemberRole(boardId, userId, newRole);
    if (success) {
      toast.success('Role updated successfully');
    } else {
      toast.error('Failed to update role');
    }
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'owner': return <Crown size={16} className="text-purple-600" />;
      case 'editor': return <Edit size={16} className="text-blue-600" />;
      case 'viewer': return <Eye size={16} className="text-gray-600" />;
      default: return <Eye size={16} className="text-gray-600" />;
    }
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'owner': return 'text-purple-600 bg-purple-100 dark:bg-purple-900 dark:text-purple-300';
      case 'editor': return 'text-blue-600 bg-blue-100 dark:bg-blue-900 dark:text-blue-300';
      case 'viewer': return 'text-gray-600 bg-gray-100 dark:bg-gray-700 dark:text-gray-300';
      default: return 'text-gray-600 bg-gray-100 dark:bg-gray-700 dark:text-gray-300';
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Share Board" size="lg">
      <div className="space-y-6">
        {/* Members Section */}
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold">Members</h3>
            <Button
              variant="primary"
              size="sm"
              icon={<UserPlus size={16} />}
              onClick={() => setShowAddMember(true)}
            >
              Add Member
            </Button>
          </div>

          {isLoadingMembers ? (
            <div className="text-center py-8">Loading members...</div>
          ) : (
            <div className="space-y-3">
              {members.map((member) => (
                <div key={member.userId} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className="flex items-center space-x-2">
                      {getRoleIcon(member.role)}
                      <span className={`px-2 py-1 text-xs font-medium rounded ${getRoleColor(member.role)}`}>
                        {member.role}
                      </span>
                    </div>
                    <div>
                      <div className="font-medium">{member.username}</div>
                      <div className="text-sm text-gray-500 dark:text-gray-400">{member.email}</div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Dropdown
                      options={[
                        { value: 'viewer', label: 'Viewer' },
                        { value: 'editor', label: 'Editor' }
                      ]}
                      value={member.role}
                      onChange={(role) => handleUpdateRole(member.userId, role as any)}
                      placeholder="Change role"
                      disabled={member.role === 'owner'}
                    />
                    {member.role !== 'owner' && (
                      <Button
                        variant="ghost"
                        size="sm"
                        icon={<Trash2 size={14} />}
                        onClick={() => handleRemoveMember(member.userId)}
                      >
                        Remove
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Add Member Modal */}
      <Modal isOpen={showAddMember} onClose={() => setShowAddMember(false)} title="Add Member">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">Select User</label>
            <Dropdown
              options={users.map(user => ({
                value: user.id,
                label: `${user.name} (${user.email})`
              }))}
              value={selectedUser}
              onChange={(userId) => setSelectedUser(userId)}
              placeholder="Choose a user"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Role</label>
            <Dropdown
              options={[
                { value: 'viewer', label: 'Viewer - Can only view the board' },
                { value: 'editor', label: 'Editor - Can edit tasks and columns' }
              ]}
              value={selectedRole}
              onChange={(role) => setSelectedRole(role as any)}
              placeholder="Choose a role"
            />
          </div>
          <div className="flex justify-end space-x-2">
            <Button variant="outline" onClick={() => setShowAddMember(false)}>Cancel</Button>
            <Button variant="primary" onClick={handleAddMember}>Add Member</Button>
          </div>
        </div>
      </Modal>
    </Modal>
  );
};

export default ShareBoard; 