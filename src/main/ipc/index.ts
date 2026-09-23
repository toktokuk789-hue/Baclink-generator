import { Database } from '../database/connection';
import { registerProjectHandlers } from './projects';
import { registerBacklinkHandlers } from './backlinks';
import { registerOpportunityHandlers } from './opportunities';
import { registerSettingsHandlers } from './settings';
import { registerAppHandlers } from './app';
import { registerSubmissionHandlers } from './submissions';
import { registerAssetHandlers } from './assets';
import { registerProviderHandlers } from './providers';
import { registerCompetitorHandlers } from './competitors';
import { registerDomainHandlers } from './domains';
import { registerPageHandlers } from './pages';
import { registerAgentTaskHandlers } from './agent-tasks';
import { registerApprovalHandlers } from './approvals';
import { registerMonitoringHandlers } from './monitoring';
import { registerBrowserHandlers } from './browser';
import { registerCrawlerHandlers } from './crawler';
import { registerAgentHandlers } from './agents';
import { registerImportExportHandlers } from './import-export';
import { registerOutreachHandlers } from './outreach';

import { SubmissionRepository } from '../database/repositories/submissions';
import { BusinessProfileRepository } from '../database/repositories/business-profiles';
import { DocumentAssetRepository } from '../database/repositories/document-assets';
import { ProjectRepository } from '../database/repositories/projects';
import { CompetitorRepository } from '../database/repositories/competitors';
import { DomainRepository } from '../database/repositories/domains';
import { PageRepository } from '../database/repositories/pages';
import { AgentTaskRepository } from '../database/repositories/agent-tasks';
import { ApprovalRepository } from '../database/repositories/approvals';
import { MonitoringRepository } from '../database/repositories/monitoring';
import { BacklinkRepository } from '../database/repositories/backlinks';
import { MessageRepository } from '../database/repositories/messages';

export function registerIpcHandlers(db: Database) {
  const projectRepo = new ProjectRepository();
  const subRepo = new SubmissionRepository();
  const profileRepo = new BusinessProfileRepository();
  const assetRepo = new DocumentAssetRepository();
  const competitorRepo = new CompetitorRepository();
  const domainRepo = new DomainRepository();
  const pageRepo = new PageRepository();
  const agentTaskRepo = new AgentTaskRepository();
  const approvalRepo = new ApprovalRepository();
  const monitoringRepo = new MonitoringRepository();
  const backlinkRepo = new BacklinkRepository();
  const messageRepo = new MessageRepository();

  registerProjectHandlers(db);
  registerBacklinkHandlers(db);
  registerOpportunityHandlers(db);
  registerSettingsHandlers(db);
  registerAppHandlers();
  registerProviderHandlers(db);

  registerCompetitorHandlers(competitorRepo);
  registerDomainHandlers(domainRepo);
  registerPageHandlers(pageRepo);
  registerAgentTaskHandlers(agentTaskRepo);
  registerApprovalHandlers(approvalRepo);
  registerMonitoringHandlers(monitoringRepo);
  registerBrowserHandlers();
  registerCrawlerHandlers(pageRepo, projectRepo);
  registerAgentHandlers();
  registerImportExportHandlers(backlinkRepo);
  registerOutreachHandlers(messageRepo, projectRepo, db);

  registerSubmissionHandlers(subRepo, profileRepo, projectRepo);
  registerAssetHandlers(assetRepo, projectRepo);
}
