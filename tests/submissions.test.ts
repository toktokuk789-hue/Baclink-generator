import { describe, it, expect } from 'vitest';
import { SubmissionDiscoveryAgent } from '../src/main/agents/submission/submission-discovery';
import { SubmissionQualificationAgent } from '../src/main/agents/submission/submission-qualification';
import { ProfileBuilderAgent } from '../src/main/agents/submission/profile-builder';
import { Project, SubmissionTarget } from '../src/shared/types';

describe('Submission & Asset Distribution Subsystem', () => {
  const discoveryAgent = new SubmissionDiscoveryAgent();
  const qualificationAgent = new SubmissionQualificationAgent();
  const profileAgent = new ProfileBuilderAgent();

  const mockProject: Project = {
    id: 'proj_sub_1',
    name: 'Apex Analytics',
    website_url: 'https://apexanalytics.com',
    business_name: 'Apex Analytics Inc',
    business_description: 'Enterprise telemetry and business intelligence platform',
    industry: 'Software & Data Analytics',
    country: 'United States',
    language: 'en',
    target_audience: 'Data engineers, CTOs, enterprise teams',
    products_services: 'Telemetry Pipeline, Dashboard Engine, API Connectors',
    keywords: 'telemetry, analytics, enterprise BI, data pipelines',
    automation_mode: 'assisted',
    status: 'active',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  it('discovers legitimate business directories, profile platforms, and document distribution hubs', async () => {
    const targets = await discoveryAgent.discoverTargets(mockProject);
    expect(targets.length).toBeGreaterThanOrEqual(10);

    const domains = targets.map(t => t.domain);
    expect(domains).toContain('crunchbase.com');
    expect(domains).toContain('slideshare.net');
    expect(domains).toContain('zenodo.org');
    expect(domains).toContain('trustpilot.com');
  });

  it('qualifies Tier-1 platforms as high priority with editorial verification', () => {
    const target: SubmissionTarget = {
      id: 't1',
      project_id: 'proj_sub_1',
      campaign_id: null,
      platform_name: 'Crunchbase',
      domain: 'crunchbase.com',
      submission_url: 'https://www.crunchbase.com/add-new',
      target_type: 'business_profile',
      accepted_asset_types: null,
      country: 'Global',
      language: 'en',
      topical_relevance: 0.95,
      quality_signals: null,
      spam_risk_signals: null,
      qualification_status: 'pending',
      qualification_reason: null,
      allows_links: 1,
      estimated_link_type: 'nofollow',
      requirements: null,
      discovery_source: 'Test',
      status: 'discovered',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    const res = qualificationAgent.qualifyTarget(target);
    expect(res.status).toBe('high_priority');
    expect(res.qualitySignals.editorial_moderation).toBe(true);
    expect(res.spamRiskSignals.safe_to_submit).toBe(true);
  });

  it('rejects link-farm patterns with explicit quality filter reasoning', () => {
    const spamTarget: SubmissionTarget = {
      id: 't_spam',
      project_id: 'proj_sub_1',
      campaign_id: null,
      platform_name: 'Free Directory Submit',
      domain: 'free-directory-submit.biz',
      submission_url: 'https://free-directory-submit.biz/add-link',
      target_type: 'industry_directory',
      accepted_asset_types: null,
      country: 'Global',
      language: 'en',
      topical_relevance: 0.2,
      quality_signals: null,
      spam_risk_signals: null,
      qualification_status: 'pending',
      qualification_reason: null,
      allows_links: 1,
      estimated_link_type: 'follow',
      requirements: null,
      discovery_source: 'Test',
      status: 'discovered',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    const res = qualificationAgent.qualifyTarget(spamTarget);
    expect(res.status).toBe('rejected');
    expect(res.reason).toContain('Rejected by Quality Filter');
    expect(res.spamRiskSignals.link_farm_risk).toBe('High');
  });

  it('builds a normalized business profile package conforming to directory field constraints', () => {
    const pkg = profileAgent.buildProfilePackage(mockProject);
    expect(pkg.business_name).toBe('Apex Analytics Inc');
    expect(pkg.website_url).toBe('https://apexanalytics.com');
    expect(pkg.short_description.length).toBeLessThanOrEqual(150);
    expect(pkg.services).toBeDefined();
    expect(pkg.public_email).toContain('apexanalytics.com');
  });
});
