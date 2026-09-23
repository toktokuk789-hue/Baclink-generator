import { describe, it, expect } from 'vitest';
import { SiteAuditEngine } from '../src/main/services/site-audit';
import { Page } from '../src/shared/types';

describe('SiteAuditEngine', () => {
  const engine = new SiteAuditEngine();

  it('detects broken pages and flags them as critical', () => {
    const pages: Page[] = [
      {
        id: '1',
        project_id: 'p1',
        domain_id: null,
        url: 'https://example.com/broken',
        title: 'Error',
        meta_description: null,
        h1: null,
        canonical_url: null,
        http_status: 404,
        content_type: 'text/html',
        word_count: 50,
        internal_links_count: 2,
        external_links_count: 0,
        depth: 1,
        is_indexable: 0,
        has_noindex: 0,
        has_nofollow: 0,
        structured_data: null,
        crawled_at: new Date().toISOString(),
        created_at: new Date().toISOString(),
      },
    ];

    const report = engine.auditSite(pages);
    expect(report.criticalCount).toBeGreaterThanOrEqual(1);
    const brokenIssue = report.issues.find(i => i.issueType === 'broken_page');
    expect(brokenIssue).toBeDefined();
    expect(brokenIssue?.category).toBe('critical');
    expect(report.healthScore).toBeLessThan(100);
  });

  it('flags missing title tags as critical SEO issues', () => {
    const pages: Page[] = [
      {
        id: '2',
        project_id: 'p1',
        domain_id: null,
        url: 'https://example.com/notitle',
        title: '',
        meta_description: 'Has description',
        h1: 'Header',
        canonical_url: 'https://example.com/notitle',
        http_status: 200,
        content_type: 'text/html',
        word_count: 300,
        internal_links_count: 5,
        external_links_count: 1,
        depth: 1,
        is_indexable: 1,
        has_noindex: 0,
        has_nofollow: 0,
        structured_data: null,
        crawled_at: new Date().toISOString(),
        created_at: new Date().toISOString(),
      },
    ];

    const report = engine.auditSite(pages);
    const titleIssue = report.issues.find(i => i.issueType === 'missing_title');
    expect(titleIssue).toBeDefined();
    expect(titleIssue?.category).toBe('critical');
  });

  it('flags missing H1 and meta description as warnings', () => {
    const pages: Page[] = [
      {
        id: '3',
        project_id: 'p1',
        domain_id: null,
        url: 'https://example.com/page3',
        title: 'Valid Page Title',
        meta_description: null,
        h1: null,
        canonical_url: 'https://example.com/page3',
        http_status: 200,
        content_type: 'text/html',
        word_count: 450,
        internal_links_count: 10,
        external_links_count: 2,
        depth: 1,
        is_indexable: 1,
        has_noindex: 0,
        has_nofollow: 0,
        structured_data: null,
        crawled_at: new Date().toISOString(),
        created_at: new Date().toISOString(),
      },
    ];

    const report = engine.auditSite(pages);
    expect(report.warningCount).toBe(2); // missing H1 and missing description
  });

  it('computes 100% health score for clean, properly optimized pages', () => {
    const pages: Page[] = [
      {
        id: '4',
        project_id: 'p1',
        domain_id: null,
        url: 'https://example.com/perfect',
        title: 'Perfect Page with Optimized Title and Context',
        meta_description: 'Concise meta description delivering value.',
        h1: 'Primary Focus Heading',
        canonical_url: 'https://example.com/perfect',
        http_status: 200,
        content_type: 'text/html',
        word_count: 800,
        internal_links_count: 12,
        external_links_count: 3,
        depth: 1,
        is_indexable: 1,
        has_noindex: 0,
        has_nofollow: 0,
        structured_data: '{"@context":"https://schema.org"}',
        crawled_at: new Date().toISOString(),
        created_at: new Date().toISOString(),
      },
    ];

    const report = engine.auditSite(pages);
    expect(report.criticalCount).toBe(0);
    expect(report.warningCount).toBe(0);
    expect(report.healthScore).toBe(100);
  });
});
