import { BaseRepository } from './index';
import { BusinessProfile, CreateBusinessProfile } from '../../../shared/types';

export class BusinessProfileRepository extends BaseRepository<BusinessProfile> {
  constructor() {
    super('business_profiles');
  }

  public findByProject(projectId: string): BusinessProfile | undefined {
    return this.db.prepare('SELECT * FROM business_profiles WHERE project_id = ?').get(projectId) as BusinessProfile | undefined;
  }

  public upsert(data: CreateBusinessProfile & { project_id: string }): BusinessProfile {
    const existing = this.findByProject(data.project_id);
    if (existing) {
      this.update(existing.id, data as any);
      return this.findById(existing.id) as BusinessProfile;
    } else {
      return this.create(data);
    }
  }
}
