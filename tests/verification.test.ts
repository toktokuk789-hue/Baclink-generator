import { describe, it, expect } from 'vitest';
import { VerificationEngine } from '../src/main/services/verification';
import { Backlink } from '../src/shared/types';

describe('VerificationEngine', () => {
  const engine = new VerificationEngine();

  const mockBacklink: Backlink = {
    id: 'bl_verify_1',
    project_id: 'proj_1',
    source_url: 'https://example.com/blog/resources',
    source_domain: 'example.com',
    target_url: 'https://mysite.com/features',
    target_domain: 'mysite.com',
    anchor_text: 'MySite Features',
    link_type: 'text',
    is_dofollow: 1,
    is_nofollow: 0,
    is_sponsored: 0,
    is_ugc: 0,
    http_status: 200,
    page_title: 'Useful Tools Guide',
    country: 'US',
    language: 'en',
    first_discovered: new Date().toISOString(),
    last_verified: null,
    link_context: null,
    link_position: null,
    is_redirect: 0,
    redirect_url: null,
    provider: 'Test',
    confidence: 1.0,
    status: 'active',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  it('initializes verification engine successfully', () => {
    expect(engine).toBeDefined();
    expect(typeof engine.verifyBacklink).toBe('function');
  });

  it('handles unreachable or malformed URLs gracefully without crashing', async () => {
    const unreachableLink: Backlink = {
      ...mockBacklink,
      id: 'bl_bad',
      source_url: 'http://localhost:59999/does-not-exist',
    };

    const res = await engine.verifyBacklink(unreachableLink);
    expect(res.status).toBe('unreachable');
    expect(res.isVerified).toBe(false);
    expect(res.notes).toContain('failed');
  });
});
