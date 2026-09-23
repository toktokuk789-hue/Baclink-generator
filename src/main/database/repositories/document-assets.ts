import { BaseRepository } from './index';
import { DocumentAsset, CreateDocumentAsset, QueryOptions, PaginatedResult } from '../../../shared/types';

export class DocumentAssetRepository extends BaseRepository<DocumentAsset> {
  constructor() {
    super('document_assets');
  }

  public findByProject(projectId: string, options?: QueryOptions): PaginatedResult<DocumentAsset> {
    const page = options?.page || 1;
    const pageSize = options?.pageSize || 25;
    const offset = (page - 1) * pageSize;

    let whereClause = 'WHERE project_id = ?';
    const params: any[] = [projectId];

    if (options?.search) {
      whereClause += ' AND (title LIKE ? OR summary LIKE ? OR author LIKE ?)';
      const searchParam = `%${options.search}%`;
      params.push(searchParam, searchParam, searchParam);
    }

    const countRow = this.db.prepare(`SELECT COUNT(*) as total FROM document_assets ${whereClause}`).get(...params) as { total: number };
    const total = countRow ? countRow.total : 0;

    let orderClause = 'ORDER BY created_at DESC';
    if (options?.sort) {
      const dir = options.sort.direction === 'asc' ? 'ASC' : 'DESC';
      orderClause = `ORDER BY ${options.sort.field} ${dir}`;
    }

    const data = this.db.prepare(`SELECT * FROM document_assets ${whereClause} ${orderClause} LIMIT ? OFFSET ?`).all(...params, pageSize, offset) as DocumentAsset[];

    return { data, total, page, pageSize };
  }

  public findByHash(projectId: string, fileHash: string): DocumentAsset | undefined {
    return this.db.prepare('SELECT * FROM document_assets WHERE project_id = ? AND file_hash = ?').get(projectId, fileHash) as DocumentAsset | undefined;
  }
}
