import { ipcMain, dialog } from 'electron';
import { IPC } from '../../shared/ipc-channels';
import { ImportExportService } from '../services/import-export';
import { BacklinkRepository } from '../database/repositories/backlinks';
import fs from 'fs';

export function registerImportExportHandlers(backlinkRepo: BacklinkRepository) {
  const service = new ImportExportService();

  ipcMain.handle(IPC.IMPORT.CSV, async (_event, filePath?: string, mapping?: any) => {
    let targetPath = filePath;
    if (!targetPath) {
      const dialogRes = await dialog.showOpenDialog({
        title: 'Select Backlinks CSV file',
        filters: [{ name: 'CSV Files', extensions: ['csv'] }],
        properties: ['openFile']
      });
      if (dialogRes.canceled || dialogRes.filePaths.length === 0) {
        return { success: false, cancelled: true };
      }
      targetPath = dialogRes.filePaths[0];
    }

    try {
      const projectId = mapping?.projectId || 'default';
      const parsed = service.parseBacklinksCsv(targetPath, projectId);
      
      let imported = 0;
      for (const b of parsed) {
        try {
          backlinkRepo.create(b as any);
          imported++;
        } catch {
          // Skip duplicates or conflicts
        }
      }

      return {
        success: true,
        total: parsed.length,
        imported,
        filePath: targetPath
      };
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  });

  ipcMain.handle(IPC.IMPORT.PREVIEW, async (_event, filePath?: string) => {
    let targetPath = filePath;
    if (!targetPath) {
      const dialogRes = await dialog.showOpenDialog({
        title: 'Select CSV to Preview',
        filters: [{ name: 'CSV Files', extensions: ['csv'] }],
        properties: ['openFile']
      });
      if (dialogRes.canceled || dialogRes.filePaths.length === 0) {
        return { success: false, cancelled: true };
      }
      targetPath = dialogRes.filePaths[0];
    }

    try {
      const content = fs.readFileSync(targetPath, 'utf-8');
      const lines = content.split('\n').filter(l => l.trim().length > 0).slice(0, 10);
      return { success: true, filePath: targetPath, previewLines: lines };
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  });

  ipcMain.handle(IPC.EXPORT.CSV, async (_event, projectId: string, entityType: string = 'backlinks') => {
    try {
      const items = backlinkRepo.findByProject(projectId);
      const csvStr = service.exportBacklinksToCsv(items);
      
      const saveRes = await dialog.showSaveDialog({
        title: 'Save Backlinks CSV',
        defaultPath: `backlinkforge_${entityType}_${projectId.slice(0, 8)}.csv`,
        filters: [{ name: 'CSV Files', extensions: ['csv'] }]
      });

      if (!saveRes.canceled && saveRes.filePath) {
        fs.writeFileSync(saveRes.filePath, csvStr, 'utf-8');
        return { success: true, filePath: saveRes.filePath, count: items.length };
      }

      return { success: false, cancelled: true };
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  });

  ipcMain.handle(IPC.EXPORT.JSON, async (_event, projectId: string) => {
    try {
      const items = backlinkRepo.findByProject(projectId);
      const jsonStr = JSON.stringify(items, null, 2);

      const saveRes = await dialog.showSaveDialog({
        title: 'Save Backlinks JSON',
        defaultPath: `backlinkforge_backlinks_${projectId.slice(0, 8)}.json`,
        filters: [{ name: 'JSON Files', extensions: ['json'] }]
      });

      if (!saveRes.canceled && saveRes.filePath) {
        fs.writeFileSync(saveRes.filePath, jsonStr, 'utf-8');
        return { success: true, filePath: saveRes.filePath, count: items.length };
      }

      return { success: false, cancelled: true };
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  });
}
