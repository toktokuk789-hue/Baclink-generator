import fs from 'fs';
import crypto from 'crypto';
import { PDFDocument } from 'pdf-lib';

export interface PdfAnalysisReport {
  fileHash: string;
  fileSizeBytes: number;
  pageCount: number;
  title: string;
  author: string;
  summary: string;
  urlsDetected: string[];
  citationsCount: number;
  qualityScore: number; // 0 to 100
  qualityNotes: string[];
  hasTargetWebsiteLink: boolean;
}

export class PdfAnalyzer {
  /**
   * Analyzes a PDF document asset before distribution
   */
  public async analyzePdf(filePath: string, targetWebsite?: string): Promise<PdfAnalysisReport> {
    if (!fs.existsSync(filePath)) {
      throw new Error(`File not found: ${filePath}`);
    }

    const fileBuffer = fs.readFileSync(filePath);
    const fileSizeBytes = fileBuffer.length;

    // 1. Calculate SHA-256 file hash for duplicate content protection
    const hashSum = crypto.createHash('sha256');
    hashSum.update(fileBuffer);
    const fileHash = hashSum.digest('hex');

    // 2. Parse PDF structure using pdf-lib
    let pageCount = 0;
    let title = '';
    let author = '';
    let subject = '';

    try {
      const pdfDoc = await PDFDocument.load(fileBuffer, { ignoreEncryption: true });
      pageCount = pdfDoc.getPageCount();
      title = pdfDoc.getTitle() || '';
      author = pdfDoc.getAuthor() || '';
      subject = pdfDoc.getSubject() || '';
    } catch (err: any) {
      console.warn('PDF parsing metadata warning:', err.message);
    }

    // 3. Scan file text for URLs and references
    const fileText = fileBuffer.toString('latin1');
    const urlRegex = /https?:\/\/[^\s"'<>()[\]]+/gi;
    const foundUrls = Array.from(new Set(fileText.match(urlRegex) || []));

    // Normalize URLs
    const cleanUrls = foundUrls.map(u => u.replace(/[\.,;:]+$/, '')).slice(0, 30);

    // Check if target website is mentioned
    let hasTargetWebsiteLink = false;
    if (targetWebsite) {
      const cleanTarget = targetWebsite.replace(/^https?:\/\//i, '').replace(/^www\./i, '').toLowerCase();
      hasTargetWebsiteLink = cleanUrls.some(u => u.toLowerCase().includes(cleanTarget));
    }

    // 4. Citation and reference count
    const citationKeywords = ['references', 'sources', 'bibliography', 'doi.org', 'et al.', 'citations'];
    let citationsCount = 0;
    for (const kw of citationKeywords) {
      const matches = fileText.match(new RegExp(kw, 'gi'));
      if (matches) citationsCount += matches.length;
    }

    // 5. Calculate Quality Score
    const qualityNotes: string[] = [];
    let score = 50; // base score

    if (pageCount >= 3) {
      score += 15;
      qualityNotes.push(`Document depth is solid (${pageCount} pages).`);
    } else {
      qualityNotes.push(`Document is brief (${pageCount} page(s)). Detailed guides perform better.`);
    }

    if (hasTargetWebsiteLink) {
      score += 20;
      qualityNotes.push('Backlink to target website is embedded directly in the document.');
    } else {
      score -= 15;
      qualityNotes.push('Warning: No link to your target website was detected inside this document.');
    }

    if (citationsCount > 0) {
      score += 15;
      qualityNotes.push(`Found evidence of ${citationsCount} academic or industry citations/references.`);
    }

    if (title && title.length > 5) {
      score += 5;
    } else {
      qualityNotes.push('Recommendation: Add a descriptive title in PDF metadata.');
    }

    const finalScore = Math.max(10, Math.min(100, score));

    return {
      fileHash,
      fileSizeBytes,
      pageCount,
      title: title || 'Untitled Document',
      author: author || 'Unknown Author',
      summary: subject || `A ${pageCount}-page asset with ${cleanUrls.length} links and ${citationsCount} citations.`,
      urlsDetected: cleanUrls,
      citationsCount,
      qualityScore: finalScore,
      qualityNotes,
      hasTargetWebsiteLink
    };
  }
}
