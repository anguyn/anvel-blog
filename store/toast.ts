import { create } from 'zustand';

interface ToastStore {
  message: string | null;
  type: 'success' | 'error' | 'info' | 'warning';
  showToast: (msg: string, type?: ToastStore['type']) => void;
  clear: () => void;
}

export const useToastStore = create<ToastStore>(set => ({
  message: null,
  type: 'info',
  showToast: (message, type = 'info') => set({ message, type }),
  clear: () => set({ message: null }),
}));
