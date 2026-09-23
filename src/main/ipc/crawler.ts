import { ipcMain } from 'electron';
import { IPC } from '../../shared/ipc-channels';
import { CrawlerService } from '../services/crawler';
import { PageRepository } from '../database/repositories/pages';
import { ProjectRepository } from '../database/repositories/projects';

export function registerCrawlerHandlers(pageRepo: PageRepository, projectRepo: ProjectRepository) {
  const crawler = new CrawlerService();
  let activeProgress = { current: 0, total: 0, status: 'idle', url: '' };

  ipcMain.handle(IPC.CRAWLER.CRAWL_SITE, async (event, url: string, options?: { projectId?: string; maxPages?: number; maxDepth?: number }) => {
    let targetUrl = url;
    let projectId = options?.projectId;

    if (!projectId) {
      const allProjects = projectRepo.findAll();
      const matched = allProjects.find(p => p.website_url && url.includes(p.website_url.replace(/^https?:\/\//, '')));
      projectId = matched ? matched.id : allProjects[0]?.id || 'default';
    }

    if (!targetUrl.startsWith('http')) {
      targetUrl = `https://${targetUrl}`;
    }

    activeProgress = { current: 0, total: options?.maxPages || 20, status: 'running', url: targetUrl };

    try {
      const results = await crawler.crawlSite({
        projectId,
        baseUrl: targetUrl,
        maxPages: options?.maxPages || 25,
        maxDepth: options?.maxDepth || 2,
        onPageCrawled: (page, current, total) => {
          activeProgress = { current, total, status: 'running', url: page.url || '' };
          event.sender.send('crawler:page-crawled', { page, current, total });
        }
      });

      // Persist results into database
      for (const p of results) {
        if (p.url && projectId) {
          const existing = pageRepo.findByUrl(projectId, p.url);
          if (existing) {
            pageRepo.update(existing.id, p as any);
          } else {
            pageRepo.create({
              ...p,
              project_id: projectId,
            } as any);
          }
        }
      }

      activeProgress = { current: results.length, total: results.length, status: 'completed', url: targetUrl };
      return { success: true, count: results.length, pages: results };
    } catch (err: any) {
      activeProgress = { current: 0, total: 0, status: 'failed', url: targetUrl };
      return { success: false, error: err.message };
    }
  });

  ipcMain.handle(IPC.CRAWLER.GET_PROGRESS, async () => {
    return activeProgress;
  });

  ipcMain.handle(IPC.CRAWLER.STOP, async () => {
    crawler.cancel();
    activeProgress.status = 'stopped';
    return { success: true };
  });
}
