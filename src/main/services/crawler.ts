import * as cheerio from 'cheerio';
import { request } from 'undici';
import { Page } from '../../shared/types';
import crypto from 'crypto';

export interface CrawlOptions {
  projectId: string;
  baseUrl: string;
  maxPages?: number;
  maxDepth?: number;
  onPageCrawled?: (page: Partial<Page>, current: number, total: number) => void;
}

export class CrawlerService {
  private isCancelled = false;

  public cancel(): void {
    this.isCancelled = true;
  }

  /**
   * Crawls a website starting from baseUrl up to maxPages and maxDepth, extracting SEO metadata & links
   */
  public async crawlSite(options: CrawlOptions): Promise<Partial<Page>[]> {
    this.isCancelled = false;
    const maxPages = options.maxPages || 30;
    const maxDepth = options.maxDepth || 3;

    const baseObj = new URL(options.baseUrl);
    const origin = baseObj.origin.toLowerCase();
    const hostname = baseObj.hostname.toLowerCase().replace(/^www\./, '');

    const visited = new Set<string>();
    const queue: { url: string; depth: number }[] = [{ url: options.baseUrl, depth: 0 }];
    const crawledPages: Partial<Page>[] = [];

    while (queue.length > 0 && crawledPages.length < maxPages && !this.isCancelled) {
      const { url, depth } = queue.shift()!;
      const normalizedUrl = this.normalizeUrl(url);

      if (visited.has(normalizedUrl)) continue;
      visited.add(normalizedUrl);

      try {
        const response = await request(normalizedUrl, {
          method: 'GET',
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36 BacklinkForge-Crawler/1.0',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
          },
          maxRedirections: 3,
        });

        const statusCode = response.statusCode;
        const contentType = response.headers['content-type'] as string || '';

        if (!contentType.includes('text/html')) {
          continue;
        }

        const html = await response.body.text();
        const $ = cheerio.load(html);

        const title = $('title').first().text().trim() || null;
        const metaDescription = $('meta[name="description"]').attr('content')?.trim() || null;
        const h1 = $('h1').first().text().trim() || null;
        const canonicalUrl = $('link[rel="canonical"]').attr('href')?.trim() || null;
        const robotsMeta = $('meta[name="robots"]').attr('content')?.toLowerCase() || '';

        const hasNoindex = robotsMeta.includes('noindex') ? 1 : 0;
        const hasNofollow = robotsMeta.includes('nofollow') ? 1 : 0;
        const isIndexable = (hasNoindex === 0 && statusCode === 200) ? 1 : 0;

        // Extract internal & external links
        let internalLinksCount = 0;
        let externalLinksCount = 0;

        $('a[href]').each((_, el) => {
          const rawHref = $(el).attr('href');
          if (!rawHref || rawHref.startsWith('#') || rawHref.startsWith('javascript:') || rawHref.startsWith('mailto:')) {
            return;
          }

          try {
            const absoluteUrl = new URL(rawHref, normalizedUrl).href;
            const parsed = new URL(absoluteUrl);
            const linkHost = parsed.hostname.toLowerCase().replace(/^www\./, '');

            if (linkHost === hostname) {
              internalLinksCount++;
              if (depth + 1 <= maxDepth && !visited.has(this.normalizeUrl(absoluteUrl))) {
                queue.push({ url: absoluteUrl, depth: depth + 1 });
              }
            } else {
              externalLinksCount++;
            }
          } catch {
            // ignore malformed URLs
          }
        });

        // Structured data detection
        let structuredData: string | null = null;
        const jsonLd = $('script[type="application/ld+json"]').html();
        if (jsonLd) {
          structuredData = jsonLd.trim().substring(0, 1000);
        }

        // Word count estimate
        $('script, style, noscript').remove();
        const text = $('body').text().replace(/\s+/g, ' ').trim();
        const wordCount = text ? text.split(' ').length : 0;

        const pageRecord: Partial<Page> = {
          id: crypto.randomUUID(),
          project_id: options.projectId,
          url: normalizedUrl,
          title,
          meta_description: metaDescription,
          h1,
          canonical_url: canonicalUrl,
          http_status: statusCode,
          content_type: contentType,
          word_count: wordCount,
          internal_links_count: internalLinksCount,
          external_links_count: externalLinksCount,
          depth,
          is_indexable: isIndexable,
          has_noindex: hasNoindex,
          has_nofollow: hasNofollow,
          structured_data: structuredData,
          crawled_at: new Date().toISOString(),
        };

        crawledPages.push(pageRecord);

        if (options.onPageCrawled) {
          options.onPageCrawled(pageRecord, crawledPages.length, maxPages);
        }
      } catch (err: any) {
        // Record failed crawl
        crawledPages.push({
          id: crypto.randomUUID(),
          project_id: options.projectId,
          url: normalizedUrl,
          http_status: 0,
          depth,
          is_indexable: 0,
          crawled_at: new Date().toISOString(),
        });
      }
    }

    return crawledPages;
  }

  private normalizeUrl(rawUrl: string): string {
    try {
      const parsed = new URL(rawUrl);
      parsed.hash = ''; // strip hash
      // strip standard tracking params
      ['utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content', 'fbclid', 'gclid'].forEach(p => parsed.searchParams.delete(p));
      let str = parsed.href;
      if (str.endsWith('/') && parsed.pathname !== '/') {
        str = str.slice(0, -1);
      }
      return str;
    } catch {
      return rawUrl;
    }
  }
}
