import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppStore } from '../../stores/app-store';
import { useApi } from '../../hooks/useApi';
import { Card, CardContent, CardHeader, CardTitle, Button, EmptyState } from '../../components/ui';
import { 
  FolderKanban, Link as LinkIcon, Lightbulb, CheckSquare, Plus, 
  Globe, Share2, Search, ArrowUpRight, ShieldCheck, Zap, RefreshCw, Mail
} from 'lucide-react';

export function DashboardPage() {
  const navigate = useNavigate();
  const api = useApi();
  const { currentProjectId, setCurrentProjectId, activeProject, setActiveProject } = useAppStore();

  const [loading, setLoading] = useState(true);
  const [projects, setProjects] = useState<any[]>([]);
  const [stats, setStats] = useState({
    totalBacklinks: 0,
    referringDomains: 0,
    opportunities: 0,
    pendingTasks: 0,
    submissionsTotal: 0,
    submissionsVerified: 0,
  });
  const [recentBacklinks, setRecentBacklinks] = useState<any[]>([]);

  useEffect(() => {
    loadDashboard();
  }, [currentProjectId]);

  const loadDashboard = async () => {
    if (!api) return;
    setLoading(true);
    try {
      // 1. Fetch projects
      const projectList = await api.projects.getAll();
      setProjects(projectList || []);

      if (projectList && projectList.length > 0) {
        const active = currentProjectId 
          ? projectList.find((p: any) => p.id === currentProjectId) || projectList[0]
          : projectList[0];

        if (active && (!currentProjectId || currentProjectId !== active.id)) {
          setCurrentProjectId(active.id);
          setActiveProject(active);
        }

        const targetId = active ? active.id : currentProjectId;

        if (targetId) {
          // 2. Fetch Backlinks stats
          const blCount = await api.backlinks.count(targetId);
          const refDoms = await api.backlinks.getReferringDomains(targetId);
          const oppCounts = await api.opportunities.countByStatus(targetId);
          const pendingTasks = await api.agentTasks.getPending(targetId);
          const subStats = await api.submissions.getStats(targetId);
          const recentBls = await api.backlinks.getByProject(targetId, { limit: 6, sortBy: 'created_at', sortDirection: 'desc' });

          const oppTotal = oppCounts ? Object.values(oppCounts).reduce((a: any, b: any) => Number(a) + Number(b), 0) : 0;

          setStats({
            totalBacklinks: blCount || 0,
            referringDomains: refDoms?.length || 0,
            opportunities: Number(oppTotal) || 0,
            pendingTasks: pendingTasks?.length || 0,
            submissionsTotal: subStats?.totalTargets || 0,
            submissionsVerified: subStats?.verifiedCount || 0,
          });

          setRecentBacklinks(recentBls || []);
        }
      }
    } catch (err) {
      console.error('Failed loading dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  if (!loading && projects.length === 0) {
    return (
      <div className="h-[80vh] flex flex-col items-center justify-center">
        <EmptyState 
          icon={<FolderKanban size={52} className="text-blue-500" />}
          title="Welcome to BacklinkForge"
          description="Create your first project with your website URL to begin automated crawling, backlink analysis, and opportunity discovery."
          actionLabel="Create Project"
          onAction={() => navigate('/onboarding')}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* HEADER WITH ACTIVE PROJECT SUMMARY */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-zinc-100 flex items-center gap-2">
            Intelligence Dashboard
          </h1>
          <p className="text-xs text-zinc-400 mt-1">
            Active Project: <span className="font-semibold text-zinc-200">{activeProject?.name || 'Main Project'}</span>
            {activeProject?.website_url && (
              <span className="ml-2 font-mono text-[11px] text-blue-400">({activeProject.website_url})</span>
            )}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="secondary" size="sm" onClick={loadDashboard}>
            <RefreshCw size={13} className="mr-1.5" />
            Refresh
          </Button>
          <Button variant="primary" size="sm" onClick={() => navigate('/onboarding')}>
            <Plus size={14} className="mr-1.5" />
            New Project
          </Button>
        </div>
      </div>

      {/* KPI METRIC CARDS */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="bg-zinc-900 border-zinc-800">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-medium text-zinc-400 uppercase tracking-wider">Total Backlinks</CardTitle>
            <LinkIcon className="h-4 w-4 text-blue-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-zinc-100">{stats.totalBacklinks.toLocaleString()}</div>
            <p className="text-[11px] text-zinc-500 mt-1">
              From <span className="text-zinc-300 font-medium">{stats.referringDomains}</span> referring domains
            </p>
          </CardContent>
        </Card>

        <Card className="bg-zinc-900 border-zinc-800">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-medium text-zinc-400 uppercase tracking-wider">Qualified Opportunities</CardTitle>
            <Lightbulb className="h-4 w-4 text-amber-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-amber-400">{stats.opportunities.toLocaleString()}</div>
            <p className="text-[11px] text-zinc-500 mt-1">Link gaps, broken links & resources</p>
          </CardContent>
        </Card>

        <Card className="bg-zinc-900 border-zinc-800">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-medium text-zinc-400 uppercase tracking-wider">Directory Submissions</CardTitle>
            <Share2 className="h-4 w-4 text-emerald-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-emerald-400">{stats.submissionsTotal.toLocaleString()}</div>
            <p className="text-[11px] text-zinc-500 mt-1">
              <span className="text-emerald-400 font-medium">{stats.submissionsVerified}</span> verified live citations
            </p>
          </CardContent>
        </Card>

        <Card className="bg-zinc-900 border-zinc-800">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-medium text-zinc-400 uppercase tracking-wider">Pending Approvals</CardTitle>
            <CheckSquare className="h-4 w-4 text-purple-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-400">{stats.pendingTasks}</div>
            <p className="text-[11px] text-zinc-500 mt-1">Autonomous actions awaiting review</p>
          </CardContent>
        </Card>
      </div>

      {/* QUICK LAUNCH ACTION BAR */}
      <div className="p-4 rounded-lg bg-zinc-900/80 border border-zinc-800">
        <div className="text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-3">Quick Actions</div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          <button
            onClick={() => navigate('/site-explorer')}
            className="flex flex-col items-center justify-center p-3 rounded bg-zinc-950/60 border border-zinc-800/80 hover:border-blue-500/50 hover:bg-zinc-950 transition-all text-center group"
          >
            <Search size={18} className="text-blue-400 mb-1.5 group-hover:scale-110 transition-transform" />
            <span className="text-xs font-medium text-zinc-200">Crawl Website</span>
            <span className="text-[10px] text-zinc-500">Site Explorer</span>
          </button>

          <button
            onClick={() => navigate('/opportunities')}
            className="flex flex-col items-center justify-center p-3 rounded bg-zinc-950/60 border border-zinc-800/80 hover:border-amber-500/50 hover:bg-zinc-950 transition-all text-center group"
          >
            <Lightbulb size={18} className="text-amber-400 mb-1.5 group-hover:scale-110 transition-transform" />
            <span className="text-xs font-medium text-zinc-200">Find Opportunities</span>
            <span className="text-[10px] text-zinc-500">Link Engine</span>
          </button>

          <button
            onClick={() => navigate('/backlinks')}
            className="flex flex-col items-center justify-center p-3 rounded bg-zinc-950/60 border border-zinc-800/80 hover:border-emerald-500/50 hover:bg-zinc-950 transition-all text-center group"
          >
            <LinkIcon size={18} className="text-emerald-400 mb-1.5 group-hover:scale-110 transition-transform" />
            <span className="text-xs font-medium text-zinc-200">Manage Backlinks</span>
            <span className="text-[10px] text-zinc-500">Import & Export</span>
          </button>

          <button
            onClick={() => navigate('/submissions')}
            className="flex flex-col items-center justify-center p-3 rounded bg-zinc-950/60 border border-zinc-800/80 hover:border-purple-500/50 hover:bg-zinc-950 transition-all text-center group"
          >
            <Share2 size={18} className="text-purple-400 mb-1.5 group-hover:scale-110 transition-transform" />
            <span className="text-xs font-medium text-zinc-200">Submit Listings</span>
            <span className="text-[10px] text-zinc-500">Directory & PDF</span>
          </button>

          <button
            onClick={() => navigate('/outreach')}
            className="flex flex-col items-center justify-center p-3 rounded bg-zinc-950/60 border border-zinc-800/80 hover:border-orange-500/50 hover:bg-zinc-950 transition-all text-center group"
          >
            <Mail size={18} className="text-orange-400 mb-1.5 group-hover:scale-110 transition-transform" />
            <span className="text-xs font-medium text-zinc-200">AI Outreach</span>
            <span className="text-[10px] text-zinc-500">Pitch Generator</span>
          </button>
        </div>
      </div>

      {/* RECENT BACKLINKS & PROJECT INTELLIGENCE */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* RECENT BACKLINKS */}
        <Card className="lg:col-span-2 bg-zinc-900 border-zinc-800">
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <CardTitle className="text-sm font-semibold text-zinc-200">Recent Backlinks</CardTitle>
            <Button variant="secondary" size="sm" onClick={() => navigate('/backlinks')}>
              View All
              <ArrowUpRight size={13} className="ml-1" />
            </Button>
          </CardHeader>
          <CardContent>
            {recentBacklinks.length === 0 ? (
              <div className="py-8 text-center text-xs text-zinc-500">
                No backlinks recorded yet for this project. Use "Manage Backlinks" to add or import via CSV.
              </div>
            ) : (
              <div className="divide-y divide-zinc-800/60 overflow-x-auto">
                {recentBacklinks.map((bl) => (
                  <div key={bl.id} className="py-2.5 flex items-center justify-between text-xs gap-3">
                    <div className="min-w-0 flex-1">
                      <div className="font-mono text-zinc-200 truncate">{bl.source_url}</div>
                      <div className="text-[11px] text-zinc-500 flex items-center gap-2 mt-0.5">
                        <span>Anchor: <strong className="text-zinc-400">{bl.anchor_text || '(none)'}</strong></span>
                        <span>•</span>
                        <span>{bl.is_dofollow ? 'DoFollow' : 'NoFollow'}</span>
                      </div>
                    </div>
                    <div className="shrink-0 text-right">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-medium ${
                        bl.status === 'active' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-400'
                      }`}>
                        {bl.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* ACTIVE PROJECT OVERVIEW */}
        <Card className="bg-zinc-900 border-zinc-800">
          <CardHeader>
            <CardTitle className="text-sm font-semibold text-zinc-200 flex items-center gap-2">
              <ShieldCheck size={16} className="text-blue-400" />
              Project Calibration
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-xs">
            <div>
              <span className="text-zinc-500">Target URL:</span>
              <div className="font-mono text-zinc-200 truncate mt-0.5">{activeProject?.website_url || 'None'}</div>
            </div>
            <div>
              <span className="text-zinc-500">Business Name:</span>
              <div className="text-zinc-200 font-medium mt-0.5">{activeProject?.business_name || activeProject?.name || 'None'}</div>
            </div>
            <div>
              <span className="text-zinc-500">Industry & Focus:</span>
              <div className="text-zinc-200 mt-0.5">{activeProject?.industry || 'General Digital'}</div>
            </div>
            <div>
              <span className="text-zinc-500">Automation Mode:</span>
              <div className="mt-0.5">
                <span className="px-2 py-0.5 rounded bg-blue-500/10 text-blue-400 font-medium text-[11px] uppercase">
                  {activeProject?.automation_mode || 'assisted'}
                </span>
              </div>
            </div>
            <div className="pt-2 border-t border-zinc-800">
              <Button variant="secondary" size="sm" className="w-full" onClick={() => navigate('/projects')}>
                Manage Projects
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}