import { request } from 'undici';
import * as cheerio from 'cheerio';
import { LLMProviderService } from '../providers/llm-provider';
import { Database } from '../database/connection';

export interface InspectedDomainData {
  domain: string;
  title: string;
  description: string;
  authorityMetric: number; // DR / DA (1 - 100)
  trafficEstimate: number;
  relevanceScore: number;
  contactAvailable: boolean;
  httpStatus: number;
  language: string;
  country: string;
  industryCategory?: string;
}

export class DomainInspectorService {
  private llmService = new LLMProviderService();

  /**
   * Inspects a domain in real-time, fetching its live website metadata and computing estimated DR/traffic
   */
  public async inspect(domainInput: string, projectContext?: { keywords?: string; industry?: string }): Promise<InspectedDomainData> {
    const cleanDomain = domainInput
      .trim()
      .replace(/^https?:\/\//i, '')
      .replace(/^www\./i, '')
      .split('/')[0]
      .toLowerCase();

    let title = cleanDomain;
    let description = '';
    let httpStatus = 200;
    let language = 'en';
    let contactAvailable = false;
    let htmlLength = 0;
    let outgoingLinkCount = 0;

    // 1. Live HTTP Fetch
    try {
      const targetUrl = `https://${cleanDomain}`;
      const response = await request(targetUrl, {
        method: 'GET',
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36 BacklinkForge-Bot/1.0',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        },
        maxRedirections: 3,
        headersTimeout: 8000,
        bodyTimeout: 8000,
      });

      httpStatus = response.statusCode;
      const html = await response.body.text();
      htmlLength = html.length;

      if (html) {
        const $ = cheerio.load(html);
        title = $('title').first().text().trim() ||
                $('meta[property="og:title"]').attr('content')?.trim() ||
                cleanDomain;

        description = $('meta[name="description"]').attr('content')?.trim() ||
                      $('meta[property="og:description"]').attr('content')?.trim() ||
                      '';

        language = $('html').attr('lang') || 'en';
        if (language.includes('-')) language = language.split('-')[0];

        // Check contact links
        const contactLinks = $('a[href*="contact"], a[href*="about"], a[href^="mailto:"]').length;
        contactAvailable = contactLinks > 0;
        outgoingLinkCount = $('a[href^="http"]').length;
      }
    } catch (err: any) {
      // Fallback for domains blocking direct scraping or offline
      title = cleanDomain.split('.')[0].toUpperCase();
      description = `Domain authority profile for ${cleanDomain}`;
    }

    // 2. Calculate Domain Authority (DR / DA estimation 1-100)
    let baseDr = 35;
    const tld = cleanDomain.split('.').pop() || '';
    if (['gov', 'edu', 'mil'].includes(tld)) baseDr += 45;
    else if (['org', 'ac'].includes(tld)) baseDr += 25;
    else if (['io', 'ai', 'co', 'so'].includes(tld)) baseDr += 18;
    else if (['com', 'net'].includes(tld)) baseDr += 12;

    // Content depth bonus
    if (htmlLength > 50000) baseDr += 10;
    else if (htmlLength > 15000) baseDr += 5;

    // Outgoing links bonus
    if (outgoingLinkCount > 20) baseDr += 8;

    // Clamp DR between 18 and 96
    const calculatedDr = Math.min(96, Math.max(18, baseDr));

    // 3. Traffic Estimate (scaled with DR)
    const trafficEstimate = Math.round(Math.pow(calculatedDr / 10, 3.2) * 180);

    // 4. Relevance Score (keyword matching or contextual baseline)
    let relevanceScore = 75;
    if (projectContext?.keywords && description) {
      const kwList = projectContext.keywords.toLowerCase().split(',').map(k => k.trim());
      const descLower = `${title} ${description}`.toLowerCase();
      let matched = 0;
      for (const kw of kwList) {
        if (kw && descLower.includes(kw)) matched++;
      }
      if (matched > 0) {
        relevanceScore = Math.min(98, 70 + matched * 10);
      }
    }

    // 5. Try AI Enrichment if Groq is available
    try {
      const sqlite = Database.getInstance().getDb();
      const row = sqlite.prepare("SELECT value FROM settings WHERE key = 'provider_groq'").get() as { value: string } | undefined;
      if (row?.value) {
        const cfg = JSON.parse(row.value);
        if (cfg?.apiKey) {
          const aiPrompt = `Analyze domain "${cleanDomain}" (Title: "${title}"). Output a JSON object with keys:
"authorityMetric": integer between 20 and 95 (estimated Ahrefs DR),
"trafficEstimate": estimated monthly traffic integer,
"industryCategory": string (2-3 words),
"country": string (e.g. "United States", "Global")
Return ONLY valid JSON.`;

          const aiRes = await this.llmService.complete('groq', cfg.apiKey, cfg.model || 'llama-3.1-8b-instant', [
            { role: 'user', content: aiPrompt }
          ], { maxTokens: 150 });

          const jsonMatch = aiRes.match(/\{[\s\S]*\}/);
          if (jsonMatch) {
            const parsed = JSON.parse(jsonMatch[0]);
            return {
              domain: cleanDomain,
              title: title.slice(0, 150),
              description: description.slice(0, 300),
              authorityMetric: Number(parsed.authorityMetric) || calculatedDr,
              trafficEstimate: Number(parsed.trafficEstimate) || trafficEstimate,
              relevanceScore,
              contactAvailable,
              httpStatus,
              language,
              country: parsed.country || 'Global',
              industryCategory: parsed.industryCategory || 'Digital / Web',
            };
          }
        }
      }
    } catch {
      // LLM enrichment is optional, fallback gracefully
    }

    return {
      domain: cleanDomain,
      title: title.slice(0, 150),
      description: description.slice(0, 300),
      authorityMetric: calculatedDr,
      trafficEstimate,
      relevanceScore,
      contactAvailable,
      httpStatus,
      language,
      country: 'Global',
      industryCategory: 'Web & Technology',
    };
  }
}
