import React, { useState, useRef, useEffect } from 'react';
import { useCollaborationStore } from '../../store/useCollaborationStore';
import Avatar from '../ui/Avatar';
import { Users, ChevronDown } from 'lucide-react';

const ActiveUsers: React.FC = () => {
  const { activeUsers } = useCollaborationStore();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownOpen(false);
      }
    }
    if (dropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    } else {
      document.removeEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [dropdownOpen]);

  if (activeUsers.length === 0) {
    return null;
  }

  return (
    <div className="relative flex items-center gap-2 p-2 bg-gray-50 dark:bg-gray-800 rounded-lg" ref={dropdownRef}>
      <Users size={16} className="text-gray-500 dark:text-gray-400" />
      <button
        className="flex items-center text-sm text-gray-600 dark:text-gray-300 focus:outline-none"
        onClick={() => setDropdownOpen((open) => !open)}
        aria-haspopup="true"
        aria-expanded={dropdownOpen}
        title="View all active users"
        type="button"
      >
        {activeUsers.length} active
        <ChevronDown size={16} className="ml-1" />
      </button>
      {dropdownOpen && (
        <div className="absolute left-0 mt-2 z-50 w-64 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg p-2 max-h-72 overflow-y-auto">
          <div className="font-semibold text-gray-700 dark:text-gray-200 mb-2">Active Users</div>
          <ul>
            {activeUsers.map((user) => (
              <li key={user.userId} className="flex items-center gap-2 py-1 px-2 rounded hover:bg-gray-100 dark:hover:bg-gray-800">
                <Avatar
                  user={{
                    name: user.username,
                  }}
                  size="sm"
                  className="border-2 border-white dark:border-gray-800"
                />
                <span className="text-sm text-gray-800 dark:text-gray-100">{user.username}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default ActiveUsers; 