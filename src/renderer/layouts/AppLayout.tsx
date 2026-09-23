import React from 'react';
import { Outlet, NavLink } from 'react-router-dom';
import { useAppStore } from '../stores/app-store';
import { cn } from '../lib/utils';
import { 
  LayoutDashboard, FolderKanban, Search, Link as LinkIcon, 
  Globe, Users, Lightbulb, Zap, CheckSquare, Chrome, 
  Mail, Activity, Settings, FileBarChart, Menu, Share2 
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
  const { sidebarCollapsed, toggleSidebar } = useAppStore();

  return (
    <div className="flex h-screen w-full bg-[var(--background)] text-[var(--text-primary)] overflow-hidden">
      <div className={cn("flex flex-col border-r border-[var(--border)] bg-[var(--surface)] transition-all duration-300", sidebarCollapsed ? "w-16" : "w-60")}>
        <div className="h-10 flex items-center justify-between px-4 drag-region border-b border-[var(--border)]">
          {!sidebarCollapsed && <span className="font-bold text-sm tracking-wide">BacklinkForge</span>}
          {sidebarCollapsed && <div className="w-full flex justify-center"><Zap size={16} className="text-[var(--accent)]" /></div>}
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
                      isActive && !item.comingSoon ? "bg-[var(--accent)]/10 text-[var(--accent)] font-medium" : "text-[var(--text-secondary)] hover:bg-[var(--surface-elevated)] hover:text-[var(--text-primary)]",
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

      <div className="flex-1 flex flex-col min-w-0">
        <div className="h-10 border-b border-[var(--border)] flex items-center px-4 drag-region bg-[var(--surface)]">
          <button 
            onClick={toggleSidebar} 
            className="no-drag p-1 rounded-md text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-elevated)] transition-colors mr-4"
          >
            <Menu size={16} />
          </button>
          <div className="flex-1"></div>
        </div>
        
        <main className="flex-1 overflow-auto bg-[var(--background)] p-6 relative">
          <Outlet />
        </main>
      </div>
    </div>
  );
}