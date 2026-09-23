import { ipcMain } from 'electron';
import { IPC } from '../../shared/ipc-channels';
import { MonitoringRepository } from '../database/repositories/monitoring';
import { QueryOptions } from '../../shared/types';

export function registerMonitoringHandlers(repo: MonitoringRepository) {
  ipcMain.handle(IPC.MONITORING.GET_BY_PROJECT, async (_event, projectId: string, options?: QueryOptions) => {
    return repo.findByProject(projectId, options);
  });

  ipcMain.handle(IPC.MONITORING.GET_RECENT, async (_event, projectId: string, limit?: number) => {
    return repo.getRecent(projectId, limit || 20);
  });
}
