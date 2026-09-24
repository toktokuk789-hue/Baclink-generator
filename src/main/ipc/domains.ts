import { ipcMain } from 'electron';
import { IPC } from '../../shared/ipc-channels';
import { DomainRepository } from '../database/repositories/domains';
import { DomainInspectorService } from '../services/domain-inspector';
import { QueryOptions } from '../../shared/types';

export function registerDomainHandlers(repo: DomainRepository) {
  const inspector = new DomainInspectorService();

  ipcMain.handle(IPC.DOMAINS.GET_BY_PROJECT, async (_event, projectId: string, options?: QueryOptions) => {
    return repo.findByProject(projectId, options);
  });

  ipcMain.handle(IPC.DOMAINS.CREATE, async (_event, data: any) => {
    return repo.upsertDomain(data);
  });

  ipcMain.handle(IPC.DOMAINS.UPDATE, async (_event, id: string, data: any) => {
    return repo.update(id, data);
  });

  ipcMain.handle(IPC.DOMAINS.DELETE, async (_event, id: string) => {
    return repo.delete(id);
  });

  ipcMain.handle(IPC.DOMAINS.INSPECT, async (_event, domain: string, projectContext?: any) => {
    return inspector.inspect(domain, projectContext);
  });
}
