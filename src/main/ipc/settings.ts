import { ipcMain } from 'electron';
import { IPC } from '../../shared/ipc-channels';
import { Database } from '../database/connection';
import { SettingRepository } from '../database/repositories/settings';

export function registerSettingsHandlers(db: Database) {
  const repository = new SettingRepository(db);

  ipcMain.handle(IPC.SETTINGS.GET, async (_event, key: string) => {
    return repository.get(key);
  });

  ipcMain.handle(IPC.SETTINGS.SET, async (_event, key: string, value: any) => {
    return repository.set(key, value);
  });

  ipcMain.handle(IPC.SETTINGS.GET_ALL, async (_event) => {
    return repository.getAll();
  });
}
