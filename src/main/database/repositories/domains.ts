import { BaseRepository } from './index';
import { Domain, QueryOptions } from '../../shared/types';

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
}
