import { BaseRepository } from './index';
import { Campaign, QueryOptions } from '../../shared/types';

export class CampaignRepository extends BaseRepository<Campaign> {
  constructor() {
    super('campaigns');
  }

  public findByProject(projectId: string, _options?: QueryOptions): Campaign[] {
    return this.db.prepare('SELECT * FROM campaigns WHERE project_id = ? ORDER BY created_at DESC').all(projectId) as Campaign[];
  }
}
