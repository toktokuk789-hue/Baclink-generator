import { ipcMain } from 'electron';
import { IPC } from '../../shared/ipc-channels';
import { Database } from '../database/connection';
import { QueryOptions } from '../../shared/types';
import { OpportunityRepository } from '../database/repositories/opportunities';

export function registerOpportunityHandlers(db: Database) {
  const repository = new OpportunityRepository(db);

  ipcMain.handle(IPC.OPPORTUNITIES.GET_BY_PROJECT, async (_event, projectId: string, options?: QueryOptions) => {
    return repository.findByProject(projectId, options);
  });

  ipcMain.handle(IPC.OPPORTUNITIES.CREATE, async (_event, data: any) => {
    return repository.create(data);
  });

  ipcMain.handle(IPC.OPPORTUNITIES.UPDATE, async (_event, id: string, data: any) => {
    return repository.update(id, data);
  });

  ipcMain.handle(IPC.OPPORTUNITIES.COUNT_BY_STATUS, async (_event, projectId: string) => {
    return repository.countByStatus(projectId);
  });
}
