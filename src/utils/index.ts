import { format, isToday, isThisWeek, isThisMonth, isAfter, isBefore, parseISO } from 'date-fns';
import { Priority, Task, FilterOptions, SortOptions } from '../types';

// Date utilities
export const formatDate = (date: string) => {
  return format(new Date(date), 'MMM dd, yyyy');
};

export const formatDateTime = (date: string) => {
  return format(new Date(date), 'MMM dd, yyyy HH:mm');
};

export const isTaskOverdue = (dueDate: string) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0); // Set to start of day
  const due = parseISO(dueDate);
  return isBefore(due, today);
};

export const isTaskDueToday = (dueDate: string) => {
  return isToday(new Date(dueDate));
};

export const isTaskDueThisWeek = (dueDate: string) => {
  return isThisWeek(new Date(dueDate));
};

export const isTaskDueThisMonth = (dueDate: string) => {
  return isThisMonth(new Date(dueDate));
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
      const matchesCreatedBy = task.createdBy.toLowerCase().includes(searchLower);
      const matchesAssignedTo = task.assignedTo.toLowerCase().includes(searchLower);
      
      if (!matchesTitle && !matchesDescription && !matchesCreatedBy && !matchesAssignedTo) {
        return false;
      }
    }

    return true;
  });
};

// Sort utilities
export const sortTasks = (tasks: Task[], sortOptions: SortOptions) => {
  return [...tasks].sort((a, b) => {
    let aValue: any;
    let bValue: any;

    switch (sortOptions.field) {
      case 'priority':
        const priorityOrder = { high: 3, medium: 2, low: 1 };
        aValue = priorityOrder[a.priority];
        bValue = priorityOrder[b.priority];
        break;
      case 'dueDate':
        aValue = new Date(a.dueDate).getTime();
        bValue = new Date(b.dueDate).getTime();
        break;
      case 'createdAt':
        aValue = new Date(a.createdAt).getTime();
        bValue = new Date(b.createdAt).getTime();
        break;
      case 'title':
        aValue = a.title.toLowerCase();
        bValue = b.title.toLowerCase();
        break;
      default:
        return 0;
    }

    if (sortOptions.direction === 'asc') {
      return aValue > bValue ? 1 : -1;
    } else {
      return aValue < bValue ? 1 : -1;
    }
  });
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
  let timeout: NodeJS.Timeout;
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