import { Database as SQLiteDatabase } from 'better-sqlite3';
import { Database } from '../connection';

export interface Setting {
  key: string;
  value: string | null;
  category: string;
  created_at: string;
  updated_at: string;
}

export class SettingRepository {
  private db: SQLiteDatabase;

  constructor(_dbInstance?: Database) {
    this.db = Database.getInstance().getDb();
  }

  public get(key: string): string | null {
    const row = this.db.prepare('SELECT value FROM settings WHERE key = ?').get(key) as { value: string | null } | undefined;
    return row?.value ?? null;
  }

  public set(key: string, value: any, category: string = 'general'): void {
    const strVal = typeof value === 'string' ? value : JSON.stringify(value);
    this.db.prepare(`
      INSERT INTO settings (key, value, category, updated_at) VALUES (?, ?, ?, datetime('now'))
      ON CONFLICT(key) DO UPDATE SET value = excluded.value, category = excluded.category, updated_at = datetime('now')
    `).run(key, strVal, category);
  }

  public getAll(): Record<string, string | null> {
    const rows = this.db.prepare('SELECT key, value FROM settings').all() as Setting[];
    const result: Record<string, string | null> = {};
    for (const row of rows) {
      result[row.key] = row.value;
    }
    return result;
  }

  public getByCategory(category: string): Setting[] {
    return this.db.prepare('SELECT * FROM settings WHERE category = ?').all(category) as Setting[];
  }

  public delete(key: string): boolean {
    const info = this.db.prepare('DELETE FROM settings WHERE key = ?').run(key);
    return info.changes > 0;
  }
}
