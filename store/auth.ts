import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type User = {
  id: string;
  name: string | null;
  email: string;
  username: string | null;
  image: string | null;
  bio: string | null;

  // Role & Permissions
  roleId: string | null;
  roleName: string | null;
  roleLevel: number;
  permissions: string[];

  // Profile fields (optional)
  location?: string | null;
  website?: string | null;
  twitter?: string | null;
  github?: string | null;
  linkedin?: string | null;

  // Settings
  language?: string;
  timezone?: string;
  emailNotifications?: boolean;
  pushNotifications?: boolean;
};

type AuthState = {
  user: User | null;
  isLoggedIn: boolean;
  rememberMe: boolean;
  isInitialized: boolean;
};

type Actions = {
  setAuth: (payload: { user: User; rememberMe?: boolean }) => void;
  updateUser: (updates: Partial<User>) => void;
  clearAuth: () => void;
  setInitialized: (value: boolean) => void;
};

export const useUserStore = create<AuthState & Actions>()(
  persist(
    set => ({
      user: null,
      isLoggedIn: false,
      rememberMe: false,
      isInitialized: false,

      setAuth: ({ user, rememberMe = false }) => {
        set({
          user,
          isLoggedIn: true,
          rememberMe,
          isInitialized: true,
        });
      },

      updateUser: updates => {
        set(state => ({
          user: state.user ? { ...state.user, ...updates } : null,
        }));
      },

      clearAuth: () => {
        set({
          user: null,
          isLoggedIn: false,
          rememberMe: false,
        });
      },

      setInitialized: value => {
        set({ isInitialized: value });
      },
    }),
    {
      name: 'user-store',
      partialize: state => ({
        user: state.user,
        isLoggedIn: state.isLoggedIn,
        rememberMe: state.rememberMe,
      }),
    },
  ),
);
