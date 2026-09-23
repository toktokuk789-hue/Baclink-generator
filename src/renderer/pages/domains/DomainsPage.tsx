import React, { useEffect, useState } from 'react';
import { useApi } from '../../hooks/useApi';
import { useAppStore } from '../../stores/app-store';
import { Card, CardContent, CardHeader, CardTitle, Button, Badge } from '../../components/ui';
import { 
  Globe, Plus, Search, ExternalLink, RefreshCw, X, Shield, Users
} from 'lucide-react';

export function DomainsPage() {
  const api = useApi();
  const { currentProjectId, activeProject } = useAppStore();

  const [domains, setDomains] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);

  // New domain form
  const [domainName, setDomainName] = useState('');
  const [title, setTitle] = useState('');
  const [authorityMetric, setAuthorityMetric] = useState(45);
  const [relevanceScore, setRelevanceScore] = useState(80);
  const [notes, setNotes] = useState('');

  useEffect(() => {
    if (currentProjectId) {
      loadDomains();
    }
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
        authority_source: 'estimated',
        relevance_score: Number(relevanceScore) || 75,
        contact_available: 1,
        status: 'discovered',
        notes: notes.trim() || null,
        created_at: new Date().toISOString(),
      });

      setShowAddModal(false);
      setDomainName('');
      setTitle('');
      setNotes('');
      loadDomains();
    } catch (err) {
      console.error('Add domain error:', err);
    }
  };

  const filtered = domains.filter((d) => {
    if (!search) return true;
    return d.domain?.toLowerCase().includes(search.toLowerCase()) ||
           d.title?.toLowerCase().includes(search.toLowerCase());
  });

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-zinc-100 flex items-center gap-2">
            <Globe className="text-blue-500" />
            Domains Directory
          </h1>
          <p className="text-xs text-zinc-400 mt-0.5">
            Discovered link prospects and referring domains for {activeProject?.name || 'current project'}.
          </p>
        </div>

        <Button variant="primary" size="sm" onClick={() => setShowAddModal(true)}>
          <Plus size={14} className="mr-1.5" />
          Add Domain
        </Button>
      </div>

      {/* SEARCH BAR */}
      <div className="flex items-center justify-between gap-3 p-3 rounded-lg bg-zinc-900 border border-zinc-800 text-xs">
        <div className="relative w-full sm:w-80">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
          <input
            type="text"
            placeholder="Search domains..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-zinc-950 border border-zinc-800 rounded pl-9 pr-3 py-1.5 text-zinc-200 placeholder-zinc-600 focus:outline-none focus:border-blue-500"
          />
        </div>

        <Button variant="secondary" size="sm" onClick={loadDomains}>
          <RefreshCw size={12} className="mr-1" />
          Refresh
        </Button>
      </div>

      {/* DOMAINS TABLE */}
      <Card className="bg-zinc-900 border-zinc-800">
        <CardContent className="p-0">
          {filtered.length === 0 ? (
            <div className="py-16 text-center text-xs text-zinc-500 space-y-2">
              <Globe size={36} className="mx-auto text-zinc-700 mb-2" />
              <p>No domains recorded yet.</p>
              <Button variant="secondary" size="sm" onClick={() => setShowAddModal(true)}>
                Add your first domain prospect
              </Button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-zinc-300">
                <thead className="bg-zinc-950/70 border-b border-zinc-800 text-[11px] uppercase tracking-wider text-zinc-400">
                  <tr>
                    <th className="py-3 px-4">Domain Name</th>
                    <th className="py-3 px-4">Authority (DA)</th>
                    <th className="py-3 px-4">Relevance Score</th>
                    <th className="py-3 px-4">Contacts</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4">Added</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-800/60">
                  {filtered.map((d) => (
                    <tr key={d.id} className="hover:bg-zinc-800/30 transition-colors">
                      <td className="py-3 px-4 font-mono">
                        <a
                          href={`https://${d.domain}`}
                          target="_blank"
                          rel="noreferrer"
                          className="hover:text-blue-400 flex items-center gap-1.5 font-medium text-zinc-200"
                        >
                          {d.domain}
                          <ExternalLink size={10} className="text-zinc-600" />
                        </a>
                        {d.title && d.title !== d.domain && (
                          <div className="text-[11px] text-zinc-500 font-sans">{d.title}</div>
                        )}
                      </td>

                      <td className="py-3 px-4">
                        <span className="font-semibold text-zinc-100">{d.authority_metric || '40'}</span>
                        <span className="text-[10px] text-zinc-500 ml-1">/ 100</span>
                      </td>

                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <div className="w-16 bg-zinc-800 rounded-full h-1.5 overflow-hidden">
                            <div 
                              className="bg-blue-500 h-1.5 rounded-full" 
                              style={{ width: `${Math.min(100, d.relevance_score || 70)}%` }}
                            />
                          </div>
                          <span className="font-medium text-blue-400">{d.relevance_score || 70}%</span>
                        </div>
                      </td>

                      <td className="py-3 px-4">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-medium ${
                          d.contact_available ? 'bg-emerald-500/10 text-emerald-400' : 'bg-zinc-800 text-zinc-500'
                        }`}>
                          {d.contact_available ? 'Available' : 'None'}
                        </span>
                      </td>

                      <td className="py-3 px-4">
                        <span className="px-2 py-0.5 rounded text-[10px] bg-zinc-800 text-zinc-300 font-medium uppercase">
                          {d.status || 'discovered'}
                        </span>
                      </td>

                      <td className="py-3 px-4 text-zinc-500 text-[11px]">
                        {d.created_at ? new Date(d.created_at).toLocaleDateString() : 'Recent'}
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
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
              <h3 className="text-base font-semibold text-zinc-100 flex items-center gap-2">
                <Globe size={16} className="text-blue-500" />
                Add Target Domain
              </h3>
              <button onClick={() => setShowAddModal(false)} className="text-zinc-400 hover:text-zinc-200">
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleAddDomain} className="space-y-3.5 text-xs">
              <div>
                <label className="font-medium text-zinc-300">Domain Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. techcrunch.com"
                  value={domainName}
                  onChange={(e) => setDomainName(e.target.value)}
                  className="mt-1 w-full bg-zinc-950 border border-zinc-800 rounded px-3 py-2 text-zinc-100 font-mono focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="font-medium text-zinc-300">Domain / Publication Title</label>
                <input
                  type="text"
                  placeholder="e.g. TechCrunch"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="mt-1 w-full bg-zinc-950 border border-zinc-800 rounded px-3 py-2 text-zinc-100 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-medium text-zinc-300">Estimated DA (0-100)</label>
                  <input
                    type="number"
                    min="1"
                    max="100"
                    value={authorityMetric}
                    onChange={(e) => setAuthorityMetric(Number(e.target.value))}
                    className="mt-1 w-full bg-zinc-950 border border-zinc-800 rounded px-3 py-2 text-zinc-100 focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="font-medium text-zinc-300">Relevance Score %</label>
                  <input
                    type="number"
                    min="1"
                    max="100"
                    value={relevanceScore}
                    onChange={(e) => setRelevanceScore(Number(e.target.value))}
                    className="mt-1 w-full bg-zinc-950 border border-zinc-800 rounded px-3 py-2 text-zinc-100 focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="font-medium text-zinc-300">Notes / Context</label>
                <textarea
                  rows={2}
                  placeholder="Why is this domain relevant to our backlink strategy?"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="mt-1 w-full bg-zinc-950 border border-zinc-800 rounded px-3 py-2 text-zinc-100 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-zinc-800">
                <Button variant="secondary" type="button" onClick={() => setShowAddModal(false)}>
                  Cancel
                </Button>
                <Button variant="primary" type="submit">
                  Save Domain
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}