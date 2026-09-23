import { BaseRepository } from './index';
import { MonitoringEvent, QueryOptions } from '../../shared/types';

export class MonitoringRepository extends BaseRepository<MonitoringEvent> {
  constructor() {
    super('monitoring_events');
  }

  public findByProject(projectId: string, options?: QueryOptions): MonitoringEvent[] {
    let sql = 'SELECT * FROM monitoring_events WHERE project_id = ?';
    const params: any[] = [projectId];

    if (options?.severity) {
      sql += ' AND severity = ?';
      params.push(options.severity);
    }

    sql += ' ORDER BY created_at DESC';

    if (options?.limit) {
      sql += ' LIMIT ?';
      params.push(options.limit);
    }

    return this.db.prepare(sql).all(...params) as MonitoringEvent[];
  }

  public getRecent(projectId: string, limit: number = 20): MonitoringEvent[] {
    return this.db.prepare('SELECT * FROM monitoring_events WHERE project_id = ? ORDER BY created_at DESC LIMIT ?').all(projectId, limit) as MonitoringEvent[];
  }
}
