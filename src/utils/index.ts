import { format, isToday, isThisWeek, isThisMonth, isBefore, parseISO } from 'date-fns';
import { Priority, Task, FilterOptions, SortOptions } from '../types';

// Date utilities
export const formatDate = (date: string) => {
  if (!date) return 'N/A';
  try {
    const parsedDate = new Date(date);
    if (isNaN(parsedDate.getTime())) return 'N/A';
    return format(parsedDate, 'MMM dd, yyyy');
  } catch (error) {
    return 'N/A';
  }
};

export const formatDateTime = (date: string) => {
  if (!date) return 'N/A';
  try {
    const parsedDate = new Date(date);
    if (isNaN(parsedDate.getTime())) return 'N/A';
    return format(parsedDate, 'MMM dd, yyyy HH:mm');
  } catch (error) {
    return 'N/A';
  }
};

export const isTaskOverdue = (dueDate: string) => {
  if (!dueDate) return false;
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Set to start of day
    const due = parseISO(dueDate);
    if (isNaN(due.getTime())) return false;
    return isBefore(due, today);
  } catch (error) {
    return false;
  }
};

export const isTaskDueToday = (dueDate: string) => {
  if (!dueDate) return false;
  try {
    const parsedDate = new Date(dueDate);
    if (isNaN(parsedDate.getTime())) return false;
    return isToday(parsedDate);
  } catch (error) {
    return false;
  }
};

export const isTaskDueThisWeek = (dueDate: string) => {
  if (!dueDate) return false;
  try {
    const parsedDate = new Date(dueDate);
    if (isNaN(parsedDate.getTime())) return false;
    return isThisWeek(parsedDate);
  } catch (error) {
    return false;
  }
};

export const isTaskDueThisMonth = (dueDate: string) => {
  if (!dueDate) return false;
  try {
    const parsedDate = new Date(dueDate);
    if (isNaN(parsedDate.getTime())) return false;
    return isThisMonth(parsedDate);
  } catch (error) {
    return false;
  }
};

// Priority utilities
export const getPriorityColor = (priority: Priority) => {
  switch (priority) {
    case 'high':
      return 'bg-rose-100 text-rose-700 border-rose-200';
    case 'medium':
      return 'bg-amber-100 text-amber-700 border-amber-200';
    case 'low':
      return 'bg-sky-100 text-sky-700 border-sky-200';
    default:
      return 'bg-gray-100 text-gray-700 border-gray-200';
  }
};

export const getPriorityIcon = (priority: Priority) => {
  switch (priority) {
    case 'high':
      return '🔴';
    case 'medium':
      return '🟡';
    case 'low':
      return '🔵';
    default:
      return '⚪';
  }
};

// Filter utilities
export const filterTasks = (tasks: Task[], filters: FilterOptions) => {
  return tasks.filter((task) => {
    // Priority filter
    if (filters.priority && task.priority !== filters.priority) {
      return false;
    }

    // Assigned to filter
    if (filters.assignedTo && task.assignedTo !== filters.assignedTo) {
      return false;
    }

    // Due date filter
    if (filters.dueDate) {
      switch (filters.dueDate) {
        case 'overdue':
          if (!isTaskOverdue(task.dueDate)) return false;
          break;
        case 'today':
          if (!isTaskDueToday(task.dueDate)) return false;
          break;
        case 'this-week':
          if (!isTaskDueThisWeek(task.dueDate)) return false;
          break;
        case 'this-month':
          if (!isTaskDueThisMonth(task.dueDate)) return false;
          break;
      }
    }

    // Search filter
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      const matchesTitle = task.title.toLowerCase().includes(searchLower);
      const matchesDescription = task.description.toLowerCase().includes(searchLower);
      const matchesCreatedBy = task.createdBy?.toLowerCase().includes(searchLower) || false;
      const matchesAssignedTo = task.assignedTo?.toLowerCase().includes(searchLower) || false;
      
      if (!matchesTitle && !matchesDescription && !matchesCreatedBy && !matchesAssignedTo) {
        return false;
      }
    }

    return true;
  });
};

// Sort utilities
export const sortTasks = (tasks: Task[], sortOptions: SortOptions) => {
  const sortedTasks = [...tasks].sort((a, b) => {
    let aValue: any;
    let bValue: any;

    switch (sortOptions.field) {
      case 'priority':
        const priorityOrder = { high: 3, medium: 2, low: 1 };
        aValue = priorityOrder[a.priority] || 0;
        bValue = priorityOrder[b.priority] || 0;
        break;
      case 'dueDate':
        // Handle null/empty due dates by putting them at the end
        if (!a.dueDate || a.dueDate.trim() === '') {
          aValue = Number.MAX_SAFE_INTEGER;
        } else {
          aValue = new Date(a.dueDate).getTime();
          if (isNaN(aValue)) aValue = Number.MAX_SAFE_INTEGER;
        }
        if (!b.dueDate || b.dueDate.trim() === '') {
          bValue = Number.MAX_SAFE_INTEGER;
        } else {
          bValue = new Date(b.dueDate).getTime();
          if (isNaN(bValue)) bValue = Number.MAX_SAFE_INTEGER;
        }
        break;
      case 'createdAt':
        // Handle null/empty created dates
        if (!a.createdAt || a.createdAt.trim() === '') {
          aValue = 0;
        } else {
          aValue = new Date(a.createdAt).getTime();
          if (isNaN(aValue)) aValue = 0;
        }
        if (!b.createdAt || b.createdAt.trim() === '') {
          bValue = 0;
        } else {
          bValue = new Date(b.createdAt).getTime();
          if (isNaN(bValue)) bValue = 0;
        }
        break;
      case 'title':
        aValue = (a.title || '').toLowerCase();
        bValue = (b.title || '').toLowerCase();
        break;
      default:
        return 0;
    }

    // Handle the comparison based on sort direction
    if (sortOptions.direction === 'asc') {
      if (aValue < bValue) return -1;
      if (aValue > bValue) return 1;
      return 0;
    } else {
      // Descending
      if (aValue > bValue) return -1;
      if (aValue < bValue) return 1;
      return 0;
    }
  });

  return sortedTasks;
};

// Generate initials from name
export const getInitials = (name: string) => {
  return name
    .split(' ')
    .map((word) => word.charAt(0))
    .join('')
    .toUpperCase()
    .slice(0, 2);
};

// Generate random color for avatar
export const getRandomColor = () => {
  const colors = [
    'bg-red-500',
    'bg-blue-500',
    'bg-green-500',
    'bg-yellow-500',
    'bg-purple-500',
    'bg-pink-500',
    'bg-indigo-500',
    'bg-teal-500',
  ];
  return colors[Math.floor(Math.random() * colors.length)];
};

// Debounce function
export const debounce = <T extends (...args: any[]) => any>(
  func: T,
  wait: number
): ((...args: Parameters<T>) => void) => {
  let timeout: ReturnType<typeof setTimeout>;
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
};

// Generate unique ID
export const generateId = () => {
  return Math.random().toString(36).substr(2, 9);
};

// Get current timestamp
export const getCurrentTimestamp = () => {
  return new Date().toISOString();
}; 