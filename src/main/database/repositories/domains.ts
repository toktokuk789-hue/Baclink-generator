import { BaseRepository } from './index';
import { Domain, QueryOptions } from '../../shared/types';
import crypto from 'crypto';

export class DomainRepository extends BaseRepository<Domain> {
  constructor() {
    super('domains');
  }

  public findByProject(projectId: string, options?: QueryOptions): Domain[] {
    let sql = 'SELECT * FROM domains WHERE project_id = ?';
    const params: any[] = [projectId];

    if (options?.search) {
      sql += ' AND (domain LIKE ? OR title LIKE ? OR description LIKE ?)';
      params.push(`%${options.search}%`, `%${options.search}%`, `%${options.search}%`);
    }

    if (options?.sortBy) {
      const order = options.sortDirection === 'asc' ? 'ASC' : 'DESC';
      sql += ` ORDER BY ${options.sortBy} ${order}`;
    } else {
      sql += ' ORDER BY relevance_score DESC, authority_metric DESC';
    }

    if (options?.limit) {
      sql += ' LIMIT ?';
      params.push(options.limit);
      if (options?.offset) {
        sql += ' OFFSET ?';
        params.push(options.offset);
      }
    }

    return this.db.prepare(sql).all(...params) as Domain[];
  }

  public findByDomainName(projectId: string, domain: string): Domain | undefined {
    return this.db.prepare('SELECT * FROM domains WHERE project_id = ? AND domain = ?').get(projectId, domain) as Domain | undefined;
  }

  public upsertDomain(data: any): Domain {
    const id = data.id || crypto.randomUUID();
    const cleanDomain = data.domain.replace(/^https?:\/\//i, '').replace(/^www\./i, '').split('/')[0].toLowerCase();
    
    this.db.prepare(`
      INSERT INTO domains (
        id, project_id, domain, title, description, country, language,
        relevance_score, authority_metric, authority_source, traffic_estimate,
        traffic_source, contact_available, status, notes, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))
      ON CONFLICT(project_id, domain) DO UPDATE SET
        title = excluded.title,
        description = excluded.description,
        country = excluded.country,
        language = excluded.language,
        relevance_score = excluded.relevance_score,
        authority_metric = excluded.authority_metric,
        traffic_estimate = excluded.traffic_estimate,
        contact_available = excluded.contact_available,
        status = excluded.status,
        notes = excluded.notes,
        updated_at = datetime('now')
    `).run(
      id,
      data.project_id,
      cleanDomain,
      data.title || cleanDomain,
      data.description || null,
      data.country || 'Global',
      data.language || 'en',
      data.relevance_score || 75,
      data.authority_metric || 40,
      data.authority_source || 'estimated',
      data.traffic_estimate || 15000,
      data.traffic_source || 'estimated',
      data.contact_available ? 1 : 0,
      data.status || 'discovered',
      data.notes || null
    );

    return this.findByDomainName(data.project_id, cleanDomain)!;
  }
}
