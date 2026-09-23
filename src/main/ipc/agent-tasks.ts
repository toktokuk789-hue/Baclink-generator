import { ipcMain } from 'electron';
import { IPC } from '../../shared/ipc-channels';
import { AgentTaskRepository } from '../database/repositories/agent-tasks';
import { QueryOptions } from '../../shared/types';

export function registerAgentTaskHandlers(repo: AgentTaskRepository) {
  ipcMain.handle(IPC.AGENT_TASKS.GET_BY_PROJECT, async (_event, projectId: string, options?: QueryOptions) => {
    return repo.findByProject(projectId, options);
  });

  ipcMain.handle(IPC.AGENT_TASKS.CREATE, async (_event, data: any) => {
    return repo.create(data);
  });

  ipcMain.handle(IPC.AGENT_TASKS.UPDATE_STATUS, async (_event, id: string, status: any) => {
    return repo.updateStatus(id, status);
  });

  ipcMain.handle(IPC.AGENT_TASKS.GET_PENDING, async (_event, projectId: string) => {
    const all = repo.findByProject(projectId, { status: 'queued' });
    return all;
  });
}
