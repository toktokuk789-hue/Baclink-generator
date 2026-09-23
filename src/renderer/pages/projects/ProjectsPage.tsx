import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApi } from '../../hooks/useApi';
import { useAppStore } from '../../stores/app-store';
import { Card, CardContent, CardHeader, CardTitle, Button, EmptyState } from '../../components/ui';
import { 
  FolderKanban, Plus, Globe, Trash2, Edit3, CheckCircle2, 
  ExternalLink, ArrowRight, Shield, Zap, X
} from 'lucide-react';

export function ProjectsPage() {
  const api = useApi();
  const navigate = useNavigate();
  const { currentProjectId, setCurrentProjectId, setActiveProject } = useAppStore();

  const [projects, setProjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingProject, setEditingProject] = useState<any | null>(null);

  // Form State
  const [name, setName] = useState('');
  const [url, setUrl] = useState('');
  const [industry, setIndustry] = useState('');
  const [country, setCountry] = useState('United States');
  const [automationMode, setAutomationMode] = useState<'manual' | 'assisted' | 'autonomous'>('assisted');
  const [description, setDescription] = useState('');

  useEffect(() => {
    loadProjects();
  }, []);

  const loadProjects = async () => {
    if (!api?.projects) return;
    setLoading(true);
    try {
      const list = await api.projects.getAll();
      setProjects(list || []);
    } catch (e) {
      console.error('Failed to load projects:', e);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenCreate = () => {
    setEditingProject(null);
    setName('');
    setUrl('');
    setIndustry('');
    setCountry('United States');
    setAutomationMode('assisted');
    setDescription('');
    setShowModal(true);
  };

  const handleOpenEdit = (p: any) => {
    setEditingProject(p);
    setName(p.name || '');
    setUrl(p.website_url || '');
    setIndustry(p.industry || '');
    setCountry(p.country || 'United States');
    setAutomationMode(p.automation_mode || 'assisted');
    setDescription(p.business_description || '');
    setShowModal(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!url.trim()) return;

    const cleanUrl = url.startsWith('http') ? url : `https://${url}`;
    const projName = name.trim() || cleanUrl.replace(/^https?:\/\//, '').split('/')[0];

    try {
      if (editingProject) {
        await api.projects.update(editingProject.id, {
          name: projName,
          website_url: cleanUrl,
          business_name: projName,
          industry,
          country,
          automation_mode: automationMode,
          business_description: description,
        });
      } else {
        const created = await api.projects.create({
          name: projName,
          website_url: cleanUrl,
          business_name: projName,
          industry,
          country,
          automation_mode: automationMode,
          business_description: description,
          language: 'en',
          status: 'active'
        });
        if (created?.id) {
          setCurrentProjectId(created.id);
          setActiveProject(created);
        }
      }
      setShowModal(false);
      loadProjects();
    } catch (err) {
      console.error('Save project error:', err);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (confirm(`Are you sure you want to delete project "${name}"? All associated backlinks and data will be removed.`)) {
      try {
        await api.projects.delete(id);
        if (currentProjectId === id) {
          setCurrentProjectId(null);
          setActiveProject(null);
        }
        loadProjects();
      } catch (e) {
        console.error('Delete project failed:', e);
      }
    }
  };

  const handleSetActive = (p: any) => {
    setCurrentProjectId(p.id);
    setActiveProject(p);
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* HEADER */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-zinc-100 flex items-center gap-2">
            <FolderKanban className="text-blue-500" />
            Projects
          </h1>
          <p className="text-xs text-zinc-400 mt-0.5">
            Manage your websites, domains, and individual SEO intelligence workspaces.
          </p>
        </div>

        <Button variant="primary" onClick={handleOpenCreate}>
          <Plus size={14} className="mr-1.5" />
          New Project
        </Button>
      </div>

      {/* PROJECT GRID */}
      {projects.length === 0 && !loading ? (
        <div className="py-16 text-center">
          <EmptyState
            icon={<FolderKanban size={48} className="text-zinc-600" />}
            title="No projects found"
            description="Create your first project to begin discovering backlinks and opportunities."
            actionLabel="Create Project"
            onAction={handleOpenCreate}
          />
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {projects.map((p) => {
            const isCurrent = currentProjectId === p.id;
            return (
              <Card 
                key={p.id} 
                className={`bg-zinc-900 border transition-all ${
                  isCurrent ? 'border-blue-500/80 shadow-lg shadow-blue-500/5' : 'border-zinc-800 hover:border-zinc-700'
                }`}
              >
                <CardHeader className="pb-3 flex flex-row items-start justify-between">
                  <div>
                    <CardTitle className="text-base font-semibold text-zinc-100">{p.name || p.website_url}</CardTitle>
                    <a
                      href={p.website_url}
                      target="_blank"
                      rel="noreferrer"
                      className="text-xs font-mono text-zinc-400 hover:text-blue-400 flex items-center gap-1 mt-1 truncate max-w-[240px]"
                    >
                      <Globe size={11} className="shrink-0" />
                      <span className="truncate">{p.website_url}</span>
                    </a>
                  </div>

                  {isCurrent && (
                    <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-blue-500/20 text-blue-400 border border-blue-500/30">
                      ACTIVE
                    </span>
                  )}
                </CardHeader>

                <CardContent className="space-y-3 text-xs">
                  <div className="grid grid-cols-2 gap-2 text-[11px] bg-zinc-950 p-2.5 rounded border border-zinc-800/60">
                    <div>
                      <span className="text-zinc-500">Industry:</span>
                      <div className="font-medium text-zinc-300 truncate">{p.industry || 'General'}</div>
                    </div>
                    <div>
                      <span className="text-zinc-500">Country:</span>
                      <div className="font-medium text-zinc-300 truncate">{p.country || 'Global'}</div>
                    </div>
                    <div>
                      <span className="text-zinc-500">Mode:</span>
                      <div className="font-medium text-blue-400 uppercase">{p.automation_mode || 'assisted'}</div>
                    </div>
                    <div>
                      <span className="text-zinc-500">Created:</span>
                      <div className="text-zinc-400">{p.created_at ? new Date(p.created_at).toLocaleDateString() : 'Recent'}</div>
                    </div>
                  </div>

                  {p.business_description && (
                    <p className="text-[11px] text-zinc-400 line-clamp-2 italic">
                      "{p.business_description}"
                    </p>
                  )}

                  <div className="flex items-center justify-between pt-2 border-t border-zinc-800">
                    <div className="flex items-center gap-1">
                      <Button variant="secondary" size="sm" onClick={() => handleOpenEdit(p)}>
                        <Edit3 size={12} className="mr-1" />
                        Edit
                      </Button>
                      <Button 
                        variant="secondary" 
                        size="sm" 
                        className="text-red-400 hover:text-red-300 hover:bg-red-500/10"
                        onClick={() => handleDelete(p.id, p.name || p.website_url)}
                      >
                        <Trash2 size={12} />
                      </Button>
                    </div>

                    {!isCurrent ? (
                      <Button variant="primary" size="sm" onClick={() => handleSetActive(p)}>
                        Select
                      </Button>
                    ) : (
                      <Button variant="secondary" size="sm" onClick={() => navigate('/dashboard')}>
                        Dashboard
                        <ArrowRight size={12} className="ml-1" />
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* CREATE / EDIT MODAL */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-4">
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl max-w-lg w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
              <h3 className="text-base font-semibold text-zinc-100 flex items-center gap-2">
                <FolderKanban size={16} className="text-blue-500" />
                {editingProject ? 'Edit Project' : 'Create New Project'}
              </h3>
              <button onClick={() => setShowModal(false)} className="text-zinc-400 hover:text-zinc-200">
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-3.5 text-xs">
              <div>
                <label className="font-medium text-zinc-300">Project / Brand Name</label>
                <input
                  type="text"
                  placeholder="e.g. Acme Corp"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="mt-1 w-full bg-zinc-950 border border-zinc-800 rounded px-3 py-2 text-zinc-100 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="font-medium text-zinc-300">Target Website URL *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. https://mywebsite.com"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  className="mt-1 w-full bg-zinc-950 border border-zinc-800 rounded px-3 py-2 text-zinc-100 font-mono focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-medium text-zinc-300">Industry / Niche</label>
                  <input
                    type="text"
                    placeholder="e.g. SaaS, E-Commerce, Legal"
                    value={industry}
                    onChange={(e) => setIndustry(e.target.value)}
                    className="mt-1 w-full bg-zinc-950 border border-zinc-800 rounded px-3 py-2 text-zinc-100 focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="font-medium text-zinc-300">Target Country</label>
                  <select
                    value={country}
                    onChange={(e) => setCountry(e.target.value)}
                    className="mt-1 w-full bg-zinc-950 border border-zinc-800 rounded px-3 py-2 text-zinc-200 focus:outline-none focus:border-blue-500"
                  >
                    <option value="United States">United States</option>
                    <option value="United Kingdom">United Kingdom</option>
                    <option value="Canada">Canada</option>
                    <option value="Australia">Australia</option>
                    <option value="Germany">Germany</option>
                    <option value="India">India</option>
                    <option value="Global">Global</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="font-medium text-zinc-300">Automation Mode</label>
                <select
                  value={automationMode}
                  onChange={(e) => setAutomationMode(e.target.value as any)}
                  className="mt-1 w-full bg-zinc-950 border border-zinc-800 rounded px-3 py-2 text-zinc-200 focus:outline-none focus:border-blue-500"
                >
                  <option value="manual">Manual (You review every opportunity and action)</option>
                  <option value="assisted">Assisted (Agents qualify and prepare drafts; human confirms)</option>
                  <option value="autonomous">Autonomous (Full hands-free discovery and operations)</option>
                </select>
              </div>

              <div>
                <label className="font-medium text-zinc-300">Business Description & Value Proposition</label>
                <textarea
                  rows={3}
                  placeholder="Describe your core offering to help AI agents craft personalized outreach..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="mt-1 w-full bg-zinc-950 border border-zinc-800 rounded px-3 py-2 text-zinc-100 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-zinc-800">
                <Button variant="secondary" type="button" onClick={() => setShowModal(false)}>
                  Cancel
                </Button>
                <Button variant="primary" type="submit">
                  {editingProject ? 'Save Changes' : 'Create Project'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}