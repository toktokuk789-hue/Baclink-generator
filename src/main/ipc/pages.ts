import { ipcMain } from 'electron';
import { IPC } from '../../shared/ipc-channels';
import { PageRepository } from '../database/repositories/pages';
import { QueryOptions } from '../../shared/types';

export function registerPageHandlers(repo: PageRepository) {
  ipcMain.handle(IPC.PAGES.GET_BY_PROJECT, async (_event, projectId: string, options?: QueryOptions) => {
    return repo.findByProject(projectId, options);
  });

  ipcMain.handle(IPC.PAGES.CREATE, async (_event, data: any) => {
    return repo.create(data);
  });
}
