import { ipcMain } from 'electron';
import { IPC } from '../../shared/ipc-channels';
import { Database } from '../database/connection';
import { QueryOptions } from '../../shared/types';
import { ProjectRepository } from '../database/repositories/projects';

export function registerProjectHandlers(db: Database) {
  const repository = new ProjectRepository(db);

  ipcMain.handle(IPC.PROJECTS.GET_ALL, async (_event, options?: QueryOptions) => {
    return repository.findAll(options);
  });

  ipcMain.handle(IPC.PROJECTS.GET_BY_ID, async (_event, id: string) => {
    return repository.findById(id);
  });

  ipcMain.handle(IPC.PROJECTS.CREATE, async (_event, data: any) => {
    return repository.create(data);
  });

  ipcMain.handle(IPC.PROJECTS.UPDATE, async (_event, id: string, data: any) => {
    return repository.update(id, data);
  });

  ipcMain.handle(IPC.PROJECTS.DELETE, async (_event, id: string) => {
    return repository.delete(id);
  });
}
