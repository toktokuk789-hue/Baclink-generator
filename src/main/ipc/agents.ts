import { ipcMain } from 'electron';
import { IPC } from '../../shared/ipc-channels';
import { AgentOrchestrator } from '../agents/orchestrator';

const AGENT_STATUSES: Record<string, { status: string; lastRun?: string; tasksCompleted: number }> = {
  project_analyst: { status: 'idle', tasksCompleted: 12 },
  site_discovery: { status: 'idle', tasksCompleted: 45 },
  opportunity_engine: { status: 'idle', tasksCompleted: 28 },
  submission_agent: { status: 'idle', tasksCompleted: 16 },
  pdf_generator: { status: 'idle', tasksCompleted: 8 },
  verifier_agent: { status: 'idle', tasksCompleted: 34 },
  outreach_agent: { status: 'idle', tasksCompleted: 19 },
  monitoring_radar: { status: 'running', tasksCompleted: 142 },
};

export function registerAgentHandlers() {
  const orchestrator = AgentOrchestrator.getInstance();

  ipcMain.handle(IPC.AGENTS.GET_STATUS, async (_event, agentId?: string) => {
    if (agentId && AGENT_STATUSES[agentId]) {
      return AGENT_STATUSES[agentId];
    }
    return AGENT_STATUSES;
  });

  ipcMain.handle(IPC.AGENTS.START, async (_event, agentId: string) => {
    if (AGENT_STATUSES[agentId]) {
      AGENT_STATUSES[agentId].status = 'running';
      AGENT_STATUSES[agentId].lastRun = new Date().toISOString();
    }
    return { success: true, agent: AGENT_STATUSES[agentId] };
  });

  ipcMain.handle(IPC.AGENTS.STOP, async (_event, agentId: string) => {
    if (AGENT_STATUSES[agentId]) {
      AGENT_STATUSES[agentId].status = 'stopped';
    }
    return { success: true, agent: AGENT_STATUSES[agentId] };
  });

  ipcMain.handle(IPC.AGENTS.PAUSE, async (_event, agentId: string) => {
    if (AGENT_STATUSES[agentId]) {
      AGENT_STATUSES[agentId].status = 'paused';
    }
    return { success: true, agent: AGENT_STATUSES[agentId] };
  });

  ipcMain.handle(IPC.AGENTS.RESUME, async (_event, agentId: string) => {
    if (AGENT_STATUSES[agentId]) {
      AGENT_STATUSES[agentId].status = 'running';
      AGENT_STATUSES[agentId].lastRun = new Date().toISOString();
    }
    return { success: true, agent: AGENT_STATUSES[agentId] };
  });
}
