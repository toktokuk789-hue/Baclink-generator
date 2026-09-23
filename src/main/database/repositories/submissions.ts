import { BaseRepository } from './index';
import {
  SubmissionTarget,
  CreateSubmissionTarget,
  SubmissionCampaign,
  CreateSubmissionCampaign,
  SubmissionAttempt,
  CreateSubmissionAttempt,
  SubmissionVerification,
  CreateSubmissionVerification,
  SubmissionCenterStats,
  QueryOptions,
  PaginatedResult,
} from '../../../shared/types';
import crypto from 'crypto';

export class SubmissionRepository {
  private targetRepo: BaseRepository<SubmissionTarget>;
  private campaignRepo: BaseRepository<SubmissionCampaign>;
  private attemptRepo: BaseRepository<SubmissionAttempt>;
  private verificationRepo: BaseRepository<SubmissionVerification>;
  private db: any;

  constructor() {
    this.targetRepo = new BaseRepository<SubmissionTarget>('submission_targets');
    this.campaignRepo = new BaseRepository<SubmissionCampaign>('submission_campaigns');
    this.attemptRepo = new BaseRepository<SubmissionAttempt>('submission_attempts');
    this.verificationRepo = new BaseRepository<SubmissionVerification>('submission_verifications');
    this.db = (this.targetRepo as any).db;
  }

  // --- Targets ---

  public getTargets(projectId: string, options?: QueryOptions & { targetType?: string; status?: string; qualification?: string }): PaginatedResult<SubmissionTarget> {
    const page = options?.page || 1;
    const pageSize = options?.pageSize || 25;
    const offset = (page - 1) * pageSize;

    let whereClause = 'WHERE project_id = ?';
    const params: any[] = [projectId];

    if (options?.status) {
      whereClause += ' AND status = ?';
      params.push(options.status);
    }

    if (options?.qualification) {
      whereClause += ' AND qualification_status = ?';
      params.push(options.qualification);
    }

    if (options?.targetType) {
      whereClause += ' AND target_type = ?';
      params.push(options.targetType);
    }

    if (options?.search) {
      whereClause += ' AND (platform_name LIKE ? OR domain LIKE ? OR submission_url LIKE ?)';
      const p = `%${options.search}%`;
      params.push(p, p, p);
    }

    const countRow = this.db.prepare(`SELECT COUNT(*) as total FROM submission_targets ${whereClause}`).get(...params) as { total: number };
    const total = countRow ? countRow.total : 0;

    let orderClause = 'ORDER BY created_at DESC';
    if (options?.sort) {
      const dir = options.sort.direction === 'asc' ? 'ASC' : 'DESC';
      orderClause = `ORDER BY ${options.sort.field} ${dir}`;
    }

    const data = this.db.prepare(`SELECT * FROM submission_targets ${whereClause} ${orderClause} LIMIT ? OFFSET ?`).all(...params, pageSize, offset) as SubmissionTarget[];

    return { data, total, page, pageSize };
  }

  public getTargetById(id: string): SubmissionTarget | undefined {
    return this.targetRepo.findById(id);
  }

  public createTarget(data: CreateSubmissionTarget): SubmissionTarget {
    return this.targetRepo.create(data);
  }

  public bulkCreateTargets(targets: CreateSubmissionTarget[]): number {
    const insert = this.db.prepare(`
      INSERT OR IGNORE INTO submission_targets (
        id, project_id, campaign_id, platform_name, domain, submission_url,
        target_type, accepted_asset_types, country, language, topical_relevance,
        quality_signals, spam_risk_signals, qualification_status, qualification_reason,
        allows_links, estimated_link_type, requirements, discovery_source, status
      ) VALUES (
        ?, ?, ?, ?, ?, ?,
        ?, ?, ?, ?, ?,
        ?, ?, ?, ?,
        ?, ?, ?, ?, ?
      )
    `);

    let count = 0;
    const runBatch = this.db.transaction((items: CreateSubmissionTarget[]) => {
      for (const item of items) {
        const id = item.id || crypto.randomUUID();
        const res = insert.run(
          id,
          item.project_id,
          item.campaign_id || null,
          item.platform_name,
          item.domain,
          item.submission_url,
          item.target_type,
          item.accepted_asset_types || null,
          item.country || null,
          item.language || null,
          item.topical_relevance || 0,
          item.quality_signals || null,
          item.spam_risk_signals || null,
          item.qualification_status || 'pending',
          item.qualification_reason || null,
          item.allows_links ?? 1,
          item.estimated_link_type || 'unknown',
          item.requirements || null,
          item.discovery_source || null,
          item.status || 'discovered'
        );
        if (res.changes > 0) count++;
      }
    });

    runBatch(targets);
    return count;
  }

  public updateTarget(id: string, data: Partial<SubmissionTarget>): SubmissionTarget | undefined {
    return this.targetRepo.update(id, data);
  }

  // --- Campaigns ---

  public getCampaigns(projectId: string): SubmissionCampaign[] {
    return this.db.prepare('SELECT * FROM submission_campaigns WHERE project_id = ? ORDER BY created_at DESC').all(projectId) as SubmissionCampaign[];
  }

  public createCampaign(data: CreateSubmissionCampaign): SubmissionCampaign {
    return this.campaignRepo.create(data);
  }

  public updateCampaign(id: string, data: Partial<SubmissionCampaign>): SubmissionCampaign | undefined {
    return this.campaignRepo.update(id, data);
  }

  // --- Attempts ---

  public createAttempt(data: CreateSubmissionAttempt): SubmissionAttempt {
    return this.attemptRepo.create(data);
  }

  public getAttempts(targetId?: string, projectId?: string): SubmissionAttempt[] {
    if (targetId) {
      return this.db.prepare('SELECT * FROM submission_attempts WHERE target_id = ? ORDER BY started_at DESC').all(targetId) as SubmissionAttempt[];
    }
    if (projectId) {
      return this.db.prepare('SELECT * FROM submission_attempts WHERE project_id = ? ORDER BY started_at DESC').all(projectId) as SubmissionAttempt[];
    }
    return this.attemptRepo.findAll();
  }

  public updateAttempt(id: string, data: Partial<SubmissionAttempt>): SubmissionAttempt | undefined {
    return this.attemptRepo.update(id, data);
  }

  // --- Verifications ---

  public createVerification(data: CreateSubmissionVerification): SubmissionVerification {
    return this.verificationRepo.create(data);
  }

  public getVerifications(targetId: string): SubmissionVerification[] {
    return this.db.prepare('SELECT * FROM submission_verifications WHERE target_id = ? ORDER BY last_checked_at DESC').all(targetId) as SubmissionVerification[];
  }

  // --- Stats ---

  public getStats(projectId: string): SubmissionCenterStats {
    const totalDiscovered = (this.db.prepare('SELECT COUNT(*) as count FROM submission_targets WHERE project_id = ?').get(projectId) as any).count;
    const qualified = (this.db.prepare("SELECT COUNT(*) as count FROM submission_targets WHERE project_id = ? AND qualification_status IN ('qualified', 'high_priority', 'medium_priority', 'low_priority')").get(projectId) as any).count;
    const rejected = (this.db.prepare("SELECT COUNT(*) as count FROM submission_targets WHERE project_id = ? AND qualification_status = 'rejected'").get(projectId) as any).count;
    const pendingApproval = (this.db.prepare("SELECT COUNT(*) as count FROM submission_targets WHERE project_id = ? AND status = 'waiting_approval'").get(projectId) as any).count;
    const submitted = (this.db.prepare("SELECT COUNT(*) as count FROM submission_targets WHERE project_id = ? AND status = 'submitted'").get(projectId) as any).count;
    const published = (this.db.prepare("SELECT COUNT(*) as count FROM submission_targets WHERE project_id = ? AND status = 'published'").get(projectId) as any).count;
    const linksFound = (this.db.prepare("SELECT COUNT(*) as count FROM submission_verifications WHERE project_id = ? AND status = 'published_link_found'").get(projectId) as any).count;
    const linksMissing = (this.db.prepare("SELECT COUNT(*) as count FROM submission_verifications WHERE project_id = ? AND status = 'published_no_link'").get(projectId) as any).count;
    const failed = (this.db.prepare("SELECT COUNT(*) as count FROM submission_targets WHERE project_id = ? AND status = 'failed'").get(projectId) as any).count;
    const needsHumanAction = (this.db.prepare("SELECT COUNT(*) as count FROM submission_attempts WHERE project_id = ? AND status = 'waiting_human_action'").get(projectId) as any).count;

    return {
      targetsDiscovered: totalDiscovered,
      qualified,
      rejected,
      pendingApproval,
      submitted,
      published,
      linksFound,
      linksMissing,
      failed,
      needsHumanAction,
    };
  }
}
