import { Project, CreateSubmissionTarget, SubmissionTargetType } from '../../../shared/types';
import crypto from 'crypto';

export interface DiscoveryQuery {
  projectId: string;
  industry?: string;
  country?: string;
  targetTypes?: SubmissionTargetType[];
  keywords?: string[];
}

export class SubmissionDiscoveryAgent {
  /**
   * Discovers legitimate submission and distribution targets based on project context
   */
  public async discoverTargets(project: Project, query?: Partial<DiscoveryQuery>): Promise<CreateSubmissionTarget[]> {
    const industry = query?.industry || project.industry || 'Technology';
    const country = query?.country || project.country || 'Global';
    const website = project.website_url || '';
    const domain = website.replace(/^https?:\/\//i, '').split('/')[0].replace(/^www\./i, '');

    const candidates: CreateSubmissionTarget[] = [];

    // 1. Business Profile Platforms (Legitimate, high-authority brand profile platforms)
    const businessProfiles = [
      {
        platform_name: 'Crunchbase',
        domain: 'crunchbase.com',
        submission_url: 'https://www.crunchbase.com/add-new',
        target_type: 'business_profile' as const,
        allows_links: 1,
        estimated_link_type: 'nofollow' as const,
        country: 'Global',
        language: 'en',
        topical_relevance: 0.95,
        discovery_source: 'Profile Discovery Agent: Authoritative Company Directory',
        requirements: JSON.stringify({ fields: ['business_name', 'website_url', 'short_description', 'founded_year', 'social_profiles'], verification: 'User account required' }),
      },
      {
        platform_name: 'Trustpilot Business',
        domain: 'trustpilot.com',
        submission_url: 'https://business.trustpilot.com/signup',
        target_type: 'business_profile' as const,
        allows_links: 1,
        estimated_link_type: 'nofollow' as const,
        country: 'Global',
        language: 'en',
        topical_relevance: 0.88,
        discovery_source: 'Profile Discovery Agent: Customer Review & Profile Hub',
        requirements: JSON.stringify({ fields: ['business_name', 'website_url', 'public_email', 'country'], verification: 'Work email confirmation' }),
      },
      {
        platform_name: 'Clutch.co',
        domain: 'clutch.co',
        submission_url: 'https://clutch.co/get-listed',
        target_type: 'industry_directory' as const,
        allows_links: 1,
        estimated_link_type: 'follow' as const,
        country: 'Global',
        language: 'en',
        topical_relevance: 0.92,
        discovery_source: 'Profile Discovery Agent: B2B Services Directory',
        requirements: JSON.stringify({ fields: ['business_name', 'website_url', 'services', 'long_description', 'phone', 'address'], verification: 'LinkedIn authentication or email' }),
      },
      {
        platform_name: 'Product Hunt',
        domain: 'producthunt.com',
        submission_url: 'https://www.producthunt.com/posts/new',
        target_type: 'tool_listing' as const,
        allows_links: 1,
        estimated_link_type: 'nofollow' as const,
        country: 'Global',
        language: 'en',
        topical_relevance: 0.90,
        discovery_source: 'Profile Discovery Agent: Product & Tool Launch Platform',
        requirements: JSON.stringify({ fields: ['business_name', 'website_url', 'tag_line', 'short_description', 'logo_url'], verification: 'Maker profile' }),
      },
      {
        platform_name: 'GoodFirms',
        domain: 'goodfirms.co',
        submission_url: 'https://www.goodfirms.co/get-listed',
        target_type: 'industry_directory' as const,
        allows_links: 1,
        estimated_link_type: 'follow' as const,
        country: 'Global',
        language: 'en',
        topical_relevance: 0.86,
        discovery_source: 'Profile Discovery Agent: Software & IT Directory',
        requirements: JSON.stringify({ fields: ['business_name', 'website_url', 'industry', 'services', 'short_description'], verification: 'Email verification' }),
      },
      {
        platform_name: 'AlternativeTo',
        domain: 'alternativeto.net',
        submission_url: 'https://alternativeto.net/software/create/',
        target_type: 'tool_listing' as const,
        allows_links: 1,
        estimated_link_type: 'nofollow' as const,
        country: 'Global',
        language: 'en',
        topical_relevance: 0.89,
        discovery_source: 'Profile Discovery Agent: Software Alternatives & Reviews',
        requirements: JSON.stringify({ fields: ['business_name', 'website_url', 'short_description', 'categories'], verification: 'Account approval' }),
      },
      {
        platform_name: 'SaaSHub',
        domain: 'saashub.com',
        submission_url: 'https://www.saashub.com/submit-software',
        target_type: 'tool_listing' as const,
        allows_links: 1,
        estimated_link_type: 'follow' as const,
        country: 'Global',
        language: 'en',
        topical_relevance: 0.87,
        discovery_source: 'Profile Discovery Agent: SaaS & Tech Directory',
        requirements: JSON.stringify({ fields: ['business_name', 'website_url', 'short_description', 'pricing'], verification: 'Free submission' }),
      },
      {
        platform_name: 'F6S',
        domain: 'f6s.com',
        submission_url: 'https://www.f6s.com/companies/new',
        target_type: 'business_profile' as const,
        allows_links: 1,
        estimated_link_type: 'follow' as const,
        country: 'Global',
        language: 'en',
        topical_relevance: 0.85,
        discovery_source: 'Profile Discovery Agent: Startup & Tech Network',
        requirements: JSON.stringify({ fields: ['business_name', 'website_url', 'products', 'country', 'founded_year'], verification: 'Profile login' }),
      }
    ];

    // 2. Document & PDF Distribution Platforms
    const documentPlatforms = [
      {
        platform_name: 'SlideShare',
        domain: 'slideshare.net',
        submission_url: 'https://www.slideshare.net/upload',
        target_type: 'document_sharing' as const,
        accepted_asset_types: JSON.stringify(['pdf_guide', 'whitepaper', 'presentation', 'research_report']),
        allows_links: 1,
        estimated_link_type: 'nofollow' as const,
        country: 'Global',
        language: 'en',
        topical_relevance: 0.91,
        discovery_source: 'Document Distribution Agent: Public Slide & PDF Sharing',
        requirements: JSON.stringify({ asset_formats: ['PDF', 'PPTX'], max_size_mb: 50, verification: 'Scribd/LinkedIn account' }),
      },
      {
        platform_name: 'Scribd',
        domain: 'scribd.com',
        submission_url: 'https://www.scribd.com/upload-document',
        target_type: 'document_sharing' as const,
        accepted_asset_types: JSON.stringify(['whitepaper', 'research_report', 'case_study', 'manual']),
        allows_links: 1,
        estimated_link_type: 'nofollow' as const,
        country: 'Global',
        language: 'en',
        topical_relevance: 0.88,
        discovery_source: 'Document Distribution Agent: Digital Document Library',
        requirements: JSON.stringify({ asset_formats: ['PDF', 'DOCX'], max_size_mb: 100, verification: 'User account' }),
      },
      {
        platform_name: 'Issuu',
        domain: 'issuu.com',
        submission_url: 'https://issuu.com/home/publisher',
        target_type: 'document_sharing' as const,
        accepted_asset_types: JSON.stringify(['pdf_guide', 'case_study', 'whitepaper']),
        allows_links: 1,
        estimated_link_type: 'nofollow' as const,
        country: 'Global',
        language: 'en',
        topical_relevance: 0.84,
        discovery_source: 'Document Distribution Agent: Publication Platform',
        requirements: JSON.stringify({ asset_formats: ['PDF'], max_pages: 50, verification: 'Free tier available' }),
      },
      {
        platform_name: 'Speaker Deck',
        domain: 'speakerdeck.com',
        submission_url: 'https://speakerdeck.com/upload',
        target_type: 'presentation' as const,
        accepted_asset_types: JSON.stringify(['presentation', 'pdf_guide']),
        allows_links: 1,
        estimated_link_type: 'follow' as const,
        country: 'Global',
        language: 'en',
        topical_relevance: 0.89,
        discovery_source: 'Document Distribution Agent: Technical Presentation Hub',
        requirements: JSON.stringify({ asset_formats: ['PDF'], verification: 'GitHub or standard sign-in' }),
      },
      {
        platform_name: 'Zenodo (Open Science Research)',
        domain: 'zenodo.org',
        submission_url: 'https://zenodo.org/deposit/new',
        target_type: 'document_sharing' as const,
        accepted_asset_types: JSON.stringify(['research_report', 'statistics_report', 'technical_doc', 'whitepaper']),
        allows_links: 1,
        estimated_link_type: 'follow' as const,
        country: 'Global',
        language: 'en',
        topical_relevance: 0.94,
        discovery_source: 'Document Distribution Agent: Open Access Research Repository',
        requirements: JSON.stringify({ asset_formats: ['PDF'], requires_doi_attribution: true, verification: 'ORCID or GitHub' }),
      },
      {
        platform_name: 'Academia.edu',
        domain: 'academia.edu',
        submission_url: 'https://www.academia.edu/upload',
        target_type: 'document_sharing' as const,
        accepted_asset_types: JSON.stringify(['research_report', 'case_study', 'whitepaper']),
        allows_links: 1,
        estimated_link_type: 'nofollow' as const,
        country: 'Global',
        language: 'en',
        topical_relevance: 0.85,
        discovery_source: 'Document Distribution Agent: Academic Papers & Reports',
        requirements: JSON.stringify({ asset_formats: ['PDF'], verification: 'User account' }),
      }
    ];

    // Combine and build candidates
    const allPlatforms = [...businessProfiles, ...documentPlatforms];

    for (const p of allPlatforms) {
      candidates.push({
        id: crypto.randomUUID(),
        project_id: project.id,
        platform_name: p.platform_name,
        domain: p.domain,
        submission_url: p.submission_url,
        target_type: p.target_type,
        accepted_asset_types: (p as any).accepted_asset_types || null,
        country: p.country,
        language: p.language,
        topical_relevance: p.topical_relevance,
        allows_links: p.allows_links,
        estimated_link_type: p.estimated_link_type,
        requirements: p.requirements,
        discovery_source: p.discovery_source,
        qualification_status: 'pending',
        status: 'discovered',
        quality_signals: JSON.stringify({ authority: 'High', indexable: true, editorial_moderation: true }),
        spam_risk_signals: JSON.stringify({ link_farm_risk: 'Low', automated_spam_risk: 'Low' }),
      });
    }

    return candidates;
  }
}
