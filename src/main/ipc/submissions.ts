import { ipcMain, shell } from 'electron';
import { IPC } from '../../shared/ipc-channels';
import { SubmissionRepository } from '../database/repositories/submissions';
import { BusinessProfileRepository } from '../database/repositories/business-profiles';
import { ProjectRepository } from '../database/repositories/projects';
import { SubmissionDiscoveryAgent } from '../agents/submission/submission-discovery';
import { SubmissionQualificationAgent } from '../agents/submission/submission-qualification';
import { SubmissionVerifierAgent } from '../agents/submission/submission-verifier';
import { ProfileBuilderAgent } from '../agents/submission/profile-builder';
import { BrowserHub } from '../browser/browser-hub';
import crypto from 'crypto';

export function registerSubmissionHandlers(
  subRepo: SubmissionRepository,
  profileRepo: BusinessProfileRepository,
  projectRepo: ProjectRepository
) {
  const discoveryAgent = new SubmissionDiscoveryAgent();
  const qualificationAgent = new SubmissionQualificationAgent();
  const verifierAgent = new SubmissionVerifierAgent();
  const profileAgent = new ProfileBuilderAgent();

  // 1. Business Profile
  ipcMain.handle(IPC.SUBMISSIONS.GET_PROFILE, async (_event, projectId: string) => {
    let profile = profileRepo.findByProject(projectId);
    if (!profile) {
      const project = projectRepo.findById(projectId);
      if (project) {
        const pkg = profileAgent.buildProfilePackage(project);
        profile = profileRepo.create(pkg);
      }
    }
    return profile;
  });

  ipcMain.handle(IPC.SUBMISSIONS.SAVE_PROFILE, async (_event, projectId: string, data: any) => {
    return profileRepo.upsert({ ...data, project_id: projectId });
  });

  // 2. Targets & Discovery
  ipcMain.handle(IPC.SUBMISSIONS.GET_TARGETS, async (_event, projectId: string, options?: any) => {
    return subRepo.getTargets(projectId, options);
  });

  ipcMain.handle(IPC.SUBMISSIONS.DISCOVER_TARGETS, async (_event, projectId: string, options?: any) => {
    const project = projectRepo.findById(projectId);
    if (!project) throw new Error('Project not found');

    const discovered = await discoveryAgent.discoverTargets(project, options);
    const addedCount = subRepo.bulkCreateTargets(discovered);
    return { discoveredCount: discovered.length, addedCount };
  });

  // 3. Qualification
  ipcMain.handle(IPC.SUBMISSIONS.QUALIFY_TARGETS, async (_event, projectId: string, targetIds?: string[]) => {
    const project = projectRepo.findById(projectId);
    if (!project) throw new Error('Project not found');

    const res = subRepo.getTargets(projectId, { pageSize: 1000 });
    const targetsToQualify = targetIds 
      ? res.data.filter(t => targetIds.includes(t.id))
      : res.data;

    let qualifiedCount = 0;
    for (const target of targetsToQualify) {
      const q = qualificationAgent.qualifyTarget(target, { country: project.country || undefined, industry: project.industry || undefined });
      subRepo.updateTarget(target.id, {
        qualification_status: q.status,
        qualification_reason: q.reason,
        quality_signals: JSON.stringify(q.qualitySignals),
        spam_risk_signals: JSON.stringify(q.spamRiskSignals),
        status: q.status === 'rejected' ? 'rejected' : 'qualified'
      });
      qualifiedCount++;
    }

    return { qualifiedCount };
  });

  // 4. Submission Preparation & Execution
  ipcMain.handle(IPC.SUBMISSIONS.PREPARE_SUBMISSION, async (_event, targetId: string, profileId?: string, assetId?: string) => {
    const target = subRepo.getTargetById(targetId);
    if (!target) throw new Error('Target not found');

    subRepo.updateTarget(targetId, { status: 'prepared' });

    return {
      target,
      prepared: true,
      readyForApproval: true
    };
  });

  ipcMain.handle(IPC.SUBMISSIONS.EXECUTE_SUBMISSION, async (_event, targetId: string, options?: any) => {
    const target = subRepo.getTargetById(targetId);
    if (!target) throw new Error('Target not found');

    let cleanUrl = (target.submission_url || '').trim();
    if (!cleanUrl.startsWith('http://') && !cleanUrl.startsWith('https://')) {
      cleanUrl = `https://${cleanUrl}`;
    }

    // Open target submission URL in Chrome or default browser
    let openedVia = 'browser';
    try {
      const browserHub = BrowserHub.getInstance();
      const status = browserHub.getStatus();
      if (status.status === 'connected') {
        await browserHub.openUrl(cleanUrl);
        openedVia = 'chrome_cdp';
      } else {
        await shell.openExternal(cleanUrl);
        openedVia = 'default_browser';
      }
    } catch (openErr) {
      console.warn('BrowserHub openUrl failed, falling back to shell.openExternal:', openErr);
      try {
        await shell.openExternal(cleanUrl);
        openedVia = 'default_browser';
      } catch (shellErr) {
        console.error('shell.openExternal failed:', shellErr);
      }
    }

    // Create attempt record
    const attempt = subRepo.createAttempt({
      id: crypto.randomUUID(),
      target_id: targetId,
      project_id: target.project_id,
      profile_id: options?.profileId || null,
      asset_id: options?.assetId || null,
      mode: options?.mode || 'browser_assisted',
      status: 'waiting_human_action', // Responsible Automation: Human-in-the-loop protection
      human_action_reason: `Opened ${target.platform_name} in Chrome. Please complete any CAPTCHA, login, or form fields, then click Confirm & Resume.`,
      submitted_data: JSON.stringify(options?.data || {}),
      started_at: new Date().toISOString()
    });

    subRepo.updateTarget(targetId, { status: 'in_progress' });

    return {
      attempt,
      humanActionRequired: true,
      reason: attempt.human_action_reason,
      submissionUrl: cleanUrl,
      platform: target.platform_name,
      openedVia
    };
  });

  ipcMain.handle(IPC.SUBMISSIONS.RESUME_AFTER_HUMAN, async (_event, attemptId: string) => {
    const attempts = subRepo.getAttempts();
    const attempt = attempts.find(a => a.id === attemptId);
    if (!attempt) throw new Error('Attempt not found');

    subRepo.updateAttempt(attemptId, {
      status: 'submitted',
      completed_at: new Date().toISOString()
    });

    subRepo.updateTarget(attempt.target_id, {
      status: 'submitted'
    });

    return { success: true, status: 'submitted' };
  });

  // 5. Verification
  ipcMain.handle(IPC.SUBMISSIONS.VERIFY_TARGET, async (_event, targetId: string) => {
    const target = subRepo.getTargetById(targetId);
    if (!target) throw new Error('Target not found');

    const project = projectRepo.findById(target.project_id);
    if (!project) throw new Error('Project not found');

    // Use submission URL or listing URL if known
    const urlToCheck = target.submission_url;
    const verification = await verifierAgent.verifyListing(target, urlToCheck, project.website_url || '');
    subRepo.createVerification(verification);

    if (verification.status === 'published_link_found') {
      subRepo.updateTarget(targetId, { status: 'published' });
    }

    return verification;
  });

  ipcMain.handle(IPC.SUBMISSIONS.VERIFY_ALL, async (_event, projectId: string) => {
    const targets = subRepo.getTargets(projectId, { pageSize: 500, status: 'submitted' });
    const project = projectRepo.findById(projectId);
    if (!project) return { verifiedCount: 0 };

    let count = 0;
    for (const target of targets.data) {
      const v = await verifierAgent.verifyListing(target, target.submission_url, project.website_url || '');
      subRepo.createVerification(v);
      if (v.status === 'published_link_found') {
        subRepo.updateTarget(target.id, { status: 'published' });
      }
      count++;
    }
    return { verifiedCount: count };
  });

  // 6. Stats & Campaigns
  ipcMain.handle(IPC.SUBMISSIONS.GET_STATS, async (_event, projectId: string) => {
    return subRepo.getStats(projectId);
  });

  ipcMain.handle(IPC.SUBMISSIONS.GET_CAMPAIGNS, async (_event, projectId: string) => {
    return subRepo.getCampaigns(projectId);
  });

  ipcMain.handle(IPC.SUBMISSIONS.CREATE_CAMPAIGN, async (_event, data: any) => {
    return subRepo.createCampaign(data);
  });

  ipcMain.handle(IPC.SUBMISSIONS.UPDATE_CAMPAIGN, async (_event, id: string, data: any) => {
    return subRepo.updateCampaign(id, data);
  });

  ipcMain.handle(IPC.SUBMISSIONS.GET_ATTEMPTS, async (_event, targetId?: string, projectId?: string) => {
    return subRepo.getAttempts(targetId, projectId);
  });

  // 7. Bulk Queue
  ipcMain.handle(IPC.SUBMISSIONS.BULK_QUEUE, async (_event, projectId: string, targetIds: string[], policy?: string) => {
    let queued = 0;
    for (const id of targetIds) {
      subRepo.updateTarget(id, {
        status: 'waiting_approval'
      });
      queued++;
    }
    return { queued, policy: policy || 'ask_approval' };
  });
}
