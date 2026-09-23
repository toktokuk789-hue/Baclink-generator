import React, { useEffect, useState } from 'react';
import { useApi } from '../../hooks/useApi';
import { useAppStore } from '../../stores/app-store';
import { Card, CardContent, CardHeader, CardTitle, Button, Badge } from '../../components/ui';
import { 
  Search, Play, Square, RefreshCw, ExternalLink, Globe, 
  FileText, Link2, CheckCircle2, AlertTriangle, ShieldCheck
} from 'lucide-react';

export function SiteExplorerPage() {
  const api = useApi();
  const { currentProjectId, activeProject } = useAppStore();

  const [url, setUrl] = useState('');
  const [maxPages, setMaxPages] = useState(25);
  const [crawling, setCrawling] = useState(false);
  const [progress, setProgress] = useState<{ current: number; total: number; status: string; url: string }>({
    current: 0,
    total: 0,
    status: 'idle',
    url: ''
  });
  const [pages, setPages] = useState<any[]>([]);
  const [search, setSearch] = useState('');

  useEffect(() => {
    if (activeProject?.website_url) {
      setUrl(activeProject.website_url);
    }
    if (currentProjectId) {
      loadPages();
    }
  }, [currentProjectId, activeProject]);

  const loadPages = async () => {
    if (!api?.pages || !currentProjectId) return;
    try {
      const list = await api.pages.getByProject(currentProjectId);
      setPages(list || []);
    } catch (e) {
      console.error('Failed to load crawled pages:', e);
    }
  };

  const handleStartCrawl = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!url.trim() || !api?.crawler) return;

    setCrawling(true);
    setProgress({ current: 0, total: maxPages, status: 'running', url });

    try {
      const res = await api.crawler.crawlSite(url, {
        projectId: currentProjectId,
        maxPages: Number(maxPages) || 25,
      });

      if (res?.success) {
        await loadPages();
      }
    } catch (err) {
      console.error('Crawl failed:', err);
    } finally {
      setCrawling(false);
      setProgress(p => ({ ...p, status: 'completed' }));
    }
  };

  const handleStopCrawl = async () => {
    if (!api?.crawler) return;
    try {
      await api.crawler.stop('crawler-task');
      setCrawling(false);
    } catch (err) {
      console.error('Stop crawl failed:', err);
    }
  };

  const filtered = pages.filter((p) => {
    if (!search) return true;
    return p.url?.toLowerCase().includes(search.toLowerCase()) ||
           p.title?.toLowerCase().includes(search.toLowerCase()) ||
           p.h1?.toLowerCase().includes(search.toLowerCase());
  });

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* HEADER */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-zinc-100 flex items-center gap-2">
          <Search className="text-blue-500" />
          Site Explorer & Crawler
        </h1>
        <p className="text-xs text-zinc-400 mt-0.5">
          Crawl website structures, inspect on-page SEO signals, internal links, and indexability.
        </p>
      </div>

      {/* CRAWL CONTROLS */}
      <Card className="bg-zinc-900 border-zinc-800">
        <CardContent className="p-4">
          <form onSubmit={handleStartCrawl} className="flex flex-col sm:flex-row items-center gap-3">
            <div className="relative flex-1 w-full">
              <Globe size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
              <input
                type="text"
                required
                placeholder="https://example.com"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                className="w-full bg-zinc-950 border border-zinc-800 rounded pl-9 pr-3 py-2 text-xs font-mono text-zinc-100 placeholder-zinc-600 focus:outline-none focus:border-blue-500"
              />
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <span className="text-xs text-zinc-400 whitespace-nowrap">Max Pages:</span>
              <input
                type="number"
                min="5"
                max="100"
                value={maxPages}
                onChange={(e) => setMaxPages(Number(e.target.value))}
                className="w-20 bg-zinc-950 border border-zinc-800 rounded px-2.5 py-2 text-xs text-zinc-100 focus:outline-none focus:border-blue-500"
              />

              {!crawling ? (
                <Button variant="primary" type="submit">
                  <Play size={13} className="mr-1.5 fill-current" />
                  Start Crawl
                </Button>
              ) : (
                <Button variant="secondary" type="button" onClick={handleStopCrawl} className="text-red-400 border-red-500/30">
                  <Square size={13} className="mr-1.5 fill-current" />
                  Stop
                </Button>
              )}
            </div>
          </form>

          {crawling && (
            <div className="mt-4 pt-3 border-t border-zinc-800 space-y-2">
              <div className="flex items-center justify-between text-xs text-zinc-300">
                <span className="flex items-center gap-2">
                  <RefreshCw size={13} className="animate-spin text-blue-400" />
                  Crawling: <strong className="font-mono text-blue-400 truncate max-w-md">{progress.url || url}</strong>
                </span>
                <span>{progress.current} pages crawled</span>
              </div>
              <div className="w-full bg-zinc-950 rounded-full h-1.5 overflow-hidden">
                <div 
                  className="bg-blue-500 h-1.5 rounded-full transition-all duration-300"
                  style={{ width: `${Math.min(100, Math.max(10, (progress.current / maxPages) * 100))}%` }}
                />
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* DISCOVERED PAGES TABLE */}
      <Card className="bg-zinc-900 border-zinc-800">
        <CardHeader className="pb-3 border-b border-zinc-800 flex flex-row items-center justify-between">
          <CardTitle className="text-sm font-semibold text-zinc-200">
            Discovered Pages ({pages.length})
          </CardTitle>
          <div className="relative w-64">
            <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-zinc-500" />
            <input
              type="text"
              placeholder="Filter crawled pages..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-zinc-950 border border-zinc-800 rounded pl-8 pr-2.5 py-1 text-xs text-zinc-200 placeholder-zinc-600 focus:outline-none focus:border-blue-500"
            />
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {filtered.length === 0 ? (
            <div className="py-16 text-center text-xs text-zinc-500 space-y-2">
              <Globe size={36} className="mx-auto text-zinc-700 mb-2" />
              <p>No crawled pages yet. Enter a website URL above and click "Start Crawl".</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-zinc-300">
                <thead className="bg-zinc-950/70 border-b border-zinc-800 text-[11px] uppercase tracking-wider text-zinc-400">
                  <tr>
                    <th className="py-3 px-4">Page URL</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4">Page Title</th>
                    <th className="py-3 px-4">H1 Heading</th>
                    <th className="py-3 px-4">Words</th>
                    <th className="py-3 px-4">Links (In / Out)</th>
                    <th className="py-3 px-4">Indexable</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-800/60">
                  {filtered.map((p) => (
                    <tr key={p.id || p.url} className="hover:bg-zinc-800/30 transition-colors">
                      <td className="py-3 px-4 font-mono max-w-xs">
                        <a
                          href={p.url}
                          target="_blank"
                          rel="noreferrer"
                          className="hover:text-blue-400 truncate flex items-center gap-1.5 font-medium text-zinc-200"
                        >
                          <span className="truncate">{p.url}</span>
                          <ExternalLink size={10} className="shrink-0 text-zinc-600" />
                        </a>
                      </td>

                      <td className="py-3 px-4">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          p.http_status === 200 ? 'bg-emerald-500/10 text-emerald-400' : 'bg-amber-500/10 text-amber-400'
                        }`}>
                          {p.http_status || 200}
                        </span>
                      </td>

                      <td className="py-3 px-4 max-w-xs truncate text-zinc-300">
                        {p.title || <span className="text-zinc-600 italic">(none)</span>}
                      </td>

                      <td className="py-3 px-4 max-w-xs truncate text-zinc-400">
                        {p.h1 || <span className="text-zinc-600 italic">(none)</span>}
                      </td>

                      <td className="py-3 px-4 text-zinc-300 font-mono">
                        {p.word_count || 0}
                      </td>

                      <td className="py-3 px-4 text-zinc-400 font-mono text-[11px]">
                        {p.internal_links_count || 0} / {p.external_links_count || 0}
                      </td>

                      <td className="py-3 px-4">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-medium ${
                          p.is_indexable ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-400'
                        }`}>
                          {p.is_indexable ? 'Indexable' : 'NoIndex'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}