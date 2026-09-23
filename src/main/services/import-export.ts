import fs from 'fs';
import { parse } from 'csv-parse/sync';
import { stringify } from 'csv-stringify/sync';
import { Backlink, CreateBacklink } from '../../shared/types';
import crypto from 'crypto';

export interface ImportResult {
  totalRows: number;
  importedCount: number;
  duplicateCount: number;
  errors: string[];
}

export class ImportExportService {
  /**
   * Imports backlinks from a CSV file into normalized CreateBacklink objects
   */
  public parseBacklinksCsv(filePath: string, projectId: string, providerName: string = 'User CSV'): CreateBacklink[] {
    const fileContent = fs.readFileSync(filePath, 'utf-8');
    const records = parse(fileContent, {
      columns: true,
      skip_empty_lines: true,
      trim: true,
    }) as Record<string, string>[];

    const backlinks: CreateBacklink[] = [];

    for (const row of records) {
      // Flexible column mapping for Ahrefs, Semrush, Moz, and generic formats
      const sourceUrl = row['Source URL'] || row['Referring Page URL'] || row['Source'] || row['SourceUrl'] || row['URL'] || '';
      const targetUrl = row['Target URL'] || row['Link URL'] || row['Target'] || row['TargetUrl'] || '';

      if (!sourceUrl || !targetUrl) continue;

      const anchor = row['Anchor'] || row['Anchor Text'] || row['AnchorText'] || null;
      const typeStr = (row['Type'] || row['Link Type'] || '').toLowerCase();
      const isNofollow = typeStr.includes('nofollow') || row['Nofollow'] === 'true' || row['Nofollow'] === '1' ? 1 : 0;
      const isDofollow = isNofollow === 1 ? 0 : 1;

      const pageTitle = row['Page Title'] || row['Title'] || row['Source Title'] || null;
      const httpStatus = parseInt(row['HTTP Status'] || row['Status Code'] || '200') || 200;

      const sourceDomain = this.extractDomain(sourceUrl);
      const targetDomain = this.extractDomain(targetUrl);

      backlinks.push({
        id: crypto.randomUUID(),
        project_id: projectId,
        source_url: sourceUrl,
        source_domain: sourceDomain,
        target_url: targetUrl,
        target_domain: targetDomain,
        anchor_text: anchor,
        link_type: 'text',
        is_dofollow: isDofollow,
        is_nofollow: isNofollow,
        is_sponsored: 0,
        is_ugc: 0,
        http_status: httpStatus,
        page_title: pageTitle,
        country: null,
        language: null,
        first_discovered: new Date().toISOString(),
        last_verified: null,
        link_context: null,
        link_position: null,
        is_redirect: 0,
        redirect_url: null,
        provider: providerName,
        confidence: 1.0,
        status: 'active',
      });
    }

    return backlinks;
  }

  /**
   * Exports an array of items to CSV string
   */
  public exportToCsv<T extends Record<string, any>>(data: T[]): string {
    if (data.length === 0) return '';
    return stringify(data, { header: true });
  }

  private extractDomain(url: string): string {
    try {
      const parsed = new URL(url.startsWith('http') ? url : `https://${url}`);
      return parsed.hostname.toLowerCase().replace(/^www\./, '');
    } catch {
      return url.split('/')[0].toLowerCase().replace(/^www\./, '');
    }
  }
}
