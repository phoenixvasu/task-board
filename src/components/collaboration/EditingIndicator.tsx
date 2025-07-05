import React from 'react';
import { useCollaborationStore } from '../../store/useCollaborationStore';
import { Edit3, User } from 'lucide-react';

interface EditingIndicatorProps {
  taskId: string;
}

const EditingIndicator: React.FC<EditingIndicatorProps> = ({ taskId }) => {
  const { editingUsers } = useCollaborationStore();
  const editingUser = editingUsers.get(taskId);

  if (!editingUser) {
    return null;
  }

  return (
    <div className="flex items-center gap-1 px-2 py-1 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-md text-xs text-blue-700 dark:text-blue-300">
      <Edit3 size={12} className="animate-pulse" />
      <User size={12} />
      <span className="font-medium">{editingUser.username}</span>
      <span>is editing...</span>
    </div>
  );
};

export default EditingIndicator; 