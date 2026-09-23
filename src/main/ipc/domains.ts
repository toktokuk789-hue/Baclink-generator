import { ipcMain } from 'electron';
import { IPC } from '../../shared/ipc-channels';
import { DomainRepository } from '../database/repositories/domains';
import { QueryOptions } from '../../shared/types';

export function registerDomainHandlers(repo: DomainRepository) {
  ipcMain.handle(IPC.DOMAINS.GET_BY_PROJECT, async (_event, projectId: string, options?: QueryOptions) => {
    return repo.findByProject(projectId, options);
  });

  ipcMain.handle(IPC.DOMAINS.CREATE, async (_event, data: any) => {
    return repo.create(data);
  });

  ipcMain.handle(IPC.DOMAINS.UPDATE, async (_event, id: string, data: any) => {
    return repo.update(id, data);
  });
}
