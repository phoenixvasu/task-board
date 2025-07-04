import React, { useState } from 'react';
import { DndContext, closestCenter, PointerSensor, useSensor, useSensors, DragEndEvent, DragOverlay, useDroppable, useDraggable } from '@dnd-kit/core';
import { arrayMove, SortableContext, horizontalListSortingStrategy } from '@dnd-kit/sortable';
import { useBoardStore } from '../../store/useBoardStore';
import Column from '../column/Column';
import TaskCard from '../task/TaskCard';
import Button from '../ui/Button';
import Modal from '../ui/Modal';
import { Plus } from 'lucide-react';
import toast from 'react-hot-toast';
import { Column as ColumnType } from '../../types';

interface BoardColumnsProps {
  boardId: string;
  search?: string;
}

const BoardColumns: React.FC<BoardColumnsProps> = ({ boardId, search = '' }) => {
  const { getBoard, reorderColumns, createColumn, reorderTasks } = useBoardStore();
  const board = getBoard(boardId);
  const [showAddColumn, setShowAddColumn] = useState(false);
  const [newColumnName, setNewColumnName] = useState('');
  const [activeTask, setActiveTask] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } })
  );

  // Helper to find which column a task is in
  const findColumnIdByTaskId = (taskId: string): string | null => {
    if (!board) return null;
    return board.columns.find(col => col.taskIds.includes(taskId))?.id || null;
  };

  const handleDragStart = (event: any) => {
    if (event.active && event.active.id && typeof event.active.id === 'string') {
      setActiveTask(event.active.id);
    }
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveTask(null);
    if (!over || active.id === over.id || !board) return;

    // Column drag
    const isColumnDrag = board.columns.some(col => col.id === active.id);
    if (isColumnDrag) {
      const oldIndex = board.columns.findIndex((col) => col.id === active.id);
      const newIndex = board.columns.findIndex((col) => col.id === over.id);
      if (oldIndex !== -1 && newIndex !== -1) {
        const newOrder = arrayMove(board.columns.map((col) => col.id), oldIndex, newIndex);
        setIsLoading(true);
        await reorderColumns(boardId, newOrder);
        setIsLoading(false);
        toast.success('Columns reordered');
      }
      return;
    }

    // Task drag
    const fromColumnId = findColumnIdByTaskId(active.id as string);
    let toColumnId: string | null = null;
    let newIndex = 0;
    if (board.columns.some(col => col.id === over.id)) {
      toColumnId = over.id as string;
      newIndex = board.columns.find(col => col.id === toColumnId)?.taskIds.length || 0;
    } else {
      toColumnId = findColumnIdByTaskId(over.id as string);
      const toCol = board.columns.find(col => col.id === toColumnId);
      newIndex = toCol ? toCol.taskIds.indexOf(over.id as string) : 0;
    }
    if (!fromColumnId || !toColumnId) return;

    setIsLoading(true);
    if (fromColumnId === toColumnId) {
      // Reorder within the same column
      const col = board.columns.find(c => c.id === fromColumnId);
      if (!col) return;
      const oldIndex = col.taskIds.indexOf(active.id as string);
      if (oldIndex !== -1 && newIndex !== -1) {
        const newOrder = arrayMove(col.taskIds, oldIndex, newIndex);
        await reorderTasks(boardId, fromColumnId, newOrder);
        toast.success('Tasks reordered');
      }
    } else {
      // Move to another column
      toast.success('Task moved (implement moveTask logic)');
    }
    setIsLoading(false);
  };

  const handleAddColumn = async () => {
    if (!newColumnName.trim()) {
      toast.error('Please enter a column name');
      return;
    }
    setIsLoading(true);
    await createColumn(boardId, newColumnName.trim());
    setNewColumnName('');
    setShowAddColumn(false);
    setIsLoading(false);
    toast.success('Column added');
  };

  // Helper to filter tasks by search
  const filterTaskIds = (taskIds: string[]) => {
    if (!search.trim()) return taskIds;
    const lower = search.toLowerCase();
    return taskIds.filter((taskId) => {
      const task = board?.tasks[taskId];
      if (!task) return false;
      return (
        task.title.toLowerCase().includes(lower) ||
        task.description.toLowerCase().includes(lower) ||
        (task.createdBy && task.createdBy.toLowerCase().includes(lower)) ||
        (task.assignedTo && task.assignedTo.toLowerCase().includes(lower))
      );
    });
  };

  if (!board) return null;

  return (
    <div className="flex items-start gap-4 overflow-x-auto pb-4 min-h-[60vh] dark:bg-darkbg">
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
        onDragStart={handleDragStart}
      >
        <SortableContext items={board.columns.map((col) => col.id)} strategy={horizontalListSortingStrategy}>
          {board.columns.map((column) => (
            <DroppableColumn
              key={column.id}
              column={column}
              boardId={boardId}
              activeTask={activeTask}
              filteredTaskIds={filterTaskIds(column.taskIds)}
            />
          ))}
        </SortableContext>
        <DragOverlay>
          {activeTask && (
            <TaskCard
              taskId={activeTask}
              boardId={boardId}
              columnId={findColumnIdByTaskId(activeTask) || ''}
            />
          )}
        </DragOverlay>
      </DndContext>
      {/* Add Column Button */}
      <div className="min-w-[280px]">
        <Button variant="outline" icon={<Plus size={16} />} onClick={() => setShowAddColumn(true)} disabled={isLoading}>
          Add Column
        </Button>
      </div>
      {/* Add Column Modal */}
      <Modal isOpen={showAddColumn} onClose={() => setShowAddColumn(false)} title="Add Column">
        <div className="space-y-4 dark:bg-secondary dark:text-white">
          <input
            type="text"
            value={newColumnName}
            onChange={(e) => setNewColumnName(e.target.value)}
            placeholder="Column name"
            className="input w-full dark:bg-darkbg dark:text-white"
            autoFocus
          />
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setShowAddColumn(false)}>Cancel</Button>
            <Button variant="primary" onClick={handleAddColumn} loading={isLoading}>Add</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

// DroppableColumn wraps Column and renders tasks as draggable items in a single context
const DroppableColumn: React.FC<{
  column: ColumnType;
  boardId: string;
  activeTask: string | null;
  filteredTaskIds: string[];
}> = ({ column, boardId, activeTask, filteredTaskIds }) => {
  const { setNodeRef } = useDroppable({ id: column.id });
  return (
    <div ref={setNodeRef} className="h-full min-w-[280px] max-w-xs">
      <Column column={column} boardId={boardId} activeTask={activeTask}>
        {filteredTaskIds.map((taskId: string) => (
          <DraggableTaskCard key={taskId} taskId={taskId} boardId={boardId} columnId={column.id} />
        ))}
      </Column>
    </div>
  );
};

const DraggableTaskCard: React.FC<{
  taskId: string;
  boardId: string;
  columnId: string;
}> = ({ taskId, boardId, columnId }) => {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({ id: taskId });
  return (
    <div
      ref={setNodeRef}
      {...attributes}
      {...listeners}
      style={{
        opacity: isDragging ? 0.5 : 1,
        transform: transform ? `translate3d(${transform.x}px, ${transform.y}px, 0)` : undefined,
      }}
    >
      <TaskCard taskId={taskId} boardId={boardId} columnId={columnId} />
    </div>
  );
};

export default BoardColumns; 