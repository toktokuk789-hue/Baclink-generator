import BetterSqlite3, { Database as SQLiteDatabase } from 'better-sqlite3';
import { app } from 'electron';
import path from 'path';
import { Migrator } from './migrator';

export class Database {
  private static instance: Database;
  private db: SQLiteDatabase | null = null;
  private dbPath: string;

  private constructor(dbPath?: string) {
    if (dbPath) {
      this.dbPath = dbPath;
    } else {
      try {
        const userDataPath = app.getPath('userData');
        this.dbPath = path.join(userDataPath, 'backlinkforge.db');
      } catch {
        this.dbPath = 'backlinkforge.db';
      }
    }
  }

  public static getInstance(dbPath?: string): Database {
    if (!Database.instance) {
      Database.instance = new Database(dbPath);
    }
    return Database.instance;
  }

  public getDb(): SQLiteDatabase {
    if (!this.db) {
      this.db = new BetterSqlite3(this.dbPath);
      this.db.pragma('foreign_keys = ON');
      this.db.pragma('journal_mode = WAL');
      this.db.pragma('synchronous = NORMAL');
      this.db.pragma('cache_size = -64000');
    }
    return this.db;
  }

  public getPath(): string {
    return this.dbPath;
  }

  public runMigrations(): void {
    // Ensure db is initialized
    this.getDb();
    
    // Determine migrations directory
    let migrationsDir: string;
    if (app.isPackaged) {
      migrationsDir = path.join(process.resourcesPath, 'migrations');
    } else {
      migrationsDir = path.join(app.getAppPath(), 'migrations');
    }

    const migrator = new Migrator(migrationsDir);
    migrator.runMigrations();
  }

  public close(): void {
    if (this.db) {
      this.db.close();
      this.db = null;
    }
  }
}
