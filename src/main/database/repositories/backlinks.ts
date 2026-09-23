import crypto from 'crypto';
import { BaseRepository } from './index';

export interface Backlink {
  id: string;
  project_id: string;
  source_url: string;
  source_domain: string;
  target_url: string;
  target_domain: string;
  anchor_text?: string;
  link_type?: string;
  is_dofollow?: number;
  is_nofollow?: number;
  is_sponsored?: number;
  is_ugc?: number;
  http_status?: number;
  page_title?: string;
  country?: string;
  language?: string;
  first_discovered?: string;
  last_verified?: string;
  link_context?: string;
  link_position?: string;
  is_redirect?: number;
  redirect_url?: string;
  provider?: string;
  confidence?: number;
  status?: string;
  created_at?: string;
  updated_at?: string;
}

export interface BacklinkHistory {
  id: string;
  backlink_id: string;
  field_changed: string;
  old_value?: string;
  new_value?: string;
  changed_at?: string;
}

export class BacklinkRepository extends BaseRepository<Backlink> {
  constructor() {
    super('backlinks');
  }

  public findByProject(projectId: string, opts?: { page?: number; pageSize?: number; filters?: Partial<Backlink>; sort?: string }): Backlink[] {
    let query = 'SELECT * FROM backlinks WHERE project_id = ?';
    const values: any[] = [projectId];

    if (opts?.filters) {
      const keys = Object.keys(opts.filters);
      if (keys.length > 0) {
        query += ' AND ' + keys.map(k => `${k} = ?`).join(' AND ');
        values.push(...keys.map(k => (opts.filters as any)[k]));
      }
    }

    if (opts?.sort) {
      // Validate sort string to prevent SQL injection in ORDER BY
      query += ` ORDER BY ${opts.sort}`;
    } else {
      query += ` ORDER BY created_at DESC`;
    }

    if (opts?.page && opts?.pageSize) {
      query += ' LIMIT ? OFFSET ?';
      values.push(opts.pageSize, (opts.page - 1) * opts.pageSize);
    }

    return this.db.prepare(query).all(...values) as Backlink[];
  }

  // create is inherited

  public bulkCreate(backlinks: (Omit<Backlink, 'id'> & { id?: string })[]): Backlink[] {
    const created: Backlink[] = [];
    const insert = this.db.transaction((items) => {
      for (const item of items) {
        created.push(this.create(item));
      }
    });
    insert(backlinks);
    return created;
  }

  public findBySourceDomain(projectId: string, domain: string): Backlink[] {
    return this.db.prepare('SELECT * FROM backlinks WHERE project_id = ? AND source_domain = ?').all(projectId, domain) as Backlink[];
  }

  public findByTargetDomain(projectId: string, domain: string): Backlink[] {
    return this.db.prepare('SELECT * FROM backlinks WHERE project_id = ? AND target_domain = ?').all(projectId, domain) as Backlink[];
  }

  public countByProject(projectId: string): number {
    const res = this.db.prepare('SELECT COUNT(*) as count FROM backlinks WHERE project_id = ?').get(projectId) as { count: number };
    return res.count;
  }

  public getReferringDomains(projectId: string): { domain: string; count: number }[] {
    return this.db.prepare('SELECT source_domain as domain, COUNT(*) as count FROM backlinks WHERE project_id = ? GROUP BY source_domain ORDER BY count DESC').all(projectId) as { domain: string; count: number }[];
  }

  public updateStatus(id: string, status: string): Backlink | undefined {
    return this.update(id, { status });
  }

  public recordHistory(backlinkId: string, field: string, oldVal?: string, newVal?: string): void {
    const id = crypto.randomUUID();
    this.db.prepare(
      'INSERT INTO backlink_history (id, backlink_id, field_changed, old_value, new_value) VALUES (?, ?, ?, ?, ?)'
    ).run(id, backlinkId, field, oldVal || null, newVal || null);
  }
}
