import fs from 'fs';
import path from 'path';
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import { Project, DocumentAssetType } from '../../../shared/types';
import { app } from 'electron';

export interface GeneratePdfOptions {
  title: string;
  assetType: DocumentAssetType;
  author: string;
  summary: string;
  sections: { title: string; content: string }[];
  targetUrl: string;
  outputFileName?: string;
}

export class PdfGenerator {
  /**
   * Generates a clean, professional PDF asset ready for distribution
   */
  public async generateAsset(project: Project, options: GeneratePdfOptions): Promise<{ filePath: string; fileName: string; fileSize: number }> {
    const pdfDoc = await PDFDocument.create();
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

    pdfDoc.setTitle(options.title);
    pdfDoc.setAuthor(options.author || project.business_name || 'Author');
    pdfDoc.setSubject(options.summary);
    pdfDoc.setKeywords(['research', 'report', project.industry || 'industry', 'guide']);

    // Page 1: Cover & Summary
    let page = pdfDoc.addPage([595.28, 841.89]); // A4
    const { width, height } = page.getSize();
    let y = height - 60;

    // Header banner
    page.drawRectangle({
      x: 40,
      y: y - 50,
      width: width - 80,
      height: 60,
      color: rgb(0.06, 0.09, 0.16) // deep zinc / blue tone
    });

    page.drawText(options.title.substring(0, 50), {
      x: 55,
      y: y - 30,
      size: 18,
      font: fontBold,
      color: rgb(1, 1, 1)
    });

    page.drawText(`${project.business_name || 'Organization'} | Official Resource Publication`, {
      x: 55,
      y: y - 44,
      size: 10,
      font,
      color: rgb(0.6, 0.7, 0.85)
    });

    y -= 80;

    // Metadata section
    page.drawText(`Author: ${options.author || project.business_name || 'Team'}`, { x: 40, y, size: 10, font, color: rgb(0.3, 0.3, 0.3) });
    y -= 16;
    page.drawText(`Reference Website: ${options.targetUrl || project.website_url || ''}`, { x: 40, y, size: 10, font: fontBold, color: rgb(0.1, 0.4, 0.8) });
    y -= 16;
    page.drawText(`Published: ${new Date().toLocaleDateString()}`, { x: 40, y, size: 10, font, color: rgb(0.4, 0.4, 0.4) });
    y -= 30;

    // Executive Summary
    page.drawText('Executive Summary', { x: 40, y, size: 14, font: fontBold, color: rgb(0.1, 0.1, 0.1) });
    y -= 20;

    const summaryLines = this.wrapText(options.summary || 'This comprehensive industry document provides structured insights, operational frameworks, and verified references.', 80);
    for (const line of summaryLines) {
      page.drawText(line, { x: 40, y, size: 10.5, font, color: rgb(0.2, 0.2, 0.2) });
      y -= 16;
    }
    y -= 20;

    // Sections
    for (const sec of options.sections) {
      if (y < 120) {
        page = pdfDoc.addPage([595.28, 841.89]);
        y = height - 60;
      }

      page.drawText(sec.title, { x: 40, y, size: 13, font: fontBold, color: rgb(0.08, 0.2, 0.4) });
      y -= 18;

      const lines = this.wrapText(sec.content, 82);
      for (const line of lines) {
        if (y < 60) {
          page = pdfDoc.addPage([595.28, 841.89]);
          y = height - 60;
        }
        page.drawText(line, { x: 40, y, size: 10, font, color: rgb(0.25, 0.25, 0.25) });
        y -= 15;
      }
      y -= 20;
    }

    // Footer with brand & backlink on final page
    if (y < 80) {
      page = pdfDoc.addPage([595.28, 841.89]);
      y = height - 60;
    }

    page.drawLine({
      start: { x: 40, y: 70 },
      end: { x: width - 40, y: 70 },
      thickness: 1,
      color: rgb(0.8, 0.8, 0.8)
    });

    page.drawText(`Source & Citation: ${options.targetUrl || project.website_url || ''}`, {
      x: 40,
      y: 50,
      size: 9,
      font: fontBold,
      color: rgb(0.1, 0.35, 0.75)
    });

    const pdfBytes = await pdfDoc.save();

    // Determine storage directory in userData/assets
    let assetsDir: string;
    try {
      assetsDir = path.join(app.getPath('userData'), 'assets', project.id);
    } catch {
      assetsDir = path.join(process.cwd(), 'temp_assets', project.id);
    }

    fs.mkdirSync(assetsDir, { recursive: true });

    const safeTitle = options.title.replace(/[^a-zA-Z0-9_-]/g, '_').toLowerCase();
    const fileName = options.outputFileName || `${safeTitle}_${Date.now()}.pdf`;
    const filePath = path.join(assetsDir, fileName);

    fs.writeFileSync(filePath, pdfBytes);

    return {
      filePath,
      fileName,
      fileSize: pdfBytes.length
    };
  }

  private wrapText(text: string, maxCharsPerLine: number): string[] {
    const words = text.split(' ');
    const lines: string[] = [];
    let currentLine = '';

    for (const word of words) {
      if ((currentLine + word).length > maxCharsPerLine) {
        lines.push(currentLine.trim());
        currentLine = word + ' ';
      } else {
        currentLine += word + ' ';
      }
    }

    if (currentLine.trim().length > 0) {
      lines.push(currentLine.trim());
    }

    return lines;
  }
}
