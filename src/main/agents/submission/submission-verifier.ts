import { SubmissionTarget, CreateSubmissionVerification, SubmissionVerificationStatus } from '../../../shared/types';
import * as cheerio from 'cheerio';
import { request } from 'undici';

export class SubmissionVerifierAgent {
  /**
   * Crawls a published listing or document URL and verifies backlink existence and attributes
   */
  public async verifyListing(target: SubmissionTarget, listingUrl: string, targetWebsiteUrl: string): Promise<CreateSubmissionVerification> {
    const cleanTargetDomain = targetWebsiteUrl
      .replace(/^https?:\/\//i, '')
      .replace(/^www\./i, '')
      .split('/')[0]
      .toLowerCase();

    let httpStatus: number | null = null;
    let linkDetected = 0;
    let targetUrlFound: string | null = null;
    let anchorText: string | null = null;
    let relAttribute: string | null = null;
    let isDofollow = 0;
    let status: SubmissionVerificationStatus = 'unable_to_verify';
    let verificationNotes = '';

    try {
      const response = await request(listingUrl, {
        method: 'GET',
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36 BacklinkForge-Verifier/1.0',
        },
        maxRedirections: 3,
      });

      httpStatus = response.statusCode;

      if (httpStatus >= 200 && httpStatus < 300) {
        const bodyText = await response.body.text();
        const $ = cheerio.load(bodyText);

        // Find any <a> tag that points to the target domain
        let found = false;
        $('a[href]').each((_, el) => {
          const href = $(el).attr('href') || '';
          if (href.toLowerCase().includes(cleanTargetDomain)) {
            found = true;
            targetUrlFound = href;
            anchorText = $(el).text().trim() || $(el).attr('title') || 'Image / Unlabeled';
            relAttribute = $(el).attr('rel') || null;

            const isRelNofollow = relAttribute && /nofollow/i.test(relAttribute);
            const isRelUgc = relAttribute && /ugc/i.test(relAttribute);
            const isRelSponsored = relAttribute && /sponsored/i.test(relAttribute);

            if (!isRelNofollow && !isRelUgc && !isRelSponsored) {
              isDofollow = 1;
            } else {
              isDofollow = 0;
            }
            return false; // break loop
          }
        });

        if (found) {
          linkDetected = 1;
          status = 'published_link_found';
          verificationNotes = `Live listing confirmed. Active link to ${targetUrlFound} detected (${isDofollow ? 'DoFollow' : 'NoFollow/UGC'}).`;
        } else {
          status = 'published_no_link';
          verificationNotes = 'Listing is live, but no direct hyperlinked reference to the target website was found in the page body.';
        }
      } else if (httpStatus === 404 || httpStatus === 410) {
        status = 'removed';
        verificationNotes = `Listing URL returned HTTP ${httpStatus} (Not Found / Removed).`;
      } else {
        status = 'unable_to_verify';
        verificationNotes = `HTTP response status ${httpStatus}. Platform may require session authentication or bot challenge.`;
      }
    } catch (err: any) {
      status = 'unable_to_verify';
      verificationNotes = `Verification check failed: ${err.message}`;
    }

    return {
      target_id: target.id,
      project_id: target.project_id,
      listing_url: listingUrl,
      status,
      http_status: httpStatus,
      link_detected: linkDetected,
      target_url_found: targetUrlFound,
      anchor_text: anchorText,
      rel_attribute: relAttribute,
      is_dofollow: isDofollow,
      verification_notes: verificationNotes,
    };
  }
}
