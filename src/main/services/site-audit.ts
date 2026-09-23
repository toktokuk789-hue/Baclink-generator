import { Page } from '../../shared/types';

export interface AuditIssue {
  id: string;
  category: 'critical' | 'warning' | 'notice';
  issueType: string;
  title: string;
  description: string;
  affectedUrl: string;
  recommendation: string;
}

export interface SiteAuditReport {
  totalPages: number;
  healthScore: number; // 0 - 100
  criticalCount: number;
  warningCount: number;
  noticeCount: number;
  issues: AuditIssue[];
}

export class SiteAuditEngine {
  /**
   * Evaluates crawled pages and generates a structured technical SEO audit
   */
  public auditSite(pages: Page[]): SiteAuditReport {
    const issues: AuditIssue[] = [];
    let idCounter = 1;

    for (const p of pages) {
      // 1. Broken pages (4xx / 5xx / connection error)
      if (!p.http_status || p.http_status >= 400) {
        issues.push({
          id: `audit_${idCounter++}`,
          category: 'critical',
          issueType: 'broken_page',
          title: `Broken Page (HTTP ${p.http_status || 'Error'})`,
          description: `The page returned an error status code and cannot be reached by search engine crawlers.`,
          affectedUrl: p.url,
          recommendation: `Fix server error, restore deleted content, or configure a 301 redirect to the nearest relevant page.`,
        });
      }

      // 2. Redirects (3xx)
      if (p.http_status && p.http_status >= 300 && p.http_status < 400) {
        issues.push({
          id: `audit_${idCounter++}`,
          category: 'notice',
          issueType: 'redirect',
          title: `Redirecting Page (HTTP ${p.http_status})`,
          description: `Internal links should point directly to the destination URL rather than passing through redirects.`,
          affectedUrl: p.url,
          recommendation: `Update internal navigation to reference the final canonical destination URL.`,
        });
      }

      // 3. Missing or empty Title tag
      if (p.http_status === 200 && (!p.title || p.title.trim().length === 0)) {
        issues.push({
          id: `audit_${idCounter++}`,
          category: 'critical',
          issueType: 'missing_title',
          title: 'Missing Page Title',
          description: 'The <title> tag is empty or missing, which severely impacts organic SERP ranking and click-through rates.',
          affectedUrl: p.url,
          recommendation: 'Add a descriptive, unique title tag between 50-60 characters including primary topic keywords.',
        });
      }

      // 4. Missing H1 heading
      if (p.http_status === 200 && (!p.h1 || p.h1.trim().length === 0)) {
        issues.push({
          id: `audit_${idCounter++}`,
          category: 'warning',
          issueType: 'missing_h1',
          title: 'Missing Primary H1 Heading',
          description: 'No <h1> tag was found. H1 headings communicate page topical focus to search crawlers and screen readers.',
          affectedUrl: p.url,
          recommendation: 'Add exactly one descriptive <h1> tag matching the core subject of the page content.',
        });
      }

      // 5. Missing meta description
      if (p.http_status === 200 && (!p.meta_description || p.meta_description.trim().length === 0)) {
        issues.push({
          id: `audit_${idCounter++}`,
          category: 'warning',
          issueType: 'missing_meta_description',
          title: 'Missing Meta Description',
          description: 'Search engines may construct arbitrary snippets if a crafted meta description is absent.',
          affectedUrl: p.url,
          recommendation: 'Write a persuasive meta description (120-155 characters) summarizing the value proposition.',
        });
      }

      // 6. Noindex directive
      if (p.has_noindex === 1) {
        issues.push({
          id: `audit_${idCounter++}`,
          category: 'notice',
          issueType: 'noindex_page',
          title: 'Page Configured with Noindex',
          description: 'Robots meta tag explicitly instructs search engines not to index this page in search results.',
          affectedUrl: p.url,
          recommendation: 'Ensure this is intentional (e.g. admin, private staging) and not blocking public landing pages.',
        });
      }

      // 7. Canonical URL issues
      if (p.http_status === 200 && !p.canonical_url) {
        issues.push({
          id: `audit_${idCounter++}`,
          category: 'warning',
          issueType: 'missing_canonical',
          title: 'Missing Self-Referential Canonical Tag',
          description: 'Without a rel="canonical" tag, duplicate versions created by query parameters may dilute link equity.',
          affectedUrl: p.url,
          recommendation: 'Specify an absolute self-referencing canonical URL tag in the <head> section.',
        });
      }

      // 8. Excessively deep pages
      if (p.depth > 3) {
        issues.push({
          id: `audit_${idCounter++}`,
          category: 'warning',
          issueType: 'excessive_crawl_depth',
          title: `Excessive Crawl Depth (Depth ${p.depth})`,
          description: 'This page requires 4 or more clicks from the homepage to reach, diminishing crawl frequency and PageRank transfer.',
          affectedUrl: p.url,
          recommendation: 'Add direct internal contextual links from category hubs or navigation menus.',
        });
      }

      // 9. Orphan-like pages
      if (p.depth > 0 && p.internal_links_count === 0) {
        issues.push({
          id: `audit_${idCounter++}`,
          category: 'notice',
          issueType: 'orphan_page',
          title: 'Potential Orphan Page (Zero Internal Links)',
          description: 'This page contains zero internal links to other areas of the site, creating a navigational dead end.',
          affectedUrl: p.url,
          recommendation: 'Incorporate relevant internal links to related service pages or editorial articles.',
        });
      }
    }

    const criticalCount = issues.filter(i => i.category === 'critical').length;
    const warningCount = issues.filter(i => i.category === 'warning').length;
    const noticeCount = issues.filter(i => i.category === 'notice').length;

    // Calculate transparent health score: 100 base minus deductions
    const totalPages = pages.length;
    let healthScore = 100;
    if (totalPages > 0) {
      const criticalPenalty = (criticalCount / totalPages) * 40;
      const warningPenalty = (warningCount / totalPages) * 20;
      healthScore = Math.max(10, Math.round(100 - criticalPenalty - warningPenalty));
    }

    return {
      totalPages,
      healthScore,
      criticalCount,
      warningCount,
      noticeCount,
      issues,
    };
  }
}
