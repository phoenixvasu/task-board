export type Priority = 'low' | 'medium' | 'high';

export type Task = {
  id: string;
  title: string;
  description: string;
  createdBy: string;
  assignedTo: string;
  priority: Priority;
  dueDate: string;
  createdAt: string;
  updatedAt: string;
};

export type Column = {
  id: string;
  name: string;
  taskIds: string[];
  createdAt: string;
  updatedAt: string;
};

export type Board = {
  id: string;
  name: string;
  description?: string;
  columns: Column[];
  tasks: Record<string, Task>;
  createdAt: string;
  updatedAt: string;
};

export type User = {
  id: string;
  name: string;
  email: string;
  avatar?: string;
};

export type AuthState = {
  user: User | null;
  isAuthenticated: boolean;
};

export type FilterOptions = {
  priority?: Priority;
  assignedTo?: string;
  dueDate?: 'overdue' | 'today' | 'this-week' | 'this-month';
  search?: string;
};

export type SortOptions = {
  field: 'priority' | 'dueDate' | 'createdAt' | 'title';
  direction: 'asc' | 'desc';
}; 