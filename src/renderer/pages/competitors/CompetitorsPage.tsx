import React, { useEffect, useState } from 'react';
import { useApi } from '../../hooks/useApi';
import { useAppStore } from '../../stores/app-store';
import { Card, CardContent, CardHeader, CardTitle, Button } from '../../components/ui';
import { Users, Plus, Trash2, ExternalLink, Search, X, RefreshCw } from 'lucide-react';

export function CompetitorsPage() {
  const api = useApi();
  const { currentProjectId, activeProject } = useAppStore();

  const [competitors, setCompetitors] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);

  const [domain, setDomain] = useState('');
  const [name, setName] = useState('');
  const [notes, setNotes] = useState('');

  useEffect(() => {
    if (currentProjectId) loadCompetitors();
  }, [currentProjectId]);

  const loadCompetitors = async () => {
    if (!api?.competitors || !currentProjectId) return;
    setLoading(true);
    try {
      const list = await api.competitors.getByProject(currentProjectId);
      setCompetitors(list || []);
    } catch (e) {
      console.error('Failed to load competitors:', e);
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!domain.trim() || !currentProjectId) return;
    try {
      const cleanDomain = domain.replace(/^https?:\/\//i, '').replace(/^www\./i, '').split('/')[0];
      await api.competitors.create({
        project_id: currentProjectId,
        domain: cleanDomain,
        name: name.trim() || cleanDomain,
        url: `https://${cleanDomain}`,
        status: 'active',
        notes: notes.trim() || null,
      });
      setShowAddModal(false);
      setDomain(''); setName(''); setNotes('');
      loadCompetitors();
    } catch (err) {
      console.error('Add competitor error:', err);
    }
  };

  const handleDelete = async (id: string, domainName: string) => {
    if (!confirm(`Remove competitor "${domainName}"?`)) return;
    try {
      await api.competitors.delete(id);
      loadCompetitors();
    } catch (e) {
      console.error('Delete failed:', e);
    }
  };

  const filtered = competitors.filter(c =>
    !search || c.domain?.toLowerCase().includes(search.toLowerCase()) || c.name?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-zinc-100 flex items-center gap-2">
            <Users className="text-orange-500" />
            Competitor Intelligence
          </h1>
          <p className="text-xs text-zinc-400 mt-0.5">
            Track competitor domains to uncover link gaps and new backlink opportunities.
          </p>
        </div>
        <Button variant="primary" size="sm" onClick={() => setShowAddModal(true)}>
          <Plus size={14} className="mr-1.5" />
          Add Competitor
        </Button>
      </div>

      <div className="flex items-center gap-3 p-3 rounded-lg bg-zinc-900 border border-zinc-800 text-xs">
        <div className="relative flex-1 max-w-sm">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
          <input type="text" placeholder="Search competitors..." value={search} onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-zinc-950 border border-zinc-800 rounded pl-9 pr-3 py-1.5 text-zinc-200 placeholder-zinc-600 focus:outline-none focus:border-blue-500" />
        </div>
        <Button variant="secondary" size="sm" onClick={loadCompetitors}><RefreshCw size={12} /></Button>
      </div>

      {filtered.length === 0 ? (
        <div className="py-16 text-center text-xs text-zinc-500 space-y-2">
          <Users size={36} className="mx-auto text-zinc-700 mb-2" />
          <p>No competitors added yet. Add your top competitors to discover link gaps.</p>
          <Button variant="secondary" size="sm" onClick={() => setShowAddModal(true)}>Add Competitor</Button>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filtered.map((c) => (
            <Card key={c.id} className="bg-zinc-900 border-zinc-800 hover:border-zinc-700 transition-all">
              <CardHeader className="pb-2 flex flex-row items-start justify-between">
                <div>
                  <CardTitle className="text-sm font-semibold text-zinc-100">{c.name || c.domain}</CardTitle>
                  <a href={`https://${c.domain}`} target="_blank" rel="noreferrer"
                    className="text-xs font-mono text-zinc-400 hover:text-blue-400 flex items-center gap-1 mt-0.5">
                    {c.domain} <ExternalLink size={10} />
                  </a>
                </div>
                <span className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                  c.status === 'active' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-zinc-800 text-zinc-400'
                }`}>{c.status}</span>
              </CardHeader>
              <CardContent className="text-xs space-y-3">
                {c.notes && <p className="text-[11px] text-zinc-400 italic line-clamp-2">"{c.notes}"</p>}
                <div className="text-[11px] text-zinc-500">
                  Added: {c.created_at ? new Date(c.created_at).toLocaleDateString() : 'Recently'}
                </div>
                <div className="flex items-center justify-between pt-2 border-t border-zinc-800">
                  <Button variant="secondary" size="sm" className="text-red-400 hover:text-red-300 hover:bg-red-500/10"
                    onClick={() => handleDelete(c.id, c.domain)}>
                    <Trash2 size={12} className="mr-1" /> Remove
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-4">
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
              <h3 className="text-base font-semibold text-zinc-100 flex items-center gap-2">
                <Users size={16} className="text-orange-500" /> Add Competitor
              </h3>
              <button onClick={() => setShowAddModal(false)} className="text-zinc-400 hover:text-zinc-200"><X size={16} /></button>
            </div>
            <form onSubmit={handleAdd} className="space-y-3.5 text-xs">
              <div>
                <label className="font-medium text-zinc-300">Competitor Domain *</label>
                <input type="text" required placeholder="e.g. ahrefs.com" value={domain} onChange={(e) => setDomain(e.target.value)}
                  className="mt-1 w-full bg-zinc-950 border border-zinc-800 rounded px-3 py-2 text-zinc-100 font-mono focus:outline-none focus:border-blue-500" />
              </div>
              <div>
                <label className="font-medium text-zinc-300">Company / Brand Name</label>
                <input type="text" placeholder="e.g. Ahrefs" value={name} onChange={(e) => setName(e.target.value)}
                  className="mt-1 w-full bg-zinc-950 border border-zinc-800 rounded px-3 py-2 text-zinc-100 focus:outline-none focus:border-blue-500" />
              </div>
              <div>
                <label className="font-medium text-zinc-300">Notes</label>
                <textarea rows={2} placeholder="Why are they a competitor?" value={notes} onChange={(e) => setNotes(e.target.value)}
                  className="mt-1 w-full bg-zinc-950 border border-zinc-800 rounded px-3 py-2 text-zinc-100 focus:outline-none focus:border-blue-500" />
              </div>
              <div className="flex items-center justify-end gap-2 pt-3 border-t border-zinc-800">
                <Button variant="secondary" type="button" onClick={() => setShowAddModal(false)}>Cancel</Button>
                <Button variant="primary" type="submit">Add Competitor</Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}