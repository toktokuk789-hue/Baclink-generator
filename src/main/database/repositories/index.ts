import { Database as SQLiteDatabase } from 'better-sqlite3';
import { Database } from '../connection';
import crypto from 'crypto';

export class BaseRepository<T extends { id: string }> {
  protected tableName: string;
  protected db: SQLiteDatabase;
  private tableColumns: Set<string> | null = null;

  constructor(tableName: string) {
    this.tableName = tableName;
    this.db = Database.getInstance().getDb();
  }

  /**
   * Lazily loads and caches the valid column names for the table using PRAGMA table_info
   */
  protected getColumns(): Set<string> {
    if (!this.tableColumns) {
      try {
        const rows = this.db.prepare(`PRAGMA table_info("${this.tableName}")`).all() as { name: string }[];
        this.tableColumns = new Set(rows.map(r => r.name));
      } catch (err) {
        console.warn(`Could not inspect table columns for ${this.tableName}:`, err);
        this.tableColumns = new Set();
      }
    }
    return this.tableColumns;
  }

  public findById(id: string): T | undefined {
    return this.db.prepare(`SELECT * FROM ${this.tableName} WHERE id = ?`).get(id) as T | undefined;
  }

  public findAll(filters?: Partial<T>): T[] {
    if (!filters || Object.keys(filters).length === 0) {
      return this.db.prepare(`SELECT * FROM ${this.tableName}`).all() as T[];
    }

    const validCols = this.getColumns();
    const keys = Object.keys(filters).filter(k => validCols.size === 0 || validCols.has(k));
    if (keys.length === 0) {
      return this.db.prepare(`SELECT * FROM ${this.tableName}`).all() as T[];
    }

    const whereClause = keys.map(k => `${k} = ?`).join(' AND ');
    const values = keys.map(k => (filters as any)[k]);
    
    return this.db.prepare(`SELECT * FROM ${this.tableName} WHERE ${whereClause}`).all(...values) as T[];
  }

  public create(data: Omit<T, 'id'> & { id?: string }): T {
    const id = data.id || crypto.randomUUID();
    const payload = { ...data, id } as any;
    const validCols = this.getColumns();
    
    // Only insert keys that actually exist as columns in this table
    const keys = Object.keys(payload).filter(k => validCols.size === 0 || validCols.has(k));
    const cols = keys.join(', ');
    const placeholders = keys.map(() => '?').join(', ');
    const values = keys.map(k => payload[k]);

    this.db.prepare(`INSERT INTO ${this.tableName} (${cols}) VALUES (${placeholders})`).run(...values);
    return this.findById(id) as T;
  }

  public update(id: string, data: Partial<T>): T | undefined {
    const validCols = this.getColumns();
    const payload = { ...data } as any;
    delete payload.id; // ensure ID is not modified

    // Only inject updated_at if the table actually has an updated_at column
    if (validCols.has('updated_at') && payload.updated_at === undefined) {
      payload.updated_at = new Date().toISOString();
    }

    // Only update keys that exist as valid columns in the table
    const keys = Object.keys(payload).filter(k => validCols.size === 0 || validCols.has(k));
    if (keys.length === 0) return this.findById(id);

    const setClause = keys.map(k => `${k} = ?`).join(', ');
    const values = keys.map(k => payload[k]);
    values.push(id);

    this.db.prepare(`UPDATE ${this.tableName} SET ${setClause} WHERE id = ?`).run(...values);
    return this.findById(id);
  }

  public delete(id: string): boolean {
    const info = this.db.prepare(`DELETE FROM ${this.tableName} WHERE id = ?`).run(id);
    return info.changes > 0;
  }

  public count(filters?: Partial<T>): number {
    if (!filters || Object.keys(filters).length === 0) {
      const res = this.db.prepare(`SELECT COUNT(*) as count FROM ${this.tableName}`).get() as { count: number };
      return res.count;
    }

    const validCols = this.getColumns();
    const keys = Object.keys(filters).filter(k => validCols.size === 0 || validCols.has(k));
    if (keys.length === 0) {
      const res = this.db.prepare(`SELECT COUNT(*) as count FROM ${this.tableName}`).get() as { count: number };
      return res.count;
    }

    const whereClause = keys.map(k => `${k} = ?`).join(' AND ');
    const values = keys.map(k => (filters as any)[k]);
    
    const res = this.db.prepare(`SELECT COUNT(*) as count FROM ${this.tableName} WHERE ${whereClause}`).get(...values) as { count: number };
    return res.count;
  }
}
