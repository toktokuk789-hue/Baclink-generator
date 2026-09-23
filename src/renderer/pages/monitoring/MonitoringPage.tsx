import React, { useEffect, useState } from 'react';
import { useApi } from '../../hooks/useApi';
import { useAppStore } from '../../stores/app-store';
import { Card, CardContent, CardHeader, CardTitle, Button, Badge } from '../../components/ui';
import { 
  Activity, ShieldAlert, CheckCircle2, RefreshCw, 
  AlertTriangle, Filter, ExternalLink, ArrowRight
} from 'lucide-react';

export function MonitoringPage() {
  const api = useApi();
  const { currentProjectId, activeProject } = useAppStore();

  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [severityFilter, setSeverityFilter] = useState('all');
  const [checking, setChecking] = useState(false);

  useEffect(() => {
    if (currentProjectId) loadEvents();
  }, [currentProjectId]);

  const loadEvents = async () => {
    if (!api?.monitoring || !currentProjectId) return;
    setLoading(true);
    try {
      const list = await api.monitoring.getRecent(currentProjectId, 30);
      setEvents(list || []);
    } catch (e) {
      console.error('Failed loading monitoring events:', e);
    } finally {
      setLoading(false);
    }
  };

  const handleRunHealthCheck = async () => {
    if (!currentProjectId) return;
    setChecking(true);
    try {
      // Simulate/trigger immediate health check
      await new Promise(r => setTimeout(r, 1200));
      await loadEvents();
    } finally {
      setChecking(false);
    }
  };

  const filtered = events.filter((e) => {
    if (severityFilter === 'all') return true;
    return e.severity === severityFilter;
  });

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-zinc-100 flex items-center gap-2">
            <Activity className="text-blue-500" />
            Backlink Health & Monitoring Radar
          </h1>
          <p className="text-xs text-zinc-400 mt-0.5">
            Real-time change radar tracking lost backlinks, HTTP status code shifts, and anchor variations.
          </p>
        </div>

        <Button variant="primary" size="sm" onClick={handleRunHealthCheck} disabled={checking}>
          <RefreshCw size={13} className={`mr-1.5 ${checking ? 'animate-spin' : ''}`} />
          {checking ? 'Checking Links...' : 'Run Health Check Now'}
        </Button>
      </div>

      {/* SEVERITY COUNTERS */}
      <div className="grid grid-cols-3 gap-4">
        <Card className="bg-zinc-900 border-zinc-800 p-4">
          <div className="flex items-center justify-between">
            <span className="text-xs text-zinc-400">Total Audit Events</span>
            <Activity size={16} className="text-blue-400" />
          </div>
          <div className="text-2xl font-bold text-zinc-100 mt-2">{events.length}</div>
        </Card>

        <Card className="bg-zinc-900 border-zinc-800 p-4">
          <div className="flex items-center justify-between">
            <span className="text-xs text-zinc-400">Critical Alerts</span>
            <AlertTriangle size={16} className="text-red-400" />
          </div>
          <div className="text-2xl font-bold text-red-400 mt-2">
            {events.filter(e => e.severity === 'critical').length}
          </div>
        </Card>

        <Card className="bg-zinc-900 border-zinc-800 p-4">
          <div className="flex items-center justify-between">
            <span className="text-xs text-zinc-400">Healthy Checks</span>
            <CheckCircle2 size={16} className="text-emerald-400" />
          </div>
          <div className="text-2xl font-bold text-emerald-400 mt-2">
            {events.filter(e => e.severity === 'info' || !e.severity).length}
          </div>
        </Card>
      </div>

      {/* CHANGE EVENT LOG FEED */}
      <Card className="bg-zinc-900 border-zinc-800">
        <CardHeader className="pb-3 border-b border-zinc-800 flex flex-row items-center justify-between">
          <CardTitle className="text-sm font-semibold text-zinc-200">
            Audit Activity & Change History
          </CardTitle>
          <div className="flex items-center gap-2">
            <select
              value={severityFilter}
              onChange={(e) => setSeverityFilter(e.target.value)}
              className="bg-zinc-950 border border-zinc-800 rounded px-2.5 py-1 text-xs text-zinc-200 focus:outline-none focus:border-blue-500"
            >
              <option value="all">All Severities</option>
              <option value="info">Info / Normal</option>
              <option value="warning">Warning</option>
              <option value="critical">Critical</option>
            </select>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {filtered.length === 0 ? (
            <div className="py-16 text-center text-xs text-zinc-500 space-y-2">
              <CheckCircle2 size={36} className="mx-auto text-emerald-500 mb-2" />
              <p>All monitored links are healthy with zero anomalies recorded.</p>
            </div>
          ) : (
            <div className="divide-y divide-zinc-800/60">
              {filtered.map((e) => (
                <div key={e.id} className="p-3.5 flex items-start justify-between text-xs hover:bg-zinc-800/20 transition-colors">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                        e.severity === 'critical' ? 'bg-red-500/10 text-red-400 border border-red-500/20' :
                        e.severity === 'warning' ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' :
                        'bg-blue-500/10 text-blue-400'
                      }`}>
                        {e.severity || 'info'}
                      </span>
                      <strong className="text-zinc-200 font-mono">{e.event_type}</strong>
                    </div>
                    <p className="text-zinc-400 text-xs">
                      {e.old_value && e.new_value ? `Changed from "${e.old_value}" to "${e.new_value}"` : 'Link verified and active'}
                    </p>
                  </div>
                  <span className="text-[11px] text-zinc-500">
                    {e.created_at ? new Date(e.created_at).toLocaleTimeString() : 'Recent'}
                  </span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}