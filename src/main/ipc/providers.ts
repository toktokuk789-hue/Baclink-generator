import { ipcMain } from 'electron';
import { IPC } from '../../shared/ipc-channels';
import { LLMProviderService } from '../providers/llm-provider';
import { Database } from '../database/connection';

export function registerProviderHandlers(db: Database) {
  const llmService = new LLMProviderService();
  const sqlite = db.getDb();

  ipcMain.handle(IPC.PROVIDERS.TEST_GROQ, async (_event, apiKey: string, model?: string) => {
    return llmService.testGroq(apiKey, model);
  });

  ipcMain.handle(IPC.PROVIDERS.TEST_OPENROUTER, async (_event, apiKey: string, model?: string) => {
    return llmService.testOpenRouter(apiKey, model);
  });

  ipcMain.handle(IPC.PROVIDERS.GET_GROQ_MODELS, async (_event, apiKey: string) => {
    return llmService.getGroqModels(apiKey);
  });

  ipcMain.handle(IPC.PROVIDERS.CONFIGURE, async (_event, providerId: string, config: any) => {
    // Save to settings table
    const key = `provider_${providerId}`;
    const value = JSON.stringify(config);
    sqlite.prepare(`
      INSERT INTO settings (key, value, category, updated_at) 
      VALUES (?, ?, 'providers', datetime('now'))
      ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = excluded.updated_at
    `).run(key, value);

    return { success: true };
  });

  ipcMain.handle(IPC.PROVIDERS.GET_ALL, async () => {
    const rows = sqlite.prepare("SELECT key, value FROM settings WHERE category = 'providers'").all() as { key: string; value: string }[];
    const result: Record<string, any> = {};
    for (const r of rows) {
      const id = r.key.replace(/^provider_/, '');
      try {
        result[id] = JSON.parse(r.value);
      } catch {
        result[id] = r.value;
      }
    }
    return result;
  });
}
