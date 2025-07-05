import React, { useState, useEffect } from 'react';
import { useSharingStore } from '../../store/useSharingStore';
import { useBoardStore } from '../../store/useBoardStore';
import Modal from '../ui/Modal';
import Button from '../ui/Button';
import Dropdown from '../ui/Dropdown';
import { Share2, Users, Link, Settings, Copy, Trash2, Edit, UserPlus } from 'lucide-react';
import toast from 'react-hot-toast';

interface ShareBoardProps {
  boardId: string;
  isOpen: boolean;
  onClose: () => void;
}

const ShareBoard: React.FC<ShareBoardProps> = ({ boardId, isOpen, onClose }) => {
  const [activeTab, setActiveTab] = useState<'members' | 'invites' | 'settings'>('members');
  const [showAddMember, setShowAddMember] = useState(false);
  const [showCreateInvite, setShowCreateInvite] = useState(false);
  const [selectedUser, setSelectedUser] = useState('');
  const [selectedRole, setSelectedRole] = useState<'admin' | 'editor' | 'viewer'>('viewer');
  const [inviteRole, setInviteRole] = useState<'admin' | 'editor' | 'viewer'>('viewer');
  const [inviteExpiresAt, setInviteExpiresAt] = useState('');
  const [inviteMaxUses, setInviteMaxUses] = useState('');

  const {
    members,
    inviteLinks,
    sharingSettings,
    isLoadingMembers,
    isLoadingInviteLinks,
    fetchMembers,
    addMember,
    removeMember,
    updateMemberRole,
    fetchInviteLinks,
    createInviteLink,
    revokeInviteLink,
    fetchSharingSettings,
    updateSharingSettings
  } = useSharingStore();

  const { users } = useBoardStore();

  useEffect(() => {
    if (isOpen && boardId) {
      fetchMembers(boardId);
      fetchInviteLinks(boardId);
      fetchSharingSettings(boardId);
    }
  }, [isOpen, boardId, fetchMembers, fetchInviteLinks, fetchSharingSettings]);

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

  const handleUpdateRole = async (userId: string, newRole: 'admin' | 'editor' | 'viewer') => {
    const success = await updateMemberRole(boardId, userId, newRole);
    if (success) {
      toast.success('Role updated successfully');
    } else {
      toast.error('Failed to update role');
    }
  };

  const handleCreateInviteLink = async () => {
    const options: any = {};
    if (inviteExpiresAt) options.expiresAt = inviteExpiresAt;
    if (inviteMaxUses) options.maxUses = parseInt(inviteMaxUses);

    const inviteLink = await createInviteLink(boardId, inviteRole, options);
    if (inviteLink) {
      toast.success('Invite link created successfully');
      setShowCreateInvite(false);
      setInviteRole('viewer');
      setInviteExpiresAt('');
      setInviteMaxUses('');
    } else {
      toast.error('Failed to create invite link');
    }
  };

  const handleRevokeInviteLink = async (linkId: string) => {
    if (window.confirm('Are you sure you want to revoke this invite link?')) {
      const success = await revokeInviteLink(boardId, linkId);
      if (success) {
        toast.success('Invite link revoked successfully');
      } else {
        toast.error('Failed to revoke invite link');
      }
    }
  };

  const copyInviteLink = (inviteUrl: string) => {
    navigator.clipboard.writeText(inviteUrl);
    toast.success('Invite link copied to clipboard');
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

  const getRoleDescription = (role: string) => {
    switch (role) {
      case 'owner': return 'Full access, can manage everything';
      case 'admin': return 'Can edit, delete, and manage members';
      case 'editor': return 'Can edit tasks and columns';
      case 'viewer': return 'Can only view the board';
      default: return '';
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Share Board" size="lg">
      <div className="space-y-6">
        {/* Tabs */}
        <div className="flex border-b border-gray-200 dark:border-gray-700">
          <button
            onClick={() => setActiveTab('members')}
            className={`px-4 py-2 font-medium ${
              activeTab === 'members'
                ? 'border-b-2 border-blue-500 text-blue-600 dark:text-blue-400'
                : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'
            }`}
          >
            <Users size={16} className="inline mr-2" />
            Members ({members.length})
          </button>
          <button
            onClick={() => setActiveTab('invites')}
            className={`px-4 py-2 font-medium ${
              activeTab === 'invites'
                ? 'border-b-2 border-blue-500 text-blue-600 dark:text-blue-400'
                : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'
            }`}
          >
            <Link size={16} className="inline mr-2" />
            Invite Links ({inviteLinks.length})
          </button>
          <button
            onClick={() => setActiveTab('settings')}
            className={`px-4 py-2 font-medium ${
              activeTab === 'settings'
                ? 'border-b-2 border-blue-500 text-blue-600 dark:text-blue-400'
                : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'
            }`}
          >
            <Settings size={16} className="inline mr-2" />
            Settings
          </button>
        </div>

        {/* Members Tab */}
        {activeTab === 'members' && (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-semibold">Board Members</h3>
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
                      <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white text-sm font-medium">
                        {member.user.name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <div className="font-medium">{member.user.name}</div>
                        <div className="text-sm text-gray-500 dark:text-gray-400">{member.user.email}</div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className={`px-2 py-1 text-xs font-medium rounded ${getRoleColor(member.role)}`}>
                        {member.role}
                      </span>
                      {member.role !== 'owner' && (
                        <Dropdown
                          options={[
                            { value: 'admin', label: 'Admin' },
                            { value: 'editor', label: 'Editor' },
                            { value: 'viewer', label: 'Viewer' }
                          ]}
                          value={member.role}
                          onChange={(role) => handleUpdateRole(member.userId, role as any)}
                          placeholder="Role"
                        />
                      )}
                      {member.role !== 'owner' && (
                        <Button
                          variant="ghost"
                          size="sm"
                          icon={<Trash2 size={14} />}
                          onClick={() => handleRemoveMember(member.userId)}
                        />
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Invite Links Tab */}
        {activeTab === 'invites' && (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-semibold">Invite Links</h3>
              <Button
                variant="primary"
                size="sm"
                icon={<Link size={16} />}
                onClick={() => setShowCreateInvite(true)}
              >
                Create Invite Link
              </Button>
            </div>

            {isLoadingInviteLinks ? (
              <div className="text-center py-8">Loading invite links...</div>
            ) : (
              <div className="space-y-3">
                {inviteLinks.map((link) => (
                  <div key={link.id} className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <span className={`px-2 py-1 text-xs font-medium rounded ${getRoleColor(link.role)}`}>
                          {link.role}
                        </span>
                        <div className="text-sm text-gray-500 dark:text-gray-400">
                          Created {new Date(link.createdAt).toLocaleDateString()}
                          {link.maxUses && ` • ${link.usedCount}/${link.maxUses} uses`}
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          icon={<Copy size={14} />}
                          onClick={() => copyInviteLink(link.inviteUrl)}
                        />
                        <Button
                          variant="ghost"
                          size="sm"
                          icon={<Trash2 size={14} />}
                          onClick={() => handleRevokeInviteLink(link.id)}
                        />
                      </div>
                    </div>
                    <div className="mt-2 text-xs text-gray-500 dark:text-gray-400 break-all">
                      {link.inviteUrl}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Settings Tab */}
        {activeTab === 'settings' && sharingSettings && (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Sharing Settings</h3>
            
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-medium">Public Access</div>
                  <div className="text-sm text-gray-500 dark:text-gray-400">
                    Allow anyone with the link to view this board
                  </div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    className="sr-only peer"
                    checked={sharingSettings.isPublic}
                    onChange={(e) => updateSharingSettings(boardId, { isPublic: e.target.checked })}
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
                </label>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <div className="font-medium">Guest Access</div>
                  <div className="text-sm text-gray-500 dark:text-gray-400">
                    Allow guests to access without accounts
                  </div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    className="sr-only peer"
                    checked={sharingSettings.settings.allowGuestAccess}
                    onChange={(e) => updateSharingSettings(boardId, { 
                      settings: { ...sharingSettings.settings, allowGuestAccess: e.target.checked }
                    })}
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
                </label>
              </div>

              <div>
                <div className="font-medium mb-2">Default Role for New Members</div>
                <Dropdown
                  options={[
                    { value: 'viewer', label: 'Viewer' },
                    { value: 'editor', label: 'Editor' },
                    { value: 'admin', label: 'Admin' }
                  ]}
                  value={sharingSettings.settings.defaultRole}
                  onChange={(role) => updateSharingSettings(boardId, {
                    settings: { ...sharingSettings.settings, defaultRole: role as any }
                  })}
                  placeholder="Default Role"
                />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Add Member Modal */}
      <Modal isOpen={showAddMember} onClose={() => setShowAddMember(false)} title="Add Member">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">Select User</label>
            <Dropdown
              options={users.map(user => ({ value: user.id, label: user.name }))}
              value={selectedUser}
              onChange={setSelectedUser}
              placeholder="Choose a user"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Role</label>
            <Dropdown
              options={[
                { value: 'viewer', label: 'Viewer - Can only view the board' },
                { value: 'editor', label: 'Editor - Can edit tasks and columns' },
                { value: 'admin', label: 'Admin - Can manage everything' }
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

      {/* Create Invite Link Modal */}
      <Modal isOpen={showCreateInvite} onClose={() => setShowCreateInvite(false)} title="Create Invite Link">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">Role for Invited Users</label>
            <Dropdown
              options={[
                { value: 'viewer', label: 'Viewer - Can only view the board' },
                { value: 'editor', label: 'Editor - Can edit tasks and columns' },
                { value: 'admin', label: 'Admin - Can manage everything' }
              ]}
              value={inviteRole}
              onChange={(role) => setInviteRole(role as any)}
              placeholder="Choose a role"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Expires At (Optional)</label>
            <input
              type="datetime-local"
              value={inviteExpiresAt}
              onChange={(e) => setInviteExpiresAt(e.target.value)}
              className="input w-full"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Max Uses (Optional)</label>
            <input
              type="number"
              value={inviteMaxUses}
              onChange={(e) => setInviteMaxUses(e.target.value)}
              className="input w-full"
              placeholder="Leave empty for unlimited"
            />
          </div>
          <div className="flex justify-end space-x-2">
            <Button variant="outline" onClick={() => setShowCreateInvite(false)}>Cancel</Button>
            <Button variant="primary" onClick={handleCreateInviteLink}>Create Link</Button>
          </div>
        </div>
      </Modal>
    </Modal>
  );
};

export default ShareBoard; 