import { BaseRepository } from './index';
import { Message, QueryOptions } from '../../shared/types';

export class MessageRepository extends BaseRepository<Message> {
  constructor() {
    super('messages');
  }

  public findByProject(projectId: string, options?: QueryOptions): Message[] {
    let sql = 'SELECT * FROM messages WHERE project_id = ?';
    const params: any[] = [projectId];

    if (options?.status) {
      sql += ' AND status = ?';
      params.push(options.status);
    }

    sql += ' ORDER BY created_at DESC';

    if (options?.limit) {
      sql += ' LIMIT ?';
      params.push(options.limit);
    }

    return this.db.prepare(sql).all(...params) as Message[];
  }

  public findByOpportunity(opportunityId: string): Message[] {
    return this.db.prepare('SELECT * FROM messages WHERE opportunity_id = ? ORDER BY created_at DESC').all(opportunityId) as Message[];
  }
}
