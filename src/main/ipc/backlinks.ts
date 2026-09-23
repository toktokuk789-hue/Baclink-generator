import { ipcMain } from 'electron';
import { IPC } from '../../shared/ipc-channels';
import { Database } from '../database/connection';
import { QueryOptions } from '../../shared/types';
import { BacklinkRepository } from '../database/repositories/backlinks';

export function registerBacklinkHandlers(db: Database) {
  const repository = new BacklinkRepository(db);

  ipcMain.handle(IPC.BACKLINKS.GET_BY_PROJECT, async (_event, projectId: string, options?: QueryOptions) => {
    return repository.findByProject(projectId, options);
  });

  ipcMain.handle(IPC.BACKLINKS.CREATE, async (_event, data: any) => {
    return repository.create(data);
  });

  ipcMain.handle(IPC.BACKLINKS.BULK_CREATE, async (_event, data: any[]) => {
    return repository.bulkCreate(data);
  });

  ipcMain.handle(IPC.BACKLINKS.COUNT, async (_event, projectId: string) => {
    return repository.count(projectId);
  });

  ipcMain.handle(IPC.BACKLINKS.GET_REFERRING_DOMAINS, async (_event, projectId: string) => {
    return repository.getReferringDomains(projectId);
  });
}
