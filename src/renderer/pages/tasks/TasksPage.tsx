import React, { useEffect, useState } from 'react';
import { useApi } from '../../hooks/useApi';
import { useAppStore } from '../../stores/app-store';
import { Card, CardContent, CardHeader, CardTitle, Button, Badge } from '../../components/ui';
import { 
  CheckSquare, ShieldCheck, Clock, CheckCircle2, XCircle, 
  RefreshCw, AlertTriangle, Play, ChevronRight
} from 'lucide-react';

export function TasksPage() {
  const api = useApi();
  const { currentProjectId } = useAppStore();

  const [activeTab, setActiveTab] = useState<'approvals' | 'tasks'>('approvals');
  const [approvals, setApprovals] = useState<any[]>([]);
  const [tasks, setTasks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (currentProjectId) {
      loadData();
    }
  }, [currentProjectId]);

  const loadData = async () => {
    if (!api || !currentProjectId) return;
    setLoading(true);
    try {
      if (api.approvals) {
        const appList = await api.approvals.getByProject(currentProjectId);
        setApprovals(appList || []);
      }
      if (api.agentTasks) {
        const tList = await api.agentTasks.getByProject(currentProjectId);
        setTasks(tList || []);
      }
    } catch (e) {
      console.error('Error loading tasks & approvals:', e);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (id: string) => {
    if (!api?.approvals) return;
    try {
      await api.approvals.update(id, 'approved');
      loadData();
    } catch (e) {
      console.error('Approval failed:', e);
    }
  };

  const handleReject = async (id: string) => {
    if (!api?.approvals) return;
    try {
      await api.approvals.update(id, 'rejected');
      loadData();
    } catch (e) {
      console.error('Rejection failed:', e);
    }
  };

  const pendingApprovals = approvals.filter(a => a.status === 'pending');

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* HEADER */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-zinc-100 flex items-center gap-2">
            <CheckSquare className="text-purple-500" />
            Task Center & Approvals
          </h1>
          <p className="text-xs text-zinc-400 mt-0.5">
            Review consequential agent actions requiring human authorization and inspect execution queues.
          </p>
        </div>

        <Button variant="secondary" size="sm" onClick={loadData}>
          <RefreshCw size={12} className="mr-1.5" />
          Refresh
        </Button>
      </div>

      {/* TABS */}
      <div className="flex border-b border-zinc-800">
        <button
          onClick={() => setActiveTab('approvals')}
          className={`pb-3 px-4 text-xs font-semibold border-b-2 flex items-center gap-2 transition-colors ${
            activeTab === 'approvals' ? 'border-purple-500 text-purple-400' : 'border-transparent text-zinc-400 hover:text-zinc-200'
          }`}
        >
          <ShieldCheck size={14} />
          Approvals Inbox
          {pendingApprovals.length > 0 && (
            <span className="px-1.5 py-0.2 rounded-full bg-purple-500 text-[10px] text-white">
              {pendingApprovals.length}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('tasks')}
          className={`pb-3 px-4 text-xs font-semibold border-b-2 flex items-center gap-2 transition-colors ${
            activeTab === 'tasks' ? 'border-purple-500 text-purple-400' : 'border-transparent text-zinc-400 hover:text-zinc-200'
          }`}
        >
          <Clock size={14} />
          Agent Execution Tasks ({tasks.length})
        </button>
      </div>

      {/* APPROVALS TAB */}
      {activeTab === 'approvals' && (
        <div className="space-y-4">
          {approvals.length === 0 ? (
            <Card className="bg-zinc-900 border-zinc-800 py-16 text-center text-xs text-zinc-500">
              <CheckCircle2 size={36} className="mx-auto text-emerald-500 mb-2" />
              <p>No actions require approval right now. Autonomous agents will ask here before external actions.</p>
            </Card>
          ) : (
            <div className="grid gap-3">
              {approvals.map((app) => (
                <Card key={app.id} className="bg-zinc-900 border-zinc-800 p-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                          app.status === 'pending' ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' :
                          app.status === 'approved' ? 'bg-emerald-500/10 text-emerald-400' :
                          'bg-red-500/10 text-red-400'
                        }`}>
                          {app.status}
                        </span>
                        <h4 className="text-sm font-semibold text-zinc-100">{app.title}</h4>
                      </div>
                      <p className="text-xs text-zinc-400">{app.description || app.proposed_action}</p>
                    </div>

                    {app.status === 'pending' && (
                      <div className="flex items-center gap-2 shrink-0">
                        <Button variant="secondary" size="sm" className="text-red-400 hover:bg-red-500/10" onClick={() => handleReject(app.id)}>
                          <XCircle size={13} className="mr-1" />
                          Reject
                        </Button>
                        <Button variant="primary" size="sm" onClick={() => handleApprove(app.id)}>
                          <CheckCircle2 size={13} className="mr-1" />
                          Approve Action
                        </Button>
                      </div>
                    )}
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TASKS TAB */}
      {activeTab === 'tasks' && (
        <Card className="bg-zinc-900 border-zinc-800">
          <CardContent className="p-0">
            {tasks.length === 0 ? (
              <div className="py-16 text-center text-xs text-zinc-500">
                <Clock size={36} className="mx-auto text-zinc-700 mb-2" />
                <p>No background tasks enqueued.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-zinc-300">
                  <thead className="bg-zinc-950/70 border-b border-zinc-800 text-[11px] uppercase tracking-wider text-zinc-400">
                    <tr>
                      <th className="py-3 px-4">Agent</th>
                      <th className="py-3 px-4">Task Objective</th>
                      <th className="py-3 px-4">Priority</th>
                      <th className="py-3 px-4">Status</th>
                      <th className="py-3 px-4">Time</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-800/60">
                    {tasks.map((t) => (
                      <tr key={t.id} className="hover:bg-zinc-800/30 transition-colors">
                        <td className="py-3 px-4 font-mono font-medium text-zinc-200">
                          {t.agent_type}
                        </td>
                        <td className="py-3 px-4 max-w-md text-zinc-300">
                          {t.objective}
                        </td>
                        <td className="py-3 px-4">
                          <span className="font-mono text-zinc-400">{t.priority}</span>
                        </td>
                        <td className="py-3 px-4">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                            t.status === 'completed' ? 'bg-emerald-500/10 text-emerald-400' :
                            t.status === 'running' ? 'bg-blue-500/10 text-blue-400' :
                            t.status === 'failed' ? 'bg-red-500/10 text-red-400' :
                            'bg-zinc-800 text-zinc-400'
                          }`}>
                            {t.status}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-zinc-500 text-[11px]">
                          {t.created_at ? new Date(t.created_at).toLocaleTimeString() : 'Recent'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}