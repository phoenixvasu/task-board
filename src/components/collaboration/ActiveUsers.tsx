import React from "react";
import { useCollaborationStore } from "../../store/useCollaborationStore";

const ActiveUsers: React.FC = () => {
  const activeUsers = useCollaborationStore((state) => state.activeUsers);
  if (!activeUsers || activeUsers.length === 0) return null;
  return (
    <div className="flex items-center gap-2">
      <span className="text-xs text-gray-500">Active:</span>
      {activeUsers.map((u) => (
        <span
          key={u.userId}
          className="inline-flex items-center px-2 py-1 bg-gray-100 rounded text-xs text-gray-700"
        >
          {u.username || u.userId}
        </span>
      ))}
    </div>
  );
};

export default ActiveUsers;
