import { ipcMain } from 'electron';
import { IPC } from '../../shared/ipc-channels';
import { DocumentAssetRepository } from '../database/repositories/document-assets';
import { ProjectRepository } from '../database/repositories/projects';
import { PdfAnalyzer } from '../agents/submission/pdf-analyzer';
import { PdfGenerator } from '../agents/submission/pdf-generator';
import crypto from 'crypto';

export function registerAssetHandlers(
  assetRepo: DocumentAssetRepository,
  projectRepo: ProjectRepository
) {
  const analyzer = new PdfAnalyzer();
  const generator = new PdfGenerator();

  ipcMain.handle(IPC.ASSETS.GET_ALL, async (_event, projectId: string, options?: any) => {
    return assetRepo.findByProject(projectId, options);
  });

  ipcMain.handle(IPC.ASSETS.CREATE, async (_event, data: any) => {
    return assetRepo.create(data);
  });

  ipcMain.handle(IPC.ASSETS.ANALYZE_PDF, async (_event, filePath: string, targetWebsite?: string) => {
    return analyzer.analyzePdf(filePath, targetWebsite);
  });

  ipcMain.handle(IPC.ASSETS.GENERATE_BRIEF, async (_event, projectId: string, options: any) => {
    const project = projectRepo.findById(projectId);
    if (!project) throw new Error('Project not found');

    const result = await generator.generateAsset(project, options);
    const analysis = await analyzer.analyzePdf(result.filePath, project.website_url || '');

    // Check for duplicate hash
    const existing = assetRepo.findByHash(projectId, analysis.fileHash);
    if (existing) {
      return {
        isDuplicate: true,
        existingAsset: existing,
        message: 'This document has already been generated or uploaded in this project.'
      };
    }

    const created = assetRepo.create({
      id: crypto.randomUUID(),
      project_id: projectId,
      title: options.title,
      asset_type: options.assetType || 'pdf_guide',
      file_path: result.filePath,
      file_name: result.fileName,
      file_hash: analysis.fileHash,
      file_size: result.fileSize,
      author: options.author || project.business_name || 'Team',
      organization: project.business_name || 'Organization',
      website_url: options.targetUrl || project.website_url || null,
      summary: options.summary || null,
      citations_count: analysis.citationsCount,
      urls_detected: JSON.stringify(analysis.urlsDetected),
      quality_score: analysis.qualityScore,
      quality_notes: JSON.stringify(analysis.qualityNotes)
    });

    return {
      isDuplicate: false,
      asset: created,
      analysis
    };
  });

  ipcMain.handle(IPC.ASSETS.DELETE, async (_event, id: string) => {
    return assetRepo.delete(id);
  });
}
