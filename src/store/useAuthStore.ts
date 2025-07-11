import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { User, AuthState } from '../types';
import { api } from '../api';

interface AuthStore extends AuthState {
  token: string | null;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  register: (name: string, email: string, password: string, avatar?: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  updateUser: (updates: Partial<User>) => void;
}

export const useAuthStore = create<AuthStore>()(
  persist(
    (set, get) => ({
      user: null,
      isAuthenticated: false,
      token: null,

      login: async (email, password) => {
        try {
          const res = await api.post('/auth/login', { email, password });
          if (res.token && res.user) {
            set({
              user: res.user,
              isAuthenticated: true,
              token: res.token,
            });
            localStorage.setItem('jwt', res.token);
            return { success: true };
          } else {
            return { success: false, error: res.message || 'Login failed' };
          }
        } catch (err: any) {
          return { success: false, error: err.message || 'Login failed' };
        }
      },

      register: async (name, email, password, avatar) => {
        try {
          const res = await api.post('/auth/register', { name, email, password, avatar });
          if (res.user) {
            // Auto-login after register
            const loginRes = await get().login(email, password);
            if (loginRes.success) return { success: true };
            return { success: false, error: loginRes.error };
          } else {
            return { success: false, error: res.message || 'Registration failed' };
          }
        } catch (err: any) {
          return { success: false, error: err.message || 'Registration failed' };
        }
      },

      logout: () => {
        set({
          user: null,
          isAuthenticated: false,
          token: null,
        });
        localStorage.removeItem('jwt');
      },

      updateUser: (updates: Partial<User>) => {
        set((state) => ({
          user: state.user ? { ...state.user, ...updates } : null,
        }));
      },
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({
        user: state.user,
        isAuthenticated: state.isAuthenticated,
        token: state.token,
      }),
    }
  )
); 