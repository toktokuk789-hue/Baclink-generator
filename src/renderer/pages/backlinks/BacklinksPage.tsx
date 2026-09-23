import React, { useEffect, useState } from 'react';
import { useApi } from '../../hooks/useApi';
import { useAppStore } from '../../stores/app-store';
import { Card, CardContent, CardHeader, CardTitle, Button, Badge } from '../../components/ui';
import { 
  Link as LinkIcon, Plus, Upload, Download, Search, 
  ExternalLink, CheckCircle2, AlertCircle, RefreshCw, X, Filter
} from 'lucide-react';

export function BacklinksPage() {
  const api = useApi();
  const { currentProjectId, activeProject } = useAppStore();

  const [backlinks, setBacklinks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState('all'); // all, dofollow, nofollow, active, lost
  const [showAddModal, setShowAddModal] = useState(false);
  const [importing, setImporting] = useState(false);
  const [verifyingId, setVerifyingId] = useState<string | null>(null);

  // New backlink form
  const [sourceUrl, setSourceUrl] = useState('');
  const [targetUrl, setTargetUrl] = useState('');
  const [anchorText, setAnchorText] = useState('');
  const [isDofollow, setIsDofollow] = useState(true);

  useEffect(() => {
    if (currentProjectId) {
      loadBacklinks();
    }
  }, [currentProjectId]);

  const loadBacklinks = async () => {
    if (!api?.backlinks || !currentProjectId) return;
    setLoading(true);
    try {
      const list = await api.backlinks.getByProject(currentProjectId);
      setBacklinks(list || []);
    } catch (e) {
      console.error('Failed to load backlinks:', e);
    } finally {
      setLoading(false);
    }
  };

  const handleAddBacklink = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!sourceUrl.trim() || !targetUrl.trim() || !currentProjectId) return;

    try {
      const sourceDomain = sourceUrl.replace(/^https?:\/\//i, '').replace(/^www\./i, '').split('/')[0];
      const targetDomain = targetUrl.replace(/^https?:\/\//i, '').replace(/^www\./i, '').split('/')[0];

      await api.backlinks.create({
        project_id: currentProjectId,
        source_url: sourceUrl.trim(),
        source_domain: sourceDomain,
        target_url: targetUrl.trim(),
        target_domain: targetDomain,
        anchor_text: anchorText.trim() || null,
        link_type: 'text',
        is_dofollow: isDofollow ? 1 : 0,
        is_nofollow: isDofollow ? 0 : 1,
        is_sponsored: 0,
        is_ugc: 0,
        http_status: 200,
        status: 'active',
        first_discovered: new Date().toISOString(),
        last_verified: new Date().toISOString(),
      });

      setShowAddModal(false);
      setSourceUrl('');
      setTargetUrl('');
      setAnchorText('');
      loadBacklinks();
    } catch (err) {
      console.error('Add backlink failed:', err);
    }
  };

  const handleImportCsv = async () => {
    if (!api?.import?.csv || !currentProjectId) return;
    setImporting(true);
    try {
      const res = await api.import.csv(undefined, { projectId: currentProjectId });
      if (res?.success) {
        alert(`Successfully imported ${res.imported} backlinks from CSV!`);
        loadBacklinks();
      }
    } catch (err) {
      console.error('CSV import error:', err);
    } finally {
      setImporting(false);
    }
  };

  const handleExportCsv = async () => {
    if (!api?.export?.csv || !currentProjectId) return;
    try {
      const res = await api.export.csv(currentProjectId, 'backlinks');
      if (res?.success) {
        alert(`Exported ${res.count} backlinks to ${res.filePath}`);
      }
    } catch (err) {
      console.error('Export error:', err);
    }
  };

  const filtered = backlinks.filter((b) => {
    const matchesSearch = !search || 
      b.source_url?.toLowerCase().includes(search.toLowerCase()) ||
      b.anchor_text?.toLowerCase().includes(search.toLowerCase()) ||
      b.target_url?.toLowerCase().includes(search.toLowerCase());

    if (!matchesSearch) return false;

    if (filterType === 'dofollow') return b.is_dofollow === 1;
    if (filterType === 'nofollow') return b.is_nofollow === 1;
    if (filterType === 'active') return b.status === 'active';
    if (filterType === 'lost') return b.status === 'lost';

    return true;
  });

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-zinc-100 flex items-center gap-2">
            <LinkIcon className="text-emerald-500" />
            Backlinks Manager
          </h1>
          <p className="text-xs text-zinc-400 mt-0.5">
            Total Backlinks: <span className="font-semibold text-zinc-200">{backlinks.length}</span> recorded for {activeProject?.name || 'current project'}.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="secondary" size="sm" onClick={handleImportCsv} disabled={importing}>
            <Upload size={13} className="mr-1.5" />
            {importing ? 'Importing...' : 'Import CSV'}
          </Button>
          <Button variant="secondary" size="sm" onClick={handleExportCsv} disabled={backlinks.length === 0}>
            <Download size={13} className="mr-1.5" />
            Export CSV
          </Button>
          <Button variant="primary" size="sm" onClick={() => {
            setTargetUrl(activeProject?.website_url || '');
            setShowAddModal(true);
          }}>
            <Plus size={14} className="mr-1.5" />
            Add Backlink
          </Button>
        </div>
      </div>

      {/* FILTER & SEARCH BAR */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-3 rounded-lg bg-zinc-900 border border-zinc-800 text-xs">
        <div className="relative w-full sm:w-80">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
          <input
            type="text"
            placeholder="Search URL or anchor text..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-zinc-950 border border-zinc-800 rounded pl-9 pr-3 py-1.5 text-zinc-200 placeholder-zinc-600 focus:outline-none focus:border-blue-500"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Filter size={13} className="text-zinc-500" />
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="bg-zinc-950 border border-zinc-800 rounded px-2.5 py-1.5 text-zinc-200 focus:outline-none focus:border-blue-500"
          >
            <option value="all">All Backlinks ({backlinks.length})</option>
            <option value="dofollow">DoFollow Only</option>
            <option value="nofollow">NoFollow Only</option>
            <option value="active">Active Only</option>
            <option value="lost">Lost / Inactive Only</option>
          </select>
          <Button variant="secondary" size="sm" onClick={loadBacklinks}>
            <RefreshCw size={12} />
          </Button>
        </div>
      </div>

      {/* BACKLINKS DATA TABLE */}
      <Card className="bg-zinc-900 border-zinc-800">
        <CardContent className="p-0">
          {filtered.length === 0 ? (
            <div className="py-16 text-center text-xs text-zinc-500 space-y-2">
              <LinkIcon size={36} className="mx-auto text-zinc-700 mb-2" />
              <p>No backlinks found matching your query.</p>
              <Button variant="secondary" size="sm" onClick={() => setShowAddModal(true)}>
                Add your first backlink
              </Button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-zinc-300">
                <thead className="bg-zinc-950/70 border-b border-zinc-800 text-[11px] uppercase tracking-wider text-zinc-400">
                  <tr>
                    <th className="py-3 px-4">Referring Source Page</th>
                    <th className="py-3 px-4">Target Landing URL</th>
                    <th className="py-3 px-4">Anchor Text</th>
                    <th className="py-3 px-4">Attribution</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4">Discovered</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-800/60">
                  {filtered.map((b) => (
                    <tr key={b.id} className="hover:bg-zinc-800/30 transition-colors">
                      <td className="py-3 px-4 font-mono max-w-xs">
                        <a
                          href={b.source_url}
                          target="_blank"
                          rel="noreferrer"
                          className="hover:text-blue-400 truncate flex items-center gap-1.5"
                        >
                          <span className="truncate">{b.source_url}</span>
                          <ExternalLink size={10} className="shrink-0 text-zinc-600" />
                        </a>
                        <span className="text-[10px] text-zinc-500">{b.source_domain}</span>
                      </td>

                      <td className="py-3 px-4 font-mono max-w-xs truncate text-zinc-400">
                        {b.target_url}
                      </td>

                      <td className="py-3 px-4 font-medium text-zinc-200">
                        {b.anchor_text || <span className="text-zinc-600 italic">(none / image)</span>}
                      </td>

                      <td className="py-3 px-4">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                          b.is_dofollow ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-zinc-800 text-zinc-400'
                        }`}>
                          {b.is_dofollow ? 'DoFollow' : 'NoFollow'}
                        </span>
                      </td>

                      <td className="py-3 px-4">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-medium ${
                          b.status === 'active' ? 'bg-blue-500/10 text-blue-400' : 'bg-red-500/10 text-red-400'
                        }`}>
                          {b.status}
                        </span>
                      </td>

                      <td className="py-3 px-4 text-zinc-500 text-[11px]">
                        {b.first_discovered ? new Date(b.first_discovered).toLocaleDateString() : 'Recent'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* ADD BACKLINK MODAL */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-4">
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
              <h3 className="text-base font-semibold text-zinc-100 flex items-center gap-2">
                <LinkIcon size={16} className="text-emerald-500" />
                Add Backlink Record
              </h3>
              <button onClick={() => setShowAddModal(false)} className="text-zinc-400 hover:text-zinc-200">
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleAddBacklink} className="space-y-3.5 text-xs">
              <div>
                <label className="font-medium text-zinc-300">Source Page URL *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. https://example.com/blog/best-tools"
                  value={sourceUrl}
                  onChange={(e) => setSourceUrl(e.target.value)}
                  className="mt-1 w-full bg-zinc-950 border border-zinc-800 rounded px-3 py-2 text-zinc-100 font-mono focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="font-medium text-zinc-300">Target URL (Your site) *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. https://mywebsite.com"
                  value={targetUrl}
                  onChange={(e) => setTargetUrl(e.target.value)}
                  className="mt-1 w-full bg-zinc-950 border border-zinc-800 rounded px-3 py-2 text-zinc-100 font-mono focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="font-medium text-zinc-300">Anchor Text</label>
                <input
                  type="text"
                  placeholder="e.g. best software"
                  value={anchorText}
                  onChange={(e) => setAnchorText(e.target.value)}
                  className="mt-1 w-full bg-zinc-950 border border-zinc-800 rounded px-3 py-2 text-zinc-100 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="dofollow"
                  checked={isDofollow}
                  onChange={(e) => setIsDofollow(e.target.checked)}
                  className="rounded bg-zinc-950 border-zinc-800"
                />
                <label htmlFor="dofollow" className="text-zinc-300 select-none">
                  DoFollow link (passes PageRank)
                </label>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-zinc-800">
                <Button variant="secondary" type="button" onClick={() => setShowAddModal(false)}>
                  Cancel
                </Button>
                <Button variant="primary" type="submit">
                  Save Backlink
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}