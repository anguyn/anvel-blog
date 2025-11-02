import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface UIStore {
  isSidebarOpen: boolean;
  toggleSidebar: () => void;
  setSidebarOpen: (open: boolean) => void;
  isCreateModalOpen: boolean;
  toggleCreateModal: () => void;
  isHeaderVisible: boolean;
  setIsHeaderVisible: (visible: boolean) => void;
}

export const useUIStore = create<UIStore>(set => ({
  isSidebarOpen: false,
  toggleSidebar: () => set(state => ({ isSidebarOpen: !state.isSidebarOpen })),
  setSidebarOpen: open => set({ isSidebarOpen: open }),
  isCreateModalOpen: false,
  toggleCreateModal: () =>
    set(state => ({ isCreateModalOpen: !state.isCreateModalOpen })),
  isHeaderVisible: true,
  setIsHeaderVisible: visible => set({ isHeaderVisible: visible }),
}));
