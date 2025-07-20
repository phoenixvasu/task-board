import React from "react";
import { useCollaborationStore } from "../../store/useCollaborationStore";
import { Edit3, User } from "lucide-react";

interface EditingIndicatorProps {
  taskId: string;
}

const EditingIndicator: React.FC<{ taskId: string }> = ({ taskId }) => {
  const editingUsers = useCollaborationStore((state) => state.editingUsers);
  const editingUser = editingUsers.get(taskId);
  if (!editingUser) return null;
  return (
    <div className="flex items-center gap-1 px-2 py-1 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-md text-xs text-blue-700 dark:text-blue-300">
      <span className="font-medium">
        {editingUser.username || editingUser.userId}
      </span>
      <span>is editing...</span>
    </div>
  );
};
export default EditingIndicator;
