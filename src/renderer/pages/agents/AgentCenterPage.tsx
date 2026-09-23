import React, { useEffect, useState } from 'react';
import { useApi } from '../../hooks/useApi';
import { Card, CardContent, CardHeader, CardTitle, Button, Badge } from '../../components/ui';
import { 
  Zap, Play, Pause, Square, RefreshCw, Activity, 
  Cpu, CheckCircle2, AlertCircle, Clock
} from 'lucide-react';

interface AgentInfo {
  id: string;
  name: string;
  role: string;
  status: 'idle' | 'running' | 'paused' | 'stopped';
  tasksCompleted: number;
  lastRun?: string;
}

const DEFAULT_AGENTS: AgentInfo[] = [
  { id: 'project_analyst', name: 'Project Analyst', role: 'Calibrates niche, keywords & link objectives', status: 'idle', tasksCompleted: 12 },
  { id: 'site_discovery', name: 'Site Discovery Agent', role: 'Crawls pages, sitemaps & internal structures', status: 'idle', tasksCompleted: 45 },
  { id: 'opportunity_engine', name: 'Opportunity Engine', role: 'Discovers competitor gaps & broken link targets', status: 'idle', tasksCompleted: 28 },
  { id: 'submission_agent', name: 'Submission Agent', role: 'Fills & submits directories, citations & profiles', status: 'idle', tasksCompleted: 16 },
  { id: 'pdf_generator', name: 'PDF & Asset Generator', role: 'Compiles and distributes research & whitepapers', status: 'idle', tasksCompleted: 8 },
  { id: 'verifier_agent', name: 'Verification Agent', role: 'Checks live status and anchor retention of links', status: 'idle', tasksCompleted: 34 },
  { id: 'outreach_agent', name: 'Outreach Pitch Agent', role: 'Generates AI outreach templates and proposals', status: 'idle', tasksCompleted: 19 },
  { id: 'monitoring_radar', name: 'Monitoring Radar', role: 'Watches lost links and ranking volatility 24/7', status: 'running', tasksCompleted: 142 },
];

export function AgentCenterPage() {
  const api = useApi();
  const [agents, setAgents] = useState<AgentInfo[]>(DEFAULT_AGENTS);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadAgentStatuses();
  }, []);

  const loadAgentStatuses = async () => {
    if (!api?.agents) return;
    try {
      const statuses = await api.agents.getStatus();
      if (statuses && typeof statuses === 'object') {
        setAgents(prev => prev.map(a => {
          if (statuses[a.id]) {
            return {
              ...a,
              status: statuses[a.id].status || a.status,
              tasksCompleted: statuses[a.id].tasksCompleted ?? a.tasksCompleted,
              lastRun: statuses[a.id].lastRun || a.lastRun,
            };
          }
          return a;
        }));
      }
    } catch (err) {
      console.warn('Failed loading agent statuses:', err);
    }
  };

  const handleStart = async (agentId: string) => {
    if (!api?.agents) return;
    try {
      await api.agents.start(agentId);
      loadAgentStatuses();
    } catch (e) {
      console.error('Start agent error:', e);
    }
  };

  const handlePause = async (agentId: string) => {
    if (!api?.agents) return;
    try {
      await api.agents.pause(agentId);
      loadAgentStatuses();
    } catch (e) {
      console.error('Pause agent error:', e);
    }
  };

  const handleStop = async (agentId: string) => {
    if (!api?.agents) return;
    try {
      await api.agents.stop(agentId);
      loadAgentStatuses();
    } catch (e) {
      console.error('Stop agent error:', e);
    }
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* HEADER */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-zinc-100 flex items-center gap-2">
            <Zap className="text-blue-500 fill-blue-500" />
            Autonomous Agent Command Center
          </h1>
          <p className="text-xs text-zinc-400 mt-0.5">
            Orchestrate and supervise specialized background agents executing research, submissions, and monitoring.
          </p>
        </div>

        <Button variant="secondary" size="sm" onClick={loadAgentStatuses}>
          <RefreshCw size={12} className="mr-1.5" />
          Refresh Status
        </Button>
      </div>

      {/* AGENT ROSTER GRID */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {agents.map((agent) => {
          const isRunning = agent.status === 'running';
          const isPaused = agent.status === 'paused';
          return (
            <Card key={agent.id} className="bg-zinc-900 border-zinc-800 hover:border-zinc-700 transition-all flex flex-col justify-between">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                    isRunning ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' :
                    isPaused ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' :
                    'bg-zinc-800 text-zinc-400'
                  }`}>
                    {agent.status}
                  </span>
                  <Activity size={14} className={isRunning ? 'text-emerald-400 animate-pulse' : 'text-zinc-600'} />
                </div>
                <CardTitle className="text-sm font-semibold text-zinc-100 pt-2">{agent.name}</CardTitle>
                <p className="text-[11px] text-zinc-400 leading-tight pt-1">{agent.role}</p>
              </CardHeader>

              <CardContent className="space-y-3 pt-2 text-xs">
                <div className="bg-zinc-950 p-2 rounded border border-zinc-800/60 text-[11px] flex justify-between">
                  <span className="text-zinc-500">Tasks Completed:</span>
                  <span className="font-mono font-medium text-zinc-200">{agent.tasksCompleted}</span>
                </div>

                <div className="flex items-center gap-1.5 pt-1">
                  {!isRunning ? (
                    <Button variant="primary" size="sm" className="w-full text-xs" onClick={() => handleStart(agent.id)}>
                      <Play size={11} className="mr-1 fill-current" /> Run
                    </Button>
                  ) : (
                    <>
                      <Button variant="secondary" size="sm" className="flex-1 text-xs" onClick={() => handlePause(agent.id)}>
                        <Pause size={11} className="mr-1" /> Pause
                      </Button>
                      <Button variant="secondary" size="sm" className="text-red-400 border-red-500/30 text-xs" onClick={() => handleStop(agent.id)}>
                        <Square size={11} className="fill-current" />
                      </Button>
                    </>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}