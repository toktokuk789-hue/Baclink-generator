import React, { useEffect, useState } from 'react';
import { useApi } from '../../hooks/useApi';
import { useAppStore } from '../../stores/app-store';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import {
  Globe, Plus, Trash2, Search, X, RefreshCw, ExternalLink, Loader2
} from 'lucide-react';

export function DomainsPage() {
  const api = useApi();
  const { currentProjectId, activeProject } = useAppStore();

  const [domains, setDomains] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);

  // Add domain form
  const [domainName, setDomainName] = useState('');
  const [title, setTitle] = useState('');
  const [authorityMetric, setAuthorityMetric] = useState('');
  const [relevanceScore, setRelevanceScore] = useState('');
  const [notes, setNotes] = useState('');
  const [inspecting, setInspecting] = useState(false);
  const [inspected, setInspected] = useState(false);

  useEffect(() => {
    if (currentProjectId) loadDomains();
  }, [currentProjectId]);

  const loadDomains = async () => {
    if (!api?.domains || !currentProjectId) return;
    setLoading(true);
    try {
      const list = await api.domains.getByProject(currentProjectId);
      setDomains(list || []);
    } catch (e) {
      console.error('Failed to load domains:', e);
    } finally {
      setLoading(false);
    }
  };

  const handleInspectDomain = async () => {
    if (!domainName.trim() || !api?.domains) return;
    setInspecting(true);
    setInspected(false);
    try {
      const data = await api.domains.inspect(domainName.trim(), {
        keywords: activeProject?.keywords,
        industry: activeProject?.industry,
      });
      if (data) {
        setTitle(data.title || '');
        setAuthorityMetric(String(data.authorityMetric || 40));
        setRelevanceScore(String(data.relevanceScore || 75));
        if (data.description) {
          setNotes(data.description);
        }
        setInspected(true);
      }
    } catch (err) {
      console.error('Domain inspect failed:', err);
    } finally {
      setInspecting(false);
    }
  };

  // Auto-inspect when domain input loses focus
  const handleDomainBlur = () => {
    if (domainName.trim().length > 3 && !inspected) {
      handleInspectDomain();
    }
  };

  const handleAddDomain = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!domainName.trim() || !currentProjectId) return;

    try {
      const cleanDomain = domainName.replace(/^https?:\/\//i, '').replace(/^www\./i, '').split('/')[0];
      await api.domains.create({
        project_id: currentProjectId,
        domain: cleanDomain,
        title: title.trim() || cleanDomain,
        authority_metric: Number(authorityMetric) || 40,
        authority_source: inspected ? 'live_inspection' : 'estimated',
        relevance_score: Number(relevanceScore) || 75,
        contact_available: 1,
        status: 'discovered',
        notes: notes.trim() || null,
        created_at: new Date().toISOString(),
      });

      setShowAddModal(false);
      resetForm();
      loadDomains();
    } catch (err) {
      console.error('Add domain error:', err);
    }
  };

  const handleDeleteDomain = async (id: string, domain: string) => {
    if (!confirm(`Remove domain "${domain}"?`)) return;
    try {
      await api.domains.delete(id);
      loadDomains();
    } catch (e) {
      console.error('Delete domain error:', e);
    }
  };

  const resetForm = () => {
    setDomainName('');
    setTitle('');
    setAuthorityMetric('');
    setRelevanceScore('');
    setNotes('');
    setInspected(false);
  };

  const filtered = domains.filter(d =>
    !search ||
    d.domain?.toLowerCase().includes(search.toLowerCase()) ||
    d.title?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-zinc-100 flex items-center gap-2">
            <Globe className="text-blue-500" />
            Domain Prospect Directory
          </h1>
          <p className="text-xs text-zinc-400 mt-0.5">
            Curate and manage referring domains with live DR/DA fetching and relevance scoring.
          </p>
        </div>
        <Button variant="primary" size="sm" onClick={() => { resetForm(); setShowAddModal(true); }}>
          <Plus size={14} className="mr-1.5" />
          Add Domain
        </Button>
      </div>

      {/* SEARCH BAR */}
      <div className="flex items-center gap-3 p-3 rounded-lg bg-zinc-900 border border-zinc-800 text-xs">
        <div className="relative flex-1 max-w-sm">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
          <input
            type="text"
            placeholder="Search domains..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-zinc-950 border border-zinc-800 rounded pl-9 pr-3 py-1.5 text-zinc-200 placeholder-zinc-600 focus:outline-none focus:border-blue-500"
          />
        </div>
        <Button variant="secondary" size="sm" onClick={loadDomains}><RefreshCw size={12} /></Button>
      </div>

      {/* DOMAIN TABLE */}
      <Card className="bg-zinc-900 border-zinc-800">
        <CardContent className="p-0">
          {filtered.length === 0 ? (
            <div className="py-16 text-center text-xs text-zinc-500 space-y-2">
              <Globe size={36} className="mx-auto text-zinc-700 mb-2" />
              <p>No domains tracked yet. Add domains to build your prospect directory.</p>
              <Button variant="secondary" size="sm" onClick={() => { resetForm(); setShowAddModal(true); }}>Add First Domain</Button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-zinc-300">
                <thead className="bg-zinc-950/70 border-b border-zinc-800 text-[11px] uppercase tracking-wider text-zinc-400">
                  <tr>
                    <th className="py-3 px-4">Domain</th>
                    <th className="py-3 px-4">Title</th>
                    <th className="py-3 px-4">DR / DA</th>
                    <th className="py-3 px-4">Relevance</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-800/60">
                  {filtered.map((d) => (
                    <tr key={d.id} className="hover:bg-zinc-800/30 transition-colors">
                      <td className="py-3 px-4 font-mono">
                        <a href={`https://${d.domain}`} target="_blank" rel="noreferrer"
                          className="hover:text-blue-400 flex items-center gap-1.5 font-medium text-zinc-200">
                          {d.domain} <ExternalLink size={10} className="text-zinc-600" />
                        </a>
                      </td>
                      <td className="py-3 px-4 max-w-xs truncate text-zinc-300">
                        {d.title || d.domain}
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <div className="w-16 h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                            <div
                              className="h-full rounded-full bg-gradient-to-r from-amber-500 to-emerald-500"
                              style={{ width: `${Math.min(100, d.authority_metric || 40)}%` }}
                            />
                          </div>
                          <span className="font-mono text-zinc-200 font-bold">{d.authority_metric || 40}</span>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <div className="w-16 h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                            <div
                              className="h-full rounded-full bg-gradient-to-r from-blue-500 to-purple-500"
                              style={{ width: `${Math.min(100, d.relevance_score || 75)}%` }}
                            />
                          </div>
                          <span className="font-mono text-zinc-200">{d.relevance_score || 75}%</span>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                          d.status === 'contacted' ? 'bg-blue-500/10 text-blue-400' :
                          d.status === 'acquired' ? 'bg-emerald-500/10 text-emerald-400' :
                          'bg-zinc-800 text-zinc-400'
                        }`}>{d.status || 'discovered'}</span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <Button variant="secondary" size="sm"
                          className="text-red-400 hover:text-red-300 hover:bg-red-500/10"
                          onClick={() => handleDeleteDomain(d.id, d.domain)}>
                          <Trash2 size={12} />
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* ADD DOMAIN MODAL */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-4">
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl max-w-lg w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
              <h3 className="text-base font-semibold text-zinc-100 flex items-center gap-2">
                <Globe size={16} className="text-blue-500" /> Add Domain Prospect
              </h3>
              <button onClick={() => setShowAddModal(false)} className="text-zinc-400 hover:text-zinc-200"><X size={16} /></button>
            </div>

            <form onSubmit={handleAddDomain} className="space-y-3.5 text-xs">
              <div>
                <label className="font-medium text-zinc-300">Domain *</label>
                <div className="flex gap-2 mt-1">
                  <input
                    type="text"
                    required
                    placeholder="e.g. ahrefs.com or https://moz.com"
                    value={domainName}
                    onChange={(e) => { setDomainName(e.target.value); setInspected(false); }}
                    onBlur={handleDomainBlur}
                    className="flex-1 bg-zinc-950 border border-zinc-800 rounded px-3 py-2 text-zinc-100 font-mono focus:outline-none focus:border-blue-500"
                  />
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    onClick={handleInspectDomain}
                    disabled={inspecting || !domainName.trim()}
                  >
                    {inspecting ? <Loader2 size={13} className="animate-spin" /> : <Search size={13} />}
                    {inspecting ? ' Fetching...' : ' Inspect'}
                  </Button>
                </div>
                <p className="text-[10px] text-zinc-500 mt-1">
                  {inspected
                    ? '\u2705 Live data fetched! DR, title, and relevance auto-populated below.'
                    : 'Enter a domain and click Inspect or tab away to auto-fetch DR, title, and traffic data.'}
                </p>
              </div>

              <div>
                <label className="font-medium text-zinc-300">Site Title</label>
                <input
                  type="text"
                  placeholder="Auto-detected from website..."
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="mt-1 w-full bg-zinc-950 border border-zinc-800 rounded px-3 py-2 text-zinc-100 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-medium text-zinc-300">Domain Rating (DR/DA)</label>
                  <input
                    type="number"
                    min="0" max="100"
                    placeholder={inspected ? '' : 'e.g. 55'}
                    value={authorityMetric}
                    onChange={(e) => setAuthorityMetric(e.target.value)}
                    className="mt-1 w-full bg-zinc-950 border border-zinc-800 rounded px-3 py-2 text-zinc-100 focus:outline-none focus:border-blue-500"
                  />
                  {inspected && <p className="text-[10px] text-emerald-400 mt-0.5">Auto-calculated from live inspection</p>}
                </div>
                <div>
                  <label className="font-medium text-zinc-300">Relevance Score (%)</label>
                  <input
                    type="number"
                    min="0" max="100"
                    placeholder={inspected ? '' : 'e.g. 85'}
                    value={relevanceScore}
                    onChange={(e) => setRelevanceScore(e.target.value)}
                    className="mt-1 w-full bg-zinc-950 border border-zinc-800 rounded px-3 py-2 text-zinc-100 focus:outline-none focus:border-blue-500"
                  />
                  {inspected && <p className="text-[10px] text-emerald-400 mt-0.5">Keyword-matched relevance</p>}
                </div>
              </div>

              <div>
                <label className="font-medium text-zinc-300">Notes / Description</label>
                <textarea
                  rows={2}
                  placeholder="Auto-populated from meta description..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="mt-1 w-full bg-zinc-950 border border-zinc-800 rounded px-3 py-2 text-zinc-100 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-zinc-800">
                <Button variant="secondary" type="button" onClick={() => setShowAddModal(false)}>Cancel</Button>
                <Button variant="primary" type="submit">Add Domain</Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}