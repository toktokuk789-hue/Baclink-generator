import { ipcMain } from 'electron';
import { IPC } from '../../shared/ipc-channels';
import { CompetitorRepository } from '../database/repositories/competitors';
import { QueryOptions } from '../../shared/types';

export function registerCompetitorHandlers(repo: CompetitorRepository) {
  ipcMain.handle(IPC.COMPETITORS.GET_BY_PROJECT, async (_event, projectId: string, options?: QueryOptions) => {
    return repo.findByProject(projectId, options);
  });

  ipcMain.handle(IPC.COMPETITORS.CREATE, async (_event, data: any) => {
    return repo.create(data);
  });

  ipcMain.handle(IPC.COMPETITORS.UPDATE, async (_event, id: string, data: any) => {
    return repo.update(id, data);
  });

  ipcMain.handle(IPC.COMPETITORS.DELETE, async (_event, id: string) => {
    return repo.delete(id);
  });
}
