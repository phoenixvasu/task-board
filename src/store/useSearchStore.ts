import { create } from 'zustand';

interface SearchState {
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  reset: () => void;
  page: 'boards' | 'tasks';
  setPage: (page: 'boards' | 'tasks') => void;
}

export const useSearchStore = create<SearchState>((set) => ({
  searchTerm: '',
  setSearchTerm: (term) => set({ searchTerm: term }),
  reset: () => set({ searchTerm: '' }),
  page: 'boards',
  setPage: (page) => set({ page }),
})); 