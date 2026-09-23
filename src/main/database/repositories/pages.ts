import { BaseRepository } from './index';
import { Page, QueryOptions } from '../../shared/types';

export class PageRepository extends BaseRepository<Page> {
  constructor() {
    super('pages');
  }

  public findByProject(projectId: string, options?: QueryOptions): Page[] {
    let sql = 'SELECT * FROM pages WHERE project_id = ?';
    const params: any[] = [projectId];

    if (options?.search) {
      sql += ' AND (url LIKE ? OR title LIKE ? OR h1 LIKE ?)';
      params.push(`%${options.search}%`, `%${options.search}%`, `%${options.search}%`);
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

    return this.db.prepare(sql).all(...params) as Page[];
  }

  public findByUrl(projectId: string, url: string): Page | undefined {
    return this.db.prepare('SELECT * FROM pages WHERE project_id = ? AND url = ?').get(projectId, url) as Page | undefined;
  }
}
