import * as cheerio from 'cheerio';
import { Page } from '../../shared/types';
import crypto from 'crypto';

export interface CrawlOptions {
  projectId: string;
  baseUrl: string;
  maxPages?: number;
  maxDepth?: number;
  onPageCrawled?: (page: Partial<Page>, current: number, total: number) => void;
}

const STATIC_EXTENSIONS = new Set([
  '.png', '.jpg', '.jpeg', '.gif', '.svg', '.webp', '.ico',
  '.pdf', '.zip', '.tar', '.gz', '.rar', '.7z',
  '.css', '.js', '.mjs', '.map',
  '.mp4', '.mp3', '.webm', '.ogg', '.wav',
  '.woff', '.woff2', '.ttf', '.eot',
  '.xml', '.json', '.txt'
]);

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
    const maxPages = Math.min(Math.max(options.maxPages || 25, 1), 100);
    const maxDepth = options.maxDepth || 3;

    // Clean and validate base URL
    let startUrl = options.baseUrl.trim();
    if (!startUrl.startsWith('http://') && !startUrl.startsWith('https://')) {
      startUrl = `https://${startUrl}`;
    }

    let initialUrl: URL;
    try {
      initialUrl = new URL(startUrl);
    } catch {
      throw new Error(`Invalid target URL: "${options.baseUrl}"`);
    }

    let primaryHostname = initialUrl.hostname.toLowerCase().replace(/^www\./, '');
    const visited = new Set<string>();
    const queued = new Set<string>();

    const queue: { url: string; depth: number }[] = [{ url: startUrl, depth: 0 }];
    queued.add(this.normalizeUrl(startUrl));

    const crawledPages: Partial<Page>[] = [];

    while (queue.length > 0 && crawledPages.length < maxPages && !this.isCancelled) {
      const item = queue.shift();
      if (!item) break;

      const { url, depth } = item;
      const normalizedUrl = this.normalizeUrl(url);

      if (visited.has(normalizedUrl)) continue;
      visited.add(normalizedUrl);

      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 15000);

        let response: Response;
        try {
          response = await fetch(normalizedUrl, {
            method: 'GET',
            headers: {
              'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
              'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
              'Accept-Language': 'en-US,en;q=0.9',
            },
            redirect: 'follow',
            signal: controller.signal,
          });
        } finally {
          clearTimeout(timeoutId);
        }

        const statusCode = response.status;
        const contentType = response.headers.get('content-type') || '';

        // If redirected to a canonical domain (e.g. naked to www or vice versa), adapt primary hostname
        try {
          const finalUrl = new URL(response.url);
          const finalHost = finalUrl.hostname.toLowerCase().replace(/^www\./, '');
          if (finalHost.includes(primaryHostname) || primaryHostname.includes(finalHost)) {
            primaryHostname = finalHost;
          }
        } catch {
          // ignore
        }

        if (!contentType.includes('text/html')) {
          continue;
        }

        const html = await response.text();
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
          if (!rawHref || rawHref.startsWith('#') || rawHref.startsWith('javascript:') || rawHref.startsWith('mailto:') || rawHref.startsWith('tel:')) {
            return;
          }

          try {
            const absoluteUrl = new URL(rawHref, response.url || normalizedUrl).href;
            const parsed = new URL(absoluteUrl);
            const linkHost = parsed.hostname.toLowerCase().replace(/^www\./, '');

            // Skip static media files
            const pathname = parsed.pathname.toLowerCase();
            const ext = pathname.substring(pathname.lastIndexOf('.'));
            if (STATIC_EXTENSIONS.has(ext)) {
              return;
            }

            if (linkHost === primaryHostname) {
              internalLinksCount++;
              const normAbs = this.normalizeUrl(absoluteUrl);
              if (depth + 1 <= maxDepth && !visited.has(normAbs) && !queued.has(normAbs) && queued.size < maxPages * 3) {
                queued.add(normAbs);
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
        $('script, style, noscript, svg').remove();
        const text = $('body').text().replace(/\s+/g, ' ').trim();
        const wordCount = text ? text.split(' ').length : 0;

        const pageRecord: Partial<Page> = {
          id: crypto.randomUUID(),
          project_id: options.projectId,
          url: response.url || normalizedUrl,
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
        // Record failed crawl attempt for this URL
        crawledPages.push({
          id: crypto.randomUUID(),
          project_id: options.projectId,
          url: normalizedUrl,
          title: `Error: ${err.message || 'Connection failed'}`,
          http_status: 0,
          depth,
          is_indexable: 0,
          crawled_at: new Date().toISOString(),
        });

        if (options.onPageCrawled) {
          options.onPageCrawled(crawledPages[crawledPages.length - 1], crawledPages.length, maxPages);
        }
      }
    }

    return crawledPages;
  }

  private normalizeUrl(rawUrl: string): string {
    try {
      const parsed = new URL(rawUrl);
      parsed.hash = ''; // strip hash
      // strip standard marketing & tracking params
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
