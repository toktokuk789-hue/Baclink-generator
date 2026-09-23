import { BaseRepository } from './index';
import { Competitor, QueryOptions } from '../../shared/types';

export class CompetitorRepository extends BaseRepository<Competitor> {
  constructor() {
    super('competitors');
  }

  public findByProject(projectId: string, options?: QueryOptions): Competitor[] {
    let sql = 'SELECT * FROM competitors WHERE project_id = ?';
    const params: any[] = [projectId];

    if (options?.search) {
      sql += ' AND (domain LIKE ? OR name LIKE ?)';
      params.push(`%${options.search}%`, `%${options.search}%`);
    }

    if (options?.sortBy) {
      const order = options.sortDirection === 'asc' ? 'ASC' : 'DESC';
      sql += ` ORDER BY ${options.sortBy} ${order}`;
    } else {
      sql += ' ORDER BY created_at DESC';
    }

    if (options?.limit) {
      sql += ' LIMIT ?';
      params.push(options.limit);
      if (options?.offset) {
        sql += ' OFFSET ?';
        params.push(options.offset);
      }
    }

    return this.db.prepare(sql).all(...params) as Competitor[];
  }

  public findByDomain(projectId: string, domain: string): Competitor | undefined {
    return this.db.prepare('SELECT * FROM competitors WHERE project_id = ? AND domain = ?').get(projectId, domain) as Competitor | undefined;
  }
}
