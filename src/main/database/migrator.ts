import fs from 'fs';
import path from 'path';
import { DBConnection } from './connection';

export class Migrator {
  private migrationsDir: string;

  constructor(migrationsDir: string = path.join(process.cwd(), 'migrations')) {
    this.migrationsDir = migrationsDir;
  }

  public runMigrations(): void {
    const db = DBConnection.getInstance().getDb();

    // Create migrations table if it doesn't exist
    db.exec(`
      CREATE TABLE IF NOT EXISTS _migrations (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL UNIQUE,
        applied_at TEXT DEFAULT (datetime('now'))
      );
    `);

    // Get applied migrations
    const appliedMigrations = db.prepare('SELECT name FROM _migrations').all() as { name: string }[];
    const appliedNames = new Set(appliedMigrations.map((m) => m.name));

    if (!fs.existsSync(this.migrationsDir)) {
      console.warn(`Migrations directory not found at ${this.migrationsDir}`);
      return;
    }

    // Read and sort migration files
    const files = fs.readdirSync(this.migrationsDir)
      .filter((file) => file.endsWith('.sql'))
      .sort();

    const insertMigration = db.prepare('INSERT INTO _migrations (name) VALUES (?)');

    for (const file of files) {
      if (!appliedNames.has(file)) {
        console.log(`Running migration: ${file}`);
        const filePath = path.join(this.migrationsDir, file);
        const sql = fs.readFileSync(filePath, 'utf-8');

        // Wrap each migration in a transaction
        const runMigration = db.transaction(() => {
          db.exec(sql);
          insertMigration.run(file);
        });

        try {
          runMigration();
          console.log(`Successfully applied migration: ${file}`);
        } catch (error) {
          console.error(`Error applying migration ${file}:`, error);
          throw error;
        }
      }
    }
  }
}
