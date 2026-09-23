import * as cheerio from 'cheerio';
import { request } from 'undici';
import { Backlink } from '../../shared/types';

export interface VerificationResult {
  backlinkId: string;
  isVerified: boolean;
  httpStatus: number | null;
  linkFound: boolean;
  anchorText: string | null;
  isDofollow: boolean;
  redirectUrl: string | null;
  changeDetected: boolean;
  status: 'active' | 'lost' | 'changed' | 'unreachable';
  notes: string;
}

export class VerificationEngine {
  /**
   * Verifies an individual backlink by fetching its source page and inspecting the DOM
   */
  public async verifyBacklink(backlink: Backlink): Promise<VerificationResult> {
    const cleanTargetDomain = backlink.target_domain.toLowerCase().replace(/^www\./, '');
    const cleanTargetUrl = backlink.target_url.toLowerCase();

    let httpStatus: number | null = null;
    let linkFound = false;
    let detectedAnchor: string | null = null;
    let isDofollow = true;
    let redirectUrl: string | null = null;
    let status: 'active' | 'lost' | 'changed' | 'unreachable' = 'unreachable';
    let notes = '';

    try {
      const response = await request(backlink.source_url, {
        method: 'GET',
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36 BacklinkForge-Verifier/1.0',
        },
        maxRedirections: 3,
      });

      httpStatus = response.statusCode;

      if (httpStatus >= 200 && httpStatus < 300) {
        const html = await response.body.text();
        const $ = cheerio.load(html);

        $('a[href]').each((_, el) => {
          const href = $(el).attr('href') || '';
          const hrefLower = href.toLowerCase();

          // Match exact target URL or domain reference
          if (hrefLower === cleanTargetUrl || hrefLower.includes(cleanTargetDomain)) {
            linkFound = true;
            detectedAnchor = $(el).text().trim() || null;

            const rel = $(el).attr('rel') || '';
            const isRelNofollow = /nofollow/i.test(rel);
            const isRelUgc = /ugc/i.test(rel);
            const isRelSponsored = /sponsored/i.test(rel);

            isDofollow = !isRelNofollow && !isRelUgc && !isRelSponsored;
            return false; // break loop
          }
        });

        if (linkFound) {
          const anchorChanged = detectedAnchor !== backlink.anchor_text;
          const relChanged = (isDofollow ? 1 : 0) !== backlink.is_dofollow;

          if (anchorChanged || relChanged) {
            status = 'changed';
            notes = `Backlink verified with changes (Anchor: "${detectedAnchor}", DoFollow: ${isDofollow}).`;
          } else {
            status = 'active';
            notes = 'Backlink verified intact with identical anchor and rel attributes.';
          }
        } else {
          status = 'lost';
          notes = 'Source page loaded successfully (HTTP 200), but the hyperlink pointing to target website has been removed.';
        }
      } else {
        status = 'unreachable';
        notes = `Source page returned HTTP ${httpStatus}. Unable to confirm link status.`;
      }
    } catch (err: any) {
      status = 'unreachable';
      notes = `Verification request failed: ${err.message}`;
    }

    const changeDetected = status === 'lost' || status === 'changed';

    return {
      backlinkId: backlink.id,
      isVerified: linkFound,
      httpStatus,
      linkFound,
      anchorText: detectedAnchor,
      isDofollow,
      redirectUrl,
      changeDetected,
      status,
      notes,
    };
  }
}
