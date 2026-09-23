import { Database } from '../database/connection';
import { registerProjectHandlers } from './projects';
import { registerBacklinkHandlers } from './backlinks';
import { registerOpportunityHandlers } from './opportunities';
import { registerSettingsHandlers } from './settings';
import { registerAppHandlers } from './app';
import { registerSubmissionHandlers } from './submissions';
import { registerAssetHandlers } from './assets';
import { registerProviderHandlers } from './providers';
import { SubmissionRepository } from '../database/repositories/submissions';
import { BusinessProfileRepository } from '../database/repositories/business-profiles';
import { DocumentAssetRepository } from '../database/repositories/document-assets';
import { ProjectRepository } from '../database/repositories/projects';

export function registerIpcHandlers(db: Database) {
  const projectRepo = new ProjectRepository();
  const subRepo = new SubmissionRepository();
  const profileRepo = new BusinessProfileRepository();
  const assetRepo = new DocumentAssetRepository();

  registerProjectHandlers(db);
  registerBacklinkHandlers(db);
  registerOpportunityHandlers(db);
  registerSettingsHandlers(db);
  registerAppHandlers();
  registerProviderHandlers(db);

  registerSubmissionHandlers(subRepo, profileRepo, projectRepo);
  registerAssetHandlers(assetRepo, projectRepo);
}
