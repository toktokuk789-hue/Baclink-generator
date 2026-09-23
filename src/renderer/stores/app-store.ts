import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface AppState {
  sidebarCollapsed: boolean;
  theme: 'dark' | 'light';
  currentProjectId: string | null;
  commandPaletteOpen: boolean;
  toggleSidebar: () => void;
  setTheme: (theme: 'dark' | 'light') => void;
  setCurrentProject: (id: string | null) => void;
  setCommandPaletteOpen: (open: boolean) => void;
}

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      sidebarCollapsed: false,
      theme: 'dark',
      currentProjectId: null,
      commandPaletteOpen: false,
      toggleSidebar: () => set((state) => ({ sidebarCollapsed: !state.sidebarCollapsed })),
      setTheme: (theme) => set({ theme }),
      setCurrentProject: (id) => set({ currentProjectId: id }),
      setCommandPaletteOpen: (open) => set({ commandPaletteOpen: open })
    }),
    { name: 'backlinkforge-app-store' }
  )
);