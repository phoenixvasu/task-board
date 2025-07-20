import React, { useState, ReactNode, useEffect } from "react";
import { useBoardStore } from "../../store/useBoardStore";
import { useSharingStore } from "../../store/useSharingStore";
import { motion } from "framer-motion";
import { Edit, Trash2, Plus } from "lucide-react";
import Button from "../ui/Button";
import Modal from "../ui/Modal";
import Dropdown from "../ui/Dropdown";
import { Column as ColumnType } from "../../types";
import toast from "react-hot-toast";

interface ColumnProps {
  column: ColumnType;
  boardId: string;
  activeTask?: string | null;
  children?: ReactNode;
}

const Column: React.FC<ColumnProps> = ({ column, boardId, children }) => {
  const { updateColumn, deleteColumn, createTask, users, fetchUsers } =
    useBoardStore();
  const { boardAccess } = useSharingStore();
  const [showEdit, setShowEdit] = useState(false);
  const [showAddTask, setShowAddTask] = useState(false);
  const [editName, setEditName] = useState(column.name);
  const [newTaskTitle, setNewTaskTitle] = useState("");
  const [newTaskDescription, setNewTaskDescription] = useState("");
  const [newTaskPriority, setNewTaskPriority] = useState<
    "low" | "medium" | "high"
  >("medium");
  const [newTaskAssignee, setNewTaskAssignee] = useState("");
  const [newTaskDueDate, setNewTaskDueDate] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  // Fetch users when component mounts
  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const handleEditColumn = async () => {
    if (!editName.trim()) {
      toast.error("Please enter a column name");
      return;
    }
    setIsLoading(true);
    await updateColumn(boardId, column.id, { name: editName.trim() });
    setShowEdit(false);
    setIsLoading(false);
    toast.success("Column updated");
  };

  const handleDeleteColumn = async () => {
    if (window.confirm("Delete this column and all its tasks?")) {
      setIsLoading(true);
      await deleteColumn(boardId, column.id);
      setIsLoading(false);
      toast.success("Column deleted");
    }
  };

  const handleAddTask = async () => {
    if (!newTaskTitle.trim()) {
      toast.error("Please enter a task title");
      return;
    }
    setIsLoading(true);

    // Get current user ID from auth store
    const token = localStorage.getItem("jwt");
    let currentUserId = "";
    if (token) {
      try {
        const payload = JSON.parse(atob(token.split(".")[1]));
        currentUserId = payload.id;
      } catch (error) {
        console.error("Failed to decode token:", error);
      }
    }

    // Validate assignee - allow unassigned
    let finalAssignee = null;
    if (newTaskAssignee.trim() && users.some((u) => u.id === newTaskAssignee)) {
      finalAssignee = newTaskAssignee;
    }

    // Allow due date to be null if not set
    const dueDateValue = newTaskDueDate.trim() ? newTaskDueDate.trim() : null;

    await createTask(boardId, column.id, {
      title: newTaskTitle.trim(),
      description: newTaskDescription.trim(),
      createdBy: currentUserId,
      assignedTo: finalAssignee,
      priority: newTaskPriority,
      dueDate: dueDateValue || undefined,
    });
    setNewTaskTitle("");
    setNewTaskDescription("");
    setNewTaskPriority("medium");
    setNewTaskAssignee("");
    setNewTaskDueDate("");
    setShowAddTask(false);
    setIsLoading(false);
    toast.success("Task added");
  };

  return (
    <motion.div
      layout
      className="bg-gray-100 dark:bg-darkbg rounded-lg p-4 min-w-[280px] max-w-xs flex flex-col gap-4 shadow"
    >
      <div className="flex items-center justify-between gap-2">
        <h2 className="font-semibold text-lg truncate dark:text-white">
          {column.name}
        </h2>
        {/* Edit/Delete buttons - only show if user can edit */}
        {boardAccess?.permissions.canEdit && (
          <div className="flex gap-1">
            <button
              onClick={() => setShowEdit(true)}
              className="text-gray-400 hover:text-primary"
            >
              <Edit size={16} />
            </button>
            <button
              onClick={handleDeleteColumn}
              className="text-gray-400 hover:text-danger"
            >
              <Trash2 size={16} />
            </button>
          </div>
        )}
      </div>
      <div className="flex flex-col gap-3 min-h-[40px]">{children}</div>
      {/* Add Task button - only show if user can edit */}
      {boardAccess?.permissions.canEdit && (
        <Button
          variant="outline"
          icon={<Plus size={16} />}
          onClick={() => setShowAddTask(true)}
          disabled={isLoading}
        >
          Add Task
        </Button>
      )}
      {/* Edit Column Modal */}
      <Modal
        isOpen={showEdit}
        onClose={() => setShowEdit(false)}
        title="Edit Column"
      >
        <input
          type="text"
          value={editName}
          onChange={(e) => setEditName(e.target.value)}
          className="input w-full mb-4 dark:bg-darkbg dark:text-white"
          autoFocus
        />
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={() => setShowEdit(false)}>
            Cancel
          </Button>
          <Button
            variant="primary"
            onClick={handleEditColumn}
            loading={isLoading}
          >
            Save
          </Button>
        </div>
      </Modal>
      {/* Add Task Modal */}
      <Modal
        isOpen={showAddTask}
        onClose={() => setShowAddTask(false)}
        title="Add Task"
      >
        <div className="space-y-4">
          <input
            type="text"
            value={newTaskTitle}
            onChange={(e) => setNewTaskTitle(e.target.value)}
            className="input w-full dark:bg-darkbg dark:text-white"
            placeholder="Task title"
            autoFocus
          />
          <textarea
            value={newTaskDescription}
            onChange={(e) => setNewTaskDescription(e.target.value)}
            className="textarea w-full dark:bg-darkbg dark:text-white"
            placeholder="Task description (supports markdown)"
            rows={3}
          />
          <div className="flex gap-2">
            <Dropdown
              options={[
                { value: "low", label: "Low" },
                { value: "medium", label: "Medium" },
                { value: "high", label: "High" },
              ]}
              value={newTaskPriority}
              onChange={(val) =>
                setNewTaskPriority(val as "low" | "medium" | "high")
              }
              placeholder="Priority"
            />
            <Dropdown
              options={
                users.length > 0
                  ? users.map((u) => ({ value: u.id, label: u.name }))
                  : [{ value: "", label: "No users available" }]
              }
              value={newTaskAssignee}
              onChange={setNewTaskAssignee}
              placeholder="Assign to"
            />
            <input
              type="date"
              value={newTaskDueDate}
              onChange={(e) => setNewTaskDueDate(e.target.value)}
              className="input dark:bg-darkbg dark:text-white"
            />
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setShowAddTask(false)}>
              Cancel
            </Button>
            <Button
              variant="primary"
              onClick={handleAddTask}
              loading={isLoading}
            >
              Add Task
            </Button>
          </div>
        </div>
      </Modal>
    </motion.div>
  );
};

export default Column;
