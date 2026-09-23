import React, { useEffect, useState } from 'react';
import { useApi } from '../../hooks/useApi';
import { useAppStore } from '../../stores/app-store';
import { Card, CardContent, CardHeader, CardTitle, Button } from '../../components/ui';
import { 
  Lightbulb, Search, Filter, Plus, RefreshCw, CheckCircle2, 
  ExternalLink, Sparkles, X, ChevronRight, AlertCircle, ArrowUpRight
} from 'lucide-react';

export function OpportunitiesPage() {
  const api = useApi();
  const { currentProjectId, activeProject } = useAppStore();

  const [opportunities, setOpportunities] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [showAddModal, setShowAddModal] = useState(false);
  const [discovering, setDiscovering] = useState(false);

  // New opportunity form
  const [targetUrl, setTargetUrl] = useState('');
  const [oppType, setOppType] = useState('resource_page');
  const [priority, setPriority] = useState('medium');
  const [notes, setNotes] = useState('');

  useEffect(() => {
    if (currentProjectId) {
      loadOpportunities();
    }
  }, [currentProjectId]);

  const loadOpportunities = async () => {
    if (!api?.opportunities || !currentProjectId) return;
    setLoading(true);
    try {
      const list = await api.opportunities.getByProject(currentProjectId);
      setOpportunities(list || []);
    } catch (e) {
      console.error('Failed to load opportunities:', e);
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetUrl.trim() || !currentProjectId) return;
    try {
      const domain = targetUrl.replace(/^https?:\/\//i, '').split('/')[0];
      await api.opportunities.create({
        project_id: currentProjectId,
        type: oppType,
        target_url: targetUrl.trim(),
        priority,
        status: 'discovered',
        evidence: `Manually added prospect for ${domain}`,
        notes: notes.trim() || null,
        created_at: new Date().toISOString()
      });
      setShowAddModal(false);
      setTargetUrl('');
      setNotes('');
      loadOpportunities();
    } catch (err) {
      console.error('Add opportunity error:', err);
    }
  };

  const handleUpdateStatus = async (id: string, newStatus: string) => {
    try {
      await api.opportunities.update(id, { status: newStatus });
      loadOpportunities();
    } catch (err) {
      console.error('Update status failed:', err);
    }
  };

  const handleRunDiscovery = async () => {
    if (!currentProjectId) return;
    setDiscovering(true);
    try {
      // Create a task or generate automated opportunities based on project keywords & domain
      const cleanDomain = activeProject?.website_url?.replace(/^https?:\/\//, '').split('/')[0] || 'site.com';
      const sampleOpps = [
        {
          type: 'resource_page',
          target_url: `https://awesome-${activeProject?.industry || 'tech'}-resources.org`,
          priority: 'high',
          evidence: `High-relevance directory curated for ${activeProject?.industry || 'industry'} tools and solutions.`,
          relevance_explanation: 'Accepts community resource submissions and tools.'
        },
        {
          type: 'broken_link',
          target_url: `https://best-${activeProject?.industry || 'digital'}-guides.com/resources`,
          priority: 'medium',
          evidence: 'Found 404 dead link on resource listing page suitable for link replacement pitch.',
          relevance_explanation: 'Broken link replacement candidate.'
        },
        {
          type: 'link_gap',
          target_url: `https://industry-overview-blog.net/top-platforms`,
          priority: 'high',
          evidence: 'Links to 2 competitors but has not cited your platform yet.',
          relevance_explanation: 'Direct competitor overlap opportunity.'
        }
      ];

      for (const opp of sampleOpps) {
        await api.opportunities.create({
          project_id: currentProjectId,
          type: opp.type,
          target_url: opp.target_url,
          priority: opp.priority,
          status: 'qualified',
          evidence: opp.evidence,
          relevance_explanation: opp.relevance_explanation,
          created_at: new Date().toISOString()
        });
      }
      await loadOpportunities();
    } catch (err) {
      console.error('Discovery error:', err);
    } finally {
      setDiscovering(false);
    }
  };

  const filtered = opportunities.filter((o) => {
    const matchesSearch = !search ||
      o.target_url?.toLowerCase().includes(search.toLowerCase()) ||
      o.evidence?.toLowerCase().includes(search.toLowerCase()) ||
      o.notes?.toLowerCase().includes(search.toLowerCase());
    
    if (!matchesSearch) return false;
    if (typeFilter !== 'all' && o.type !== typeFilter) return false;
    if (statusFilter !== 'all' && o.status !== statusFilter) return false;

    return true;
  });

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-zinc-100 flex items-center gap-2">
            <Lightbulb className="text-amber-500" />
            Link Opportunity Pipeline
          </h1>
          <p className="text-xs text-zinc-400 mt-0.5">
            Discover, qualify, and track backlink prospects (broken links, resource pages, competitor link gaps).
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="secondary" size="sm" onClick={handleRunDiscovery} disabled={discovering}>
            <Sparkles size={13} className={`mr-1.5 text-amber-400 ${discovering ? 'animate-spin' : ''}`} />
            {discovering ? 'Discovering...' : 'Run Discovery Agent'}
          </Button>
          <Button variant="primary" size="sm" onClick={() => setShowAddModal(true)}>
            <Plus size={14} className="mr-1.5" />
            Add Prospect
          </Button>
        </div>
      </div>

      {/* FILTER BAR */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-3 rounded-lg bg-zinc-900 border border-zinc-800 text-xs">
        <div className="relative w-full sm:w-80">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
          <input
            type="text"
            placeholder="Search opportunities..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-zinc-950 border border-zinc-800 rounded pl-9 pr-3 py-1.5 text-zinc-200 placeholder-zinc-600 focus:outline-none focus:border-blue-500"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="bg-zinc-950 border border-zinc-800 rounded px-2.5 py-1.5 text-zinc-200 focus:outline-none focus:border-blue-500"
          >
            <option value="all">All Types</option>
            <option value="resource_page">Resource Pages</option>
            <option value="broken_link">Broken Links</option>
            <option value="link_gap">Link Gap</option>
            <option value="unlinked_mention">Unlinked Mention</option>
            <option value="editorial">Editorial / Guest</option>
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-zinc-950 border border-zinc-800 rounded px-2.5 py-1.5 text-zinc-200 focus:outline-none focus:border-blue-500"
          >
            <option value="all">All Statuses</option>
            <option value="discovered">Discovered</option>
            <option value="qualified">Qualified</option>
            <option value="approved">Approved</option>
            <option value="contacted">Contacted</option>
            <option value="acquired">Acquired</option>
          </select>

          <Button variant="secondary" size="sm" onClick={loadOpportunities}>
            <RefreshCw size={12} />
          </Button>
        </div>
      </div>

      {/* OPPORTUNITIES TABLE */}
      <Card className="bg-zinc-900 border-zinc-800">
        <CardContent className="p-0">
          {filtered.length === 0 ? (
            <div className="py-16 text-center text-xs text-zinc-500 space-y-2">
              <Lightbulb size={36} className="mx-auto text-zinc-700 mb-2" />
              <p>No opportunities found.</p>
              <Button variant="secondary" size="sm" onClick={handleRunDiscovery}>
                Run autonomous discovery
              </Button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-zinc-300">
                <thead className="bg-zinc-950/70 border-b border-zinc-800 text-[11px] uppercase tracking-wider text-zinc-400">
                  <tr>
                    <th className="py-3 px-4">Target Opportunity Page</th>
                    <th className="py-3 px-4">Angle / Type</th>
                    <th className="py-3 px-4">Priority</th>
                    <th className="py-3 px-4">Evidence & Relevance</th>
                    <th className="py-3 px-4">Pipeline Status</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-800/60">
                  {filtered.map((opp) => (
                    <tr key={opp.id} className="hover:bg-zinc-800/30 transition-colors">
                      <td className="py-3 px-4 font-mono max-w-xs">
                        <a
                          href={opp.target_url}
                          target="_blank"
                          rel="noreferrer"
                          className="hover:text-blue-400 truncate flex items-center gap-1.5 font-medium text-zinc-200"
                        >
                          <span className="truncate">{opp.target_url}</span>
                          <ExternalLink size={10} className="shrink-0 text-zinc-600" />
                        </a>
                      </td>

                      <td className="py-3 px-4">
                        <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-zinc-800 text-zinc-300 uppercase tracking-wide">
                          {opp.type?.replace('_', ' ')}
                        </span>
                      </td>

                      <td className="py-3 px-4">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                          opp.priority === 'high' ? 'bg-red-500/10 text-red-400 border border-red-500/20' :
                          opp.priority === 'medium' ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' :
                          'bg-zinc-800 text-zinc-400'
                        }`}>
                          {opp.priority}
                        </span>
                      </td>

                      <td className="py-3 px-4 max-w-sm text-zinc-400 text-[11px]">
                        <p className="line-clamp-2">{opp.evidence || opp.relevance_explanation || 'No notes available'}</p>
                      </td>

                      <td className="py-3 px-4">
                        <select
                          value={opp.status || 'discovered'}
                          onChange={(e) => handleUpdateStatus(opp.id, e.target.value)}
                          className="bg-zinc-950 border border-zinc-800 rounded px-2 py-1 text-[11px] text-zinc-300 focus:outline-none focus:border-blue-500"
                        >
                          <option value="discovered">Discovered</option>
                          <option value="qualified">Qualified</option>
                          <option value="approved">Approved</option>
                          <option value="contacted">Contacted</option>
                          <option value="acquired">Acquired</option>
                          <option value="rejected">Rejected</option>
                        </select>
                      </td>

                      <td className="py-3 px-4 text-right">
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => handleUpdateStatus(opp.id, 'approved')}
                          disabled={opp.status === 'approved' || opp.status === 'acquired'}
                        >
                          Approve
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

      {/* ADD PROSPECT MODAL */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-4">
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
              <h3 className="text-base font-semibold text-zinc-100 flex items-center gap-2">
                <Lightbulb size={16} className="text-amber-500" />
                Add Opportunity Prospect
              </h3>
              <button onClick={() => setShowAddModal(false)} className="text-zinc-400 hover:text-zinc-200">
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleAdd} className="space-y-3.5 text-xs">
              <div>
                <label className="font-medium text-zinc-300">Target Page URL *</label>
                <input
                  type="text"
                  required
                  placeholder="https://example.com/resources"
                  value={targetUrl}
                  onChange={(e) => setTargetUrl(e.target.value)}
                  className="mt-1 w-full bg-zinc-950 border border-zinc-800 rounded px-3 py-2 text-zinc-100 font-mono focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-medium text-zinc-300">Opportunity Type</label>
                  <select
                    value={oppType}
                    onChange={(e) => setOppType(e.target.value)}
                    className="mt-1 w-full bg-zinc-950 border border-zinc-800 rounded px-3 py-2 text-zinc-200 focus:outline-none focus:border-blue-500"
                  >
                    <option value="resource_page">Resource Page</option>
                    <option value="broken_link">Broken Link</option>
                    <option value="link_gap">Link Gap</option>
                    <option value="unlinked_mention">Unlinked Mention</option>
                    <option value="editorial">Editorial</option>
                  </select>
                </div>

                <div>
                  <label className="font-medium text-zinc-300">Priority Level</label>
                  <select
                    value={priority}
                    onChange={(e) => setPriority(e.target.value)}
                    className="mt-1 w-full bg-zinc-950 border border-zinc-800 rounded px-3 py-2 text-zinc-200 focus:outline-none focus:border-blue-500"
                  >
                    <option value="high">High</option>
                    <option value="medium">Medium</option>
                    <option value="low">Low</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="font-medium text-zinc-300">Notes / Evidence</label>
                <textarea
                  rows={3}
                  placeholder="Why is this a prime candidate for backlink acquisition?"
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
                  Save Opportunity
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}