import { ipcMain } from 'electron';
import { IPC } from '../../shared/ipc-channels';
import { ApprovalRepository } from '../database/repositories/approvals';
import { QueryOptions } from '../../shared/types';

export function registerApprovalHandlers(repo: ApprovalRepository) {
  ipcMain.handle(IPC.APPROVALS.GET_BY_PROJECT, async (_event, projectId: string, options?: QueryOptions) => {
    return repo.findByProject(projectId, options);
  });

  ipcMain.handle(IPC.APPROVALS.CREATE, async (_event, data: any) => {
    return repo.create(data);
  });

  ipcMain.handle(IPC.APPROVALS.UPDATE, async (_event, id: string, status: string) => {
    return repo.update(id, {
      status: status as any,
      decided_at: new Date().toISOString(),
      decided_by: 'user',
    });
  });
}
