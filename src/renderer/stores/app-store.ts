import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface ProjectSummary {
  id: string;
  name: string;
  website_url?: string;
  business_name?: string;
  industry?: string;
  automation_mode?: string;
}

interface AppState {
  sidebarCollapsed: boolean;
  theme: 'dark' | 'light';
  currentProjectId: string | null;
  activeProject: ProjectSummary | null;
  commandPaletteOpen: boolean;
  toggleSidebar: () => void;
  setTheme: (theme: 'dark' | 'light') => void;
  setCurrentProject: (id: string | null) => void;
  setCurrentProjectId: (id: string | null) => void;
  setActiveProject: (project: ProjectSummary | null) => void;
  setCommandPaletteOpen: (open: boolean) => void;
}

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      sidebarCollapsed: false,
      theme: 'dark',
      currentProjectId: null,
      activeProject: null,
      commandPaletteOpen: false,
      toggleSidebar: () => set((state) => ({ sidebarCollapsed: !state.sidebarCollapsed })),
      setTheme: (theme) => set({ theme }),
      setCurrentProject: (id) => set({ currentProjectId: id }),
      setCurrentProjectId: (id) => set({ currentProjectId: id }),
      setActiveProject: (project) => set({ 
        activeProject: project, 
        currentProjectId: project ? project.id : null 
      }),
      setCommandPaletteOpen: (open) => set({ commandPaletteOpen: open })
    }),
    { name: 'backlinkforge-app-store' }
  )
);