import React, { useState, useEffect } from "react";
import { useBoardStore } from "../../store/useBoardStore";
import { useSharingStore } from "../../store/useSharingStore";
import { useDraggable } from "@dnd-kit/core";
import { motion } from "framer-motion";
import { Edit, Trash2, User, Calendar } from "lucide-react";
import Tag from "../ui/Tag";
import Modal from "../ui/Modal";
import Dropdown from "../ui/Dropdown";
import Button from "../ui/Button";
import ReactMarkdown from "react-markdown";
import EditingIndicator from "../collaboration/EditingIndicator";
import { getPriorityColor, formatDate } from "../../utils";
import toast from "react-hot-toast";
import { emitTyping } from "../../store/useCollaborationStore";
import { useAuthStore } from "../../store/useAuthStore";

interface TaskCardProps {
  taskId: string;
  boardId: string;
  columnId: string;
}

const TaskCard: React.FC<TaskCardProps> = ({ taskId, boardId }) => {
  const { getTask, updateTask, deleteTask, users, fetchUsers } =
    useBoardStore();
  const { boardAccess } = useSharingStore();
  const task = getTask(boardId, taskId);
  const [showEdit, setShowEdit] = useState(false);
  const [editTask, setEditTask] = useState(task as typeof task | null);
  const [isLoading, setIsLoading] = useState(false);

  const { attributes, listeners, setNodeRef, transform, isDragging } =
    useDraggable({ id: taskId });

  // Fetch users when component mounts
  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  // Update editTask when task changes
  useEffect(() => {
    if (task) {
      setEditTask(task);
    }
  }, [task, users]);

  // Remove: useEffect(() => {
  // Remove:   if (showEdit) {
  // Remove:     socketService.notifyUserEditing(taskId, true);
  // Remove:   } else {
  // Remove:     socketService.notifyUserEditing(taskId, false);
  // Remove:   }
  // Remove: }, [showEdit, taskId]);

  if (!task || !editTask) return null;

  // Don't render if users haven't been loaded yet
  if (users.length === 0) {
    return (
      <motion.div
        ref={setNodeRef}
        style={{
          opacity: isDragging ? 0.5 : 1,
          transform: transform
            ? `translate3d(${transform.x}px, ${transform.y}px, 0)`
            : undefined,
        }}
        {...attributes}
        {...listeners}
        layout
        className={`bg-white dark:bg-secondary rounded-lg p-3 shadow flex flex-col gap-2 border-l-4 ${getPriorityColor(
          task.priority
        )} dark:text-white`}
      >
        <div className="text-center text-gray-500">Loading...</div>
      </motion.div>
    );
  }

  const handleEditTask = async () => {
    if (!editTask || !editTask.title.trim()) {
      toast.error("Please enter a task title");
      return;
    }

    setIsLoading(true);
    await updateTask(boardId, taskId, editTask);
    setShowEdit(false);
    setIsLoading(false);
    toast.success("Task updated");
  };

  const handleDeleteTask = async () => {
    if (window.confirm("Delete this task?")) {
      setIsLoading(true);
      await deleteTask(boardId, taskId);
      setIsLoading(false);
      toast.success("Task deleted");
    }
  };

  return (
    <motion.div
      ref={setNodeRef}
      style={{
        opacity: isDragging ? 0.5 : 1,
        transform: transform
          ? `translate3d(${transform.x}px, ${transform.y}px, 0)`
          : undefined,
      }}
      {...attributes}
      {...listeners}
      layout
      className={`bg-white dark:bg-secondary rounded-lg p-3 shadow flex flex-col gap-2 border-l-4 ${getPriorityColor(
        task.priority
      )} dark:text-white`}
    >
      {/* Editing indicator */}
      <EditingIndicator taskId={taskId} />

      <div className="flex items-center justify-between gap-2">
        <h3 className="font-semibold text-base truncate">{task.title}</h3>
        {/* Edit/Delete buttons - only show if user can edit */}
        {boardAccess?.permissions.canEdit && (
          <div className="flex gap-1">
            <button
              onClick={() => {
                setShowEdit(true);
              }}
              className="text-gray-400 hover:text-primary"
            >
              <Edit size={16} />
            </button>
            <button
              onClick={handleDeleteTask}
              className="text-gray-400 hover:text-danger"
            >
              <Trash2 size={16} />
            </button>
          </div>
        )}
      </div>
      <div className="text-xs text-gray-500 mb-1">
        Created by{" "}
        {users.find((u) => u.id === task.createdBy)?.name || "Unknown"}
      </div>
      <div className="mb-2 prose prose-sm max-w-full text-gray-700 dark:text-gray-200">
        <ReactMarkdown>{task.description || "*No description*"}</ReactMarkdown>
      </div>
      <div className="flex items-center gap-2 flex-wrap">
        <Tag
          label={task.priority}
          variant="priority"
          priority={task.priority}
        />
        {task.dueDate && (
          <div className="flex items-center gap-1 text-xs text-gray-500">
            <Calendar size={14} />
            {formatDate(task.dueDate)}
          </div>
        )}
        {task.assignedTo && (
          <div className="flex items-center gap-1 text-xs text-gray-500">
            <User size={14} />
            {users.find((u) => u.id === task.assignedTo)?.name || "Unassigned"}
          </div>
        )}
      </div>
      {/* Edit Task Modal */}
      <Modal
        isOpen={showEdit}
        onClose={() => setShowEdit(false)}
        title="Edit Task"
      >
        <div className="space-y-3">
          <input
            type="text"
            value={editTask.title}
            onChange={(e) => {
              setEditTask(
                editTask ? { ...editTask, title: e.target.value } : null
              );
              emitTyping(boardId, taskId, useAuthStore.getState().user?.id);
            }}
            className="input w-full"
            placeholder="Task title"
            autoFocus
          />
          <textarea
            value={editTask.description}
            onChange={(e) => {
              setEditTask(
                editTask ? { ...editTask, description: e.target.value } : null
              );
              emitTyping(boardId, taskId, useAuthStore.getState().user?.id);
            }}
            className="textarea w-full"
            placeholder="Task description (supports markdown)"
            rows={4}
          />
          <div className="flex gap-2">
            <Dropdown
              options={["low", "medium", "high"].map((p) => ({
                value: p,
                label: p.charAt(0).toUpperCase() + p.slice(1),
              }))}
              value={editTask.priority}
              onChange={(val) => {
                setEditTask(
                  editTask
                    ? { ...editTask, priority: val as typeof editTask.priority }
                    : null
                );
                emitTyping(boardId, taskId, useAuthStore.getState().user?.id);
              }}
              placeholder="Priority"
            />
            <Dropdown
              options={[
                { value: "", label: "No Assignment" },
                ...users.map((u) => ({ value: u.id, label: u.name })),
              ]}
              value={editTask.assignedTo || ""}
              onChange={(val) => {
                setEditTask(
                  editTask ? { ...editTask, assignedTo: val || null } : null
                );
                emitTyping(boardId, taskId, useAuthStore.getState().user?.id);
              }}
              placeholder="Assign to"
            />
            <input
              type="date"
              value={editTask.dueDate?.slice(0, 10) || ""}
              onChange={(e) => {
                setEditTask(
                  editTask ? { ...editTask, dueDate: e.target.value } : null
                );
                emitTyping(boardId, taskId, useAuthStore.getState().user?.id);
              }}
              className="input"
            />
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setShowEdit(false)}>
              Cancel
            </Button>
            <Button
              variant="primary"
              onClick={handleEditTask}
              loading={isLoading}
            >
              Save
            </Button>
          </div>
        </div>
      </Modal>
    </motion.div>
  );
};

export default TaskCard;
