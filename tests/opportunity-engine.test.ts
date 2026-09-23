import { describe, it, expect } from 'vitest';
import { OpportunityEngine } from '../src/main/agents/opportunity-engine';
import { Project, Backlink, Competitor } from '../src/shared/types';

describe('OpportunityEngine', () => {
  const engine = new OpportunityEngine();

  const mockProject: Project = {
    id: 'proj_1',
    name: 'TechFlow Solutions',
    website_url: 'https://techflow.io',
    business_name: 'TechFlow Solutions Inc',
    business_description: 'Modern developer workflow and deployment tools',
    industry: 'Software & Technology',
    country: 'United States',
    language: 'en',
    target_audience: 'Developers, Engineering Leads',
    products_services: 'CI/CD, Cloud Deployment, Infrastructure',
    keywords: 'cloud deployment, developer tools, continuous integration',
    automation_mode: 'assisted',
    status: 'active',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  const mockCompetitors: Competitor[] = [
    {
      id: 'comp_1',
      project_id: 'proj_1',
      domain: 'rivaltech.com',
      name: 'Rival Tech',
      url: 'https://rivaltech.com',
      status: 'active',
      notes: null,
      created_at: new Date().toISOString(),
    },
  ];

  it('detects competitor link gaps when an external domain refers to a competitor', () => {
    const backlinks: Backlink[] = [
      {
        id: 'bl_1',
        project_id: 'proj_1',
        source_url: 'https://devhub.com/best-cloud-tools',
        source_domain: 'devhub.com',
        target_url: 'https://rivaltech.com/features',
        target_domain: 'rivaltech.com',
        anchor_text: 'Rival Tech CI',
        link_type: 'text',
        is_dofollow: 1,
        is_nofollow: 0,
        is_sponsored: 0,
        is_ugc: 0,
        http_status: 200,
        page_title: 'Top 10 Cloud Development Platforms in 2026',
        country: 'US',
        language: 'en',
        first_discovered: new Date().toISOString(),
        last_verified: null,
        link_context: null,
        link_position: null,
        is_redirect: 0,
        redirect_url: null,
        provider: 'Provider test',
        confidence: 1.0,
        status: 'active',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
    ];

    const opportunities = engine.discoverOpportunities(mockProject, backlinks, mockCompetitors);
    expect(opportunities.length).toBeGreaterThanOrEqual(1);

    const gap = opportunities.find(o => o.type === 'link_gap');
    expect(gap).toBeDefined();
    expect(gap?.priority).toBe('high');
    expect(gap?.source_url).toBe('https://devhub.com/best-cloud-tools');
  });

  it('detects broken link opportunities when a referring page targets a 404 URL', () => {
    const backlinks: Backlink[] = [
      {
        id: 'bl_2',
        project_id: 'proj_1',
        source_url: 'https://techmagazine.org/devops-guide',
        source_domain: 'techmagazine.org',
        target_url: 'https://oldtool.com/deleted-page',
        target_domain: 'oldtool.com',
        anchor_text: 'Old Tool Guide',
        link_type: 'text',
        is_dofollow: 1,
        is_nofollow: 0,
        is_sponsored: 0,
        is_ugc: 0,
        http_status: 404,
        page_title: 'Comprehensive DevOps Guide',
        country: 'US',
        language: 'en',
        first_discovered: new Date().toISOString(),
        last_verified: null,
        link_context: null,
        link_position: null,
        is_redirect: 0,
        redirect_url: null,
        provider: 'Provider test',
        confidence: 1.0,
        status: 'active',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
    ];

    const opportunities = engine.discoverOpportunities(mockProject, backlinks, mockCompetitors);
    const broken = opportunities.find(o => o.type === 'broken_link');
    expect(broken).toBeDefined();
    expect(broken?.priority).toBe('high');
    expect(broken?.relevance_explanation).toContain('Broken links degrade user experience');
  });
});
