import React, { useEffect, useState } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useAppStore } from '../stores/app-store';
import { useApi } from '../hooks/useApi';
import { cn } from '../lib/utils';
import { 
  LayoutDashboard, FolderKanban, Search, Link as LinkIcon, 
  Globe, Users, Lightbulb, Zap, CheckSquare, Chrome, 
  Mail, Activity, Settings, FileBarChart, Menu, Share2, Plus,
  ChevronDown, ExternalLink
} from 'lucide-react';

const navGroups = [
  {
    title: 'OVERVIEW',
    items: [
      { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
      { name: 'Projects', path: '/projects', icon: FolderKanban }
    ]
  },
  {
    title: 'RESEARCH',
    items: [
      { name: 'Site Explorer', path: '/site-explorer', icon: Search },
      { name: 'Backlinks', path: '/backlinks', icon: LinkIcon },
      { name: 'Domains', path: '/domains', icon: Globe },
      { name: 'Competitors', path: '/competitors', icon: Users }
    ]
  },
  {
    title: 'INTELLIGENCE',
    items: [
      { name: 'Opportunities', path: '/opportunities', icon: Lightbulb },
      { name: 'Link Gap', path: '/link-gap', icon: Zap, comingSoon: true }
    ]
  },
  {
    title: 'DISTRIBUTION',
    items: [
      { name: 'Submission & Assets', path: '/submissions', icon: Share2 },
      { name: 'Chrome Hub', path: '/chrome-hub', icon: Chrome }
    ]
  },
  {
    title: 'AUTOMATION',
    items: [
      { name: 'Agent Center', path: '/agent-center', icon: Zap },
      { name: 'Tasks', path: '/tasks', icon: CheckSquare }
    ]
  },
  {
    title: 'OUTREACH',
    items: [
      { name: 'Outreach', path: '/outreach', icon: Mail },
      { name: 'Monitoring', path: '/monitoring', icon: Activity }
    ]
  },
  {
    title: 'SYSTEM',
    items: [
      { name: 'Settings', path: '/settings', icon: Settings },
      { name: 'Reports', path: '/reports', icon: FileBarChart, comingSoon: true }
    ]
  }
];

export function AppLayout() {
  const { sidebarCollapsed, toggleSidebar, currentProjectId, setCurrentProjectId, setActiveProject, activeProject } = useAppStore();
  const api = useApi();
  const navigate = useNavigate();
  const [projects, setProjects] = useState<any[]>([]);

  useEffect(() => {
    loadProjects();
  }, [currentProjectId]);

  const loadProjects = async () => {
    if (!api?.projects) return;
    try {
      const list = await api.projects.getAll();
      if (Array.isArray(list)) {
        setProjects(list);
        if (list.length > 0) {
          if (!currentProjectId || !list.find(p => p.id === currentProjectId)) {
            setCurrentProjectId(list[0].id);
            setActiveProject(list[0]);
          } else {
            const current = list.find(p => p.id === currentProjectId);
            if (current) setActiveProject(current);
          }
        }
      }
    } catch (e) {
      console.warn('Could not load projects in layout:', e);
    }
  };

  const handleSelectProject = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value;
    if (val === '__new__') {
      navigate('/onboarding');
      return;
    }
    setCurrentProjectId(val);
    const proj = projects.find(p => p.id === val);
    if (proj) setActiveProject(proj);
  };

  return (
    <div className="flex h-screen w-full bg-[var(--background)] text-[var(--text-primary)] overflow-hidden">
      {/* SIDEBAR */}
      <div className={cn("flex flex-col border-r border-[var(--border)] bg-[var(--surface)] transition-all duration-300", sidebarCollapsed ? "w-16" : "w-60")}>
        <div className="h-10 flex items-center justify-between px-4 drag-region border-b border-[var(--border)]">
          {!sidebarCollapsed && <span className="font-bold text-sm tracking-wide text-zinc-100 flex items-center gap-1.5"><Zap size={14} className="text-blue-500 fill-blue-500" /> BacklinkForge</span>}
          {sidebarCollapsed && <div className="w-full flex justify-center"><Zap size={16} className="text-blue-500 fill-blue-500" /></div>}
        </div>
        
        <div className="flex-1 overflow-y-auto py-4 scrollbar-thin">
          {navGroups.map((group, i) => (
            <div key={i} className="mb-6">
              {!sidebarCollapsed && (
                <div className="px-4 mb-2 text-xs font-semibold text-[var(--text-muted)] tracking-wider">
                  {group.title}
                </div>
              )}
              <nav className="space-y-0.5 px-2">
                {group.items.map(item => (
                  <NavLink
                    key={item.name}
                    to={item.comingSoon ? '#' : item.path}
                    className={({ isActive }) => cn(
                      "flex items-center gap-3 px-2 py-1.5 rounded-md text-sm transition-colors no-drag",
                      isActive && !item.comingSoon ? "bg-blue-600/10 text-blue-400 font-medium" : "text-[var(--text-secondary)] hover:bg-[var(--surface-elevated)] hover:text-[var(--text-primary)]",
                      item.comingSoon && "opacity-50 cursor-not-allowed",
                      sidebarCollapsed && "justify-center px-0"
                    )}
                    title={sidebarCollapsed ? item.name : undefined}
                  >
                    <item.icon size={16} />
                    {!sidebarCollapsed && (
                      <span className="flex-1 truncate">{item.name}</span>
                    )}
                    {!sidebarCollapsed && item.comingSoon && (
                      <span className="text-[10px] bg-[var(--surface-elevated)] px-1.5 py-0.5 rounded text-[var(--text-muted)]">Soon</span>
                    )}
                  </NavLink>
                ))}
              </nav>
            </div>
          ))}
        </div>
      </div>

      {/* MAIN CONTAINER */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* TOP BAR / HEADER WITH PROJECT SELECTOR */}
        <div className="h-10 border-b border-[var(--border)] flex items-center justify-between px-4 drag-region bg-[var(--surface)]">
          <div className="flex items-center gap-3">
            <button 
              onClick={toggleSidebar} 
              className="no-drag p-1 rounded-md text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-elevated)] transition-colors"
            >
              <Menu size={16} />
            </button>

            {/* PROJECT SWITCHER */}
            <div className="no-drag flex items-center gap-2">
              <span className="text-[11px] font-medium text-zinc-500 hidden sm:inline">Project:</span>
              <div className="relative">
                <select
                  value={currentProjectId || ''}
                  onChange={handleSelectProject}
                  className="text-xs bg-zinc-900 border border-zinc-700/80 rounded px-2.5 py-1 text-zinc-200 focus:outline-none focus:border-blue-500 font-medium pr-6 cursor-pointer hover:border-zinc-500 transition-colors max-w-[200px] truncate"
                >
                  {projects.map(p => (
                    <option key={p.id} value={p.id}>{p.name || p.website_url}</option>
                  ))}
                  <option value="__new__">+ Create New Project...</option>
                </select>
                <ChevronDown size={12} className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none text-zinc-400" />
              </div>

              {activeProject?.website_url && (
                <span className="hidden md:flex items-center gap-1 text-[11px] text-zinc-400 font-mono bg-zinc-950 px-2 py-0.5 rounded border border-zinc-800">
                  <Globe size={11} className="text-zinc-500" />
                  {activeProject.website_url.replace(/^https?:\/\//, '').replace(/\/$/, '')}
                </span>
              )}
            </div>
          </div>

          <div className="no-drag flex items-center gap-2">
            <button
              onClick={() => navigate('/onboarding')}
              className="flex items-center gap-1.5 text-xs bg-blue-600 hover:bg-blue-500 text-white font-medium px-2.5 py-1 rounded transition-colors"
            >
              <Plus size={13} />
              <span className="hidden sm:inline">New Project</span>
            </button>
          </div>
        </div>
        
        <main className="flex-1 overflow-auto bg-[var(--background)] p-6 relative scrollbar-thin">
          <Outlet />
        </main>
      </div>
    </div>
  );
}