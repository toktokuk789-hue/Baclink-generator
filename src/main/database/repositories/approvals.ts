import { BaseRepository } from './index';
import { Approval, QueryOptions } from '../../shared/types';

export class ApprovalRepository extends BaseRepository<Approval> {
  constructor() {
    super('approvals');
  }

  public findByProject(projectId: string, options?: QueryOptions): Approval[] {
    let sql = 'SELECT * FROM approvals WHERE project_id = ?';
    const params: any[] = [projectId];

    if (options?.status) {
      sql += ' AND status = ?';
      params.push(options.status);
    }

    if (options?.sortBy) {
      const order = options.sortDirection === 'asc' ? 'ASC' : 'DESC';
      sql += ` ORDER BY ${options.sortBy} ${order}`;
    } else {
      sql += ' ORDER BY created_at DESC';
    }

    return this.db.prepare(sql).all(...params) as Approval[];
  }

  public getPending(projectId: string): Approval[] {
    return this.db.prepare("SELECT * FROM approvals WHERE project_id = ? AND status = 'pending' ORDER BY created_at DESC").all(projectId) as Approval[];
  }
}
