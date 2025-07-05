import React from 'react';
import { useCollaborationStore } from '../../store/useCollaborationStore';
import Avatar from '../ui/Avatar';
import { Users, Circle } from 'lucide-react';

const ActiveUsers: React.FC = () => {
  const { activeUsers } = useCollaborationStore();

  if (activeUsers.length === 0) {
    return null;
  }

  return (
    <div className="flex items-center gap-2 p-2 bg-gray-50 dark:bg-gray-800 rounded-lg">
      <Users size={16} className="text-gray-500 dark:text-gray-400" />
      <span className="text-sm text-gray-600 dark:text-gray-300">
        {activeUsers.length} active
      </span>
      <div className="flex -space-x-2">
        {activeUsers.slice(0, 5).map((user) => (
          <div key={user.userId} className="relative" title={`${user.username} is online`}>
            <Avatar
              name={user.username}
              size="sm"
              className="border-2 border-white dark:border-gray-800"
            />
            <Circle
              size={8}
              className="absolute -bottom-0.5 -right-0.5 text-green-500 fill-current"
            />
          </div>
        ))}
        {activeUsers.length > 5 && (
          <div className="flex items-center justify-center w-8 h-8 bg-gray-200 dark:bg-gray-700 rounded-full border-2 border-white dark:border-gray-800">
            <span className="text-xs font-medium text-gray-600 dark:text-gray-300">
              +{activeUsers.length - 5}
            </span>
          </div>
        )}
      </div>
    </div>
  );
};

export default ActiveUsers; 