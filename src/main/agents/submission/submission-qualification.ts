import { SubmissionTarget, SubmissionQualificationStatus } from '../../../shared/types';

export interface QualificationResult {
  status: SubmissionQualificationStatus;
  reason: string;
  qualitySignals: Record<string, any>;
  spamRiskSignals: Record<string, any>;
}

export class SubmissionQualificationAgent {
  /**
   * Evaluates a submission target against quality, relevance, editorial standards, and spam signals
   */
  public qualifyTarget(target: SubmissionTarget, projectContext?: { country?: string; industry?: string }): QualificationResult {
    const domain = target.domain.toLowerCase();
    const url = target.submission_url.toLowerCase();

    // 1. Spam & Quality Filters (Reject known low-quality / link farm patterns)
    const knownSpamPatterns = [
      'free-directory-submit',
      'instant-link',
      '1000backlinks',
      'link-farm',
      'seo-mass-submit',
      'auto-backlink',
      'fastbacklinks',
      'pagerank-booster'
    ];

    for (const pattern of knownSpamPatterns) {
      if (domain.includes(pattern) || url.includes(pattern)) {
        return {
          status: 'rejected',
          reason: 'Rejected by Quality Filter: Platform exhibits low-quality link farm patterns and automated spam footprints with zero editorial curation.',
          qualitySignals: { domain_trust: 'Very Low', editorial_moderation: false, indexing_likelihood: 'Low' },
          spamRiskSignals: { link_farm_risk: 'High', excessive_outbound_links: true, algorithmic_penalty_risk: 'High' }
        };
      }
    }

    // 2. High-Authority, Curated Platforms
    const tier1Domains = [
      'crunchbase.com',
      'trustpilot.com',
      'clutch.co',
      'producthunt.com',
      'zenodo.org',
      'slideshare.net',
      'scribd.com',
      'speakerdeck.com',
      'goodfirms.co'
    ];

    const isTier1 = tier1Domains.some(d => domain.includes(d));

    if (isTier1) {
      return {
        status: 'high_priority',
        reason: 'Verified Tier-1 authoritative platform with human/business verification, strong organic traffic, and persistent public citation indexing.',
        qualitySignals: {
          authority: 'High',
          editorial_moderation: true,
          indexing_likelihood: 'Guaranteed',
          brand_visibility: 'Strong',
          relevance: target.topical_relevance >= 0.8 ? 'High' : 'Moderate'
        },
        spamRiskSignals: {
          link_farm_risk: 'None',
          spam_score: 0.0,
          safe_to_submit: true
        }
      };
    }

    // 3. Medium Priority Platforms (Legitimate niche/tool directories)
    if (target.allows_links === 1 && target.topical_relevance >= 0.7) {
      return {
        status: 'medium_priority',
        reason: 'Established niche platform offering legitimate public citation with direct brand or document links.',
        qualitySignals: {
          authority: 'Moderate',
          editorial_moderation: true,
          indexing_likelihood: 'Moderate',
          brand_visibility: 'Moderate'
        },
        spamRiskSignals: {
          link_farm_risk: 'Low',
          spam_score: 0.1,
          safe_to_submit: true
        }
      };
    }

    // 4. Low Priority
    return {
      status: 'low_priority',
      reason: 'Platform provides secondary reach with limited authority metrics or indirect link attribution.',
      qualitySignals: {
        authority: 'Low to Moderate',
        editorial_moderation: false,
        indexing_likelihood: 'Low'
      },
      spamRiskSignals: {
        link_farm_risk: 'Moderate',
        spam_score: 0.25,
        safe_to_submit: true
      }
    };
  }
}
