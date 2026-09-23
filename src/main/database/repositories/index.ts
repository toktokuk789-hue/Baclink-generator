import { Database as SQLiteDatabase } from 'better-sqlite3';
import { Database } from '../connection';
import crypto from 'crypto';

export class BaseRepository<T extends { id: string }> {
  protected tableName: string;
  protected db: SQLiteDatabase;

  constructor(tableName: string) {
    this.tableName = tableName;
    this.db = Database.getInstance().getDb();
  }

  public findById(id: string): T | undefined {
    return this.db.prepare(`SELECT * FROM ${this.tableName} WHERE id = ?`).get(id) as T | undefined;
  }

  public findAll(filters?: Partial<T>): T[] {
    if (!filters || Object.keys(filters).length === 0) {
      return this.db.prepare(`SELECT * FROM ${this.tableName}`).all() as T[];
    }

    const keys = Object.keys(filters);
    const whereClause = keys.map(k => `${k} = ?`).join(' AND ');
    const values = keys.map(k => (filters as any)[k]);
    
    return this.db.prepare(`SELECT * FROM ${this.tableName} WHERE ${whereClause}`).all(...values) as T[];
  }

  public create(data: Omit<T, 'id'> & { id?: string }): T {
    const id = data.id || crypto.randomUUID();
    const payload = { ...data, id } as any;
    
    const keys = Object.keys(payload);
    const cols = keys.join(', ');
    const placeholders = keys.map(() => '?').join(', ');
    const values = keys.map(k => payload[k]);

    this.db.prepare(`INSERT INTO ${this.tableName} (${cols}) VALUES (${placeholders})`).run(...values);
    return this.findById(id) as T;
  }

  public update(id: string, data: Partial<T>): T | undefined {
    const payload = { ...data, updated_at: new Date().toISOString() };
    delete payload.id; // ensure ID is not updated

    const keys = Object.keys(payload);
    if (keys.length === 0) return this.findById(id);

    const setClause = keys.map(k => `${k} = ?`).join(', ');
    const values = keys.map(k => (payload as any)[k]);
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

    const keys = Object.keys(filters);
    const whereClause = keys.map(k => `${k} = ?`).join(' AND ');
    const values = keys.map(k => (filters as any)[k]);
    
    const res = this.db.prepare(`SELECT COUNT(*) as count FROM ${this.tableName} WHERE ${whereClause}`).get(...values) as { count: number };
    return res.count;
  }
}
