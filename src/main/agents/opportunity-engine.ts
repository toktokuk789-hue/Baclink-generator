import {
  Opportunity,
  CreateOpportunity,
  OpportunityType,
  OpportunityPriority,
  Project,
  Backlink,
  Competitor
} from '../../shared/types';
import crypto from 'crypto';

export class OpportunityEngine {
  /**
   * Generates legitimate link-building opportunities based on competitor backlink analysis and project topical profile
   */
  public discoverOpportunities(
    project: Project,
    backlinks: Backlink[],
    competitors: Competitor[]
  ): CreateOpportunity[] {
    const opportunities: CreateOpportunity[] = [];
    const targetDomain = (project.website_url || '').replace(/^https?:\/\//i, '').replace(/^www\./i, '').split('/')[0].toLowerCase();

    // 1. Competitor Link Gap Opportunities
    // If a source domain links to a competitor, it represents a verified industry referring opportunity
    const competitorDomains = new Set(competitors.map(c => c.domain.toLowerCase().replace(/^www\./, '')));
    const knownTargetBacklinkSources = new Set(
      backlinks.filter(b => b.target_domain.toLowerCase().includes(targetDomain)).map(b => b.source_domain.toLowerCase())
    );

    const competitorBacklinks = backlinks.filter(b => competitorDomains.has(b.target_domain.toLowerCase()));

    for (const b of competitorBacklinks) {
      if (!knownTargetBacklinkSources.has(b.source_domain.toLowerCase())) {
        opportunities.push({
          id: crypto.randomUUID(),
          project_id: project.id,
          domain_id: null,
          type: 'link_gap',
          source_url: b.source_url,
          target_url: project.website_url || null,
          evidence: `Refers to competitor (${b.target_domain}) with anchor "${b.anchor_text || 'Brand link'}" on page title: "${b.page_title || b.source_domain}".`,
          relevance_explanation: `This domain actively links to competing resources in the ${project.industry || 'same'} niche, confirming topical relevance and willingness to link.`,
          recommended_action: `Pitch complementary perspective or updated research asset highlighting ${project.products_services || project.name}.`,
          quality_signals: JSON.stringify({
            dofollow: b.is_dofollow === 1,
            http_status: b.http_status || 200,
            link_type: b.link_type
          }),
          risk_signals: JSON.stringify({
            commercial_intent: 'Editorial reference',
            spam_risk: 'Low'
          }),
          priority: 'high',
          priority_reason: 'Active competitor referring domain not yet linking to target project.',
          status: 'discovered',
          contact_id: null,
          campaign_id: null,
          notes: null,
          tags: JSON.stringify(['competitor_gap', b.target_domain]),
          cost: 0,
        });
      }
    }

    // 2. Resource Page Opportunities
    // Identify pages that act as resource hubs or directories
    const resourceKeywords = ['resources', 'tools', 'links', 'directory', 'guides', 'awesome'];
    for (const b of backlinks) {
      const urlLower = b.source_url.toLowerCase();
      const titleLower = (b.page_title || '').toLowerCase();
      const isResource = resourceKeywords.some(kw => urlLower.includes(kw) || titleLower.includes(kw));

      if (isResource) {
        opportunities.push({
          id: crypto.randomUUID(),
          project_id: project.id,
          domain_id: null,
          type: 'resource_page',
          source_url: b.source_url,
          target_url: project.website_url || null,
          evidence: `Identified curated resource layout on "${b.page_title || b.source_url}".`,
          relevance_explanation: `Resource pages curate reputable tools and references in ${project.industry || 'the sector'}, making them high-value sustainable citations.`,
          recommended_action: `Submit request to include ${project.name} as a recommended resource under relevant category.`,
          quality_signals: JSON.stringify({
            curated_list: true,
            outbound_diversity: 'High'
          }),
          risk_signals: JSON.stringify({
            requires_editorial_approval: true
          }),
          priority: 'high',
          priority_reason: 'Curated resource page with topical alignment.',
          status: 'discovered',
          contact_id: null,
          campaign_id: null,
          notes: null,
          tags: JSON.stringify(['resource_page', 'curated_list']),
          cost: 0,
        });
      }
    }

    // 3. Broken Link Opportunities
    // If a backlink target returns 404 or 410, create a broken-link reclamation opportunity
    for (const b of backlinks) {
      if (b.http_status === 404 || b.http_status === 410) {
        opportunities.push({
          id: crypto.randomUUID(),
          project_id: project.id,
          domain_id: null,
          type: 'broken_link',
          source_url: b.source_url,
          target_url: project.website_url || null,
          evidence: `Source page links to ${b.target_url} which returns HTTP ${b.http_status}.`,
          relevance_explanation: `Broken links degrade user experience and SEO equity for the host domain. Recommending a functional replacement helps the webmaster.`,
          recommended_action: `Notify editor of dead link and suggest relevant live asset from ${project.name} as replacement.`,
          quality_signals: JSON.stringify({
            broken_status: b.http_status,
            relevance: 'High'
          }),
          risk_signals: JSON.stringify({
            rejection_risk: 'Low'
          }),
          priority: 'high',
          priority_reason: 'Confirmed broken citation with direct replacement opportunity.',
          status: 'discovered',
          contact_id: null,
          campaign_id: null,
          notes: null,
          tags: JSON.stringify(['broken_link', 'reclamation']),
          cost: 0,
        });
      }
    }

    return opportunities;
  }

  /**
   * Qualifies an opportunity with transparent priority and actionable reasoning
   */
  public qualifyOpportunity(opp: Opportunity): { priority: OpportunityPriority; reason: string } {
    if (opp.type === 'broken_link') {
      return {
        priority: 'high',
        reason: 'Broken link offers clear win-win value proposition to the webmaster.'
      };
    }

    if (opp.type === 'link_gap') {
      return {
        priority: 'high',
        reason: 'Proven willingness to link to direct competitors in the same topical context.'
      };
    }

    if (opp.type === 'resource_page') {
      return {
        priority: 'medium',
        reason: 'Curated resource pages accept high-utility additions but require human editorial review.'
      };
    }

    return {
      priority: 'medium',
      reason: 'Topical relationship detected; pending detailed editorial review.'
    };
  }
}
