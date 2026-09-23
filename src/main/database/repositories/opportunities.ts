import { BaseRepository } from './index';

export interface Opportunity {
  id: string;
  project_id: string;
  domain_id?: string;
  type: 'link_gap' | 'broken_link' | 'resource_page' | 'unlinked_mention' | 'editorial';
  source_url?: string;
  target_url?: string;
  evidence?: string;
  relevance_explanation?: string;
  recommended_action?: string;
  quality_signals?: string;
  risk_signals?: string;
  priority?: 'high' | 'medium' | 'low' | 'reject';
  priority_reason?: string;
  status?: 'discovered' | 'qualified' | 'approved' | 'in_progress' | 'contacted' | 'replied' | 'acquired' | 'verified' | 'rejected' | 'archived';
  contact_id?: string;
  campaign_id?: string;
  notes?: string;
  tags?: string;
  cost?: number;
  created_at?: string;
  updated_at?: string;
}

export class OpportunityRepository extends BaseRepository<Opportunity> {
  constructor() {
    super('opportunities');
  }

  public findByProject(projectId: string, opts?: { status?: string; type?: string; limit?: number; offset?: number }): Opportunity[] {
    let query = 'SELECT * FROM opportunities WHERE project_id = ?';
    const values: any[] = [projectId];

    if (opts?.status) {
      query += ' AND status = ?';
      values.push(opts.status);
    }

    if (opts?.type) {
      query += ' AND type = ?';
      values.push(opts.type);
    }

    query += ' ORDER BY created_at DESC';

    if (opts?.limit) {
      query += ' LIMIT ?';
      values.push(opts.limit);
      if (opts?.offset) {
        query += ' OFFSET ?';
        values.push(opts.offset);
      }
    }

    return this.db.prepare(query).all(...values) as Opportunity[];
  }

  // create is inherited

  // update is inherited

  public countByStatus(projectId: string): Record<string, number> {
    const rows = this.db.prepare('SELECT status, COUNT(*) as count FROM opportunities WHERE project_id = ? GROUP BY status').all(projectId) as { status: string; count: number }[];
    const result: Record<string, number> = {};
    for (const row of rows) {
      result[row.status] = row.count;
    }
    return result;
  }

  public findHighPriority(projectId: string): Opportunity[] {
    return this.db.prepare('SELECT * FROM opportunities WHERE project_id = ? AND priority = ? ORDER BY created_at DESC').all(projectId, 'high') as Opportunity[];
  }
}
