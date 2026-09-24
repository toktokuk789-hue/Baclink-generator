import { BaseRepository } from './index';

export interface Project {
  id: string;
  name: string;
  website_url?: string;
  business_name?: string;
  business_description?: string;
  industry?: string;
  country?: string;
  language?: string;
  target_audience?: string;
  products_services?: string;
  keywords?: string;
  automation_mode?: 'manual' | 'assisted' | 'autonomous';
  status?: string;
  created_at?: string;
  updated_at?: string;
}

export class ProjectRepository extends BaseRepository<Project> {
  constructor(_db?: any) {
    super('projects');
  }

  // Override findAll if you need custom sorting
  public findAll(filters?: Partial<Project>): Project[] {
    return super.findAll(filters);
  }

  // findById is inherited

  // create is inherited

  // update is inherited

  // delete is inherited

  public findByWebsite(url: string): Project | undefined {
    return this.db.prepare('SELECT * FROM projects WHERE website_url = ? LIMIT 1').get(url) as Project | undefined;
  }
}
