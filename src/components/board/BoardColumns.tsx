import React, { useState } from 'react';
import { DndContext, closestCenter, PointerSensor, useSensor, useSensors, DragEndEvent, DragOverlay, useDroppable, useDraggable } from '@dnd-kit/core';
import { arrayMove, SortableContext, horizontalListSortingStrategy } from '@dnd-kit/sortable';
import { useBoardStore } from '../../store/useBoardStore';
import { useSharingStore } from '../../store/useSharingStore';
import Column from '../column/Column';
import TaskCard from '../task/TaskCard';
import Button from '../ui/Button';
import Modal from '../ui/Modal';
import { Plus } from 'lucide-react';
import toast from 'react-hot-toast';
import { Column as ColumnType, FilterOptions, SortOptions } from '../../types';
import { filterTasks, sortTasks } from '../../utils';

interface BoardColumnsProps {
  boardId: string;
  filters?: FilterOptions;
  sortOptions?: SortOptions;
}

const BoardColumns: React.FC<BoardColumnsProps> = ({ boardId, filters, sortOptions }) => {
  const { getBoard, reorderColumns, createColumn, moveTask } = useBoardStore();
  const { boardAccess } = useSharingStore();
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
    
    if (!over || active.id === over.id || !board) {
      return;
    }

    // Check permissions before allowing drag operations
    if (!boardAccess?.permissions.canEdit) {
      toast.error('You do not have permission to modify this board');
      return;
    }

    // Column drag
    const isColumnDrag = board.columns.some(col => col.id === active.id);
    if (isColumnDrag) {
      const oldIndex = board.columns.findIndex((col) => col.id === active.id);
      const newIndex = board.columns.findIndex((col) => col.id === over.id);
      if (oldIndex !== -1 && newIndex !== -1) {
        const newOrder = arrayMove(board.columns.map((col) => col.id), oldIndex, newIndex);
        setIsLoading(true);
        await reorderColumns(boardId, newOrder);
        
        // Backend will emit socket event automatically
        setIsLoading(false);
        toast.success('Columns reordered');
      }
      return;
    }

    // Task drag
    const fromColumnId = findColumnIdByTaskId(active.id as string);
    let toColumnId: string | null = null;
    let newIndex = 0;
    
    // Check if dropping on a column
    if (board.columns.some(col => col.id === over.id)) {
      toColumnId = over.id as string;
      newIndex = 0; // Add to the beginning of the column
    } else {
      // Dropping on a task - find the column and position
      const targetColumn = board.columns.find(col => 
        col.taskIds.includes(over.id as string)
      );
      if (targetColumn) {
        toColumnId = targetColumn.id;
        const targetIndex = targetColumn.taskIds.indexOf(over.id as string);
        newIndex = targetIndex;
      }
    }

    if (fromColumnId && toColumnId && fromColumnId !== toColumnId) {
      setIsLoading(true);
      await moveTask(boardId, active.id as string, fromColumnId, toColumnId, newIndex);
      
      // Backend will emit socket event automatically
      setIsLoading(false);
      toast.success('Task moved');
    }
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

  // Helper to filter tasks by search and other filters
  const filterTaskIds = (taskIds: string[]) => {
    if (!board) return taskIds;
    
    // Get all tasks for this column
    const tasks = taskIds.map(taskId => board.tasks[taskId]).filter(Boolean);
    
    // Apply filters if provided
    let filteredTasks = tasks;
    if (filters) {
      filteredTasks = filterTasks(tasks, filters);
    }
    
    // Apply sorting if provided
    if (sortOptions) {
      filteredTasks = sortTasks(filteredTasks, sortOptions);
    }
    
    // Return the filtered and sorted task IDs
    return filteredTasks.map(task => task.id);
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
            <div className="transform rotate-3 scale-105 shadow-2xl">
              <TaskCard
                taskId={activeTask}
                boardId={boardId}
                columnId={findColumnIdByTaskId(activeTask) || ''}
              />
            </div>
          )}
        </DragOverlay>
      </DndContext>
      {/* Add Column Button - only show if user can edit */}
      {boardAccess?.permissions.canEdit && (
        <div className="min-w-[280px]">
          <Button variant="outline" icon={<Plus size={16} />} onClick={() => setShowAddColumn(true)} disabled={isLoading}>
            Add Column
          </Button>
        </div>
      )}
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
  const { setNodeRef, isOver } = useDroppable({ id: column.id });
  return (
    <div 
      ref={setNodeRef} 
      className={`h-full min-w-[280px] max-w-xs transition-colors duration-200 ${
        isOver ? 'bg-blue-50 dark:bg-blue-900/20' : ''
      }`}
    >
      <Column column={column} boardId={boardId} activeTask={activeTask}>
        {filteredTaskIds.map((taskId: string) => (
          <DraggableTaskCard key={taskId} taskId={taskId} boardId={boardId} columnId={column.id} />
        ))}
        {/* Empty state indicator for better drop detection */}
        {filteredTaskIds.length === 0 && (
          <div className="h-20 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg flex items-center justify-center text-gray-500 dark:text-gray-400 text-sm">
            Drop tasks here
          </div>
        )}
      </Column>
    </div>
  );
};

const DraggableTaskCard: React.FC<{
  taskId: string;
  boardId: string;
  columnId: string;
}> = ({ taskId, boardId, columnId }) => {
  const { boardAccess } = useSharingStore();
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({ 
    id: taskId,
    disabled: !boardAccess?.permissions.canEdit 
  });
  return (
    <div
      ref={setNodeRef}
      {...attributes}
      {...listeners}
      style={{
        opacity: isDragging ? 0.5 : 1,
        transform: transform ? `translate3d(${transform.x}px, ${transform.y}px, 0)` : undefined,
        cursor: boardAccess?.permissions.canEdit ? 'grab' : 'default',
      }}
      className={`transition-all duration-200 ${isDragging ? 'z-50' : ''}`}
    >
      <TaskCard taskId={taskId} boardId={boardId} columnId={columnId} />
    </div>
  );
};

export default BoardColumns; 