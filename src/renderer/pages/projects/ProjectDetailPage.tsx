import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useApi } from '../../hooks/useApi';
import { useAppStore } from '../../stores/app-store';
import { Card, CardContent, CardHeader, CardTitle, Button, Badge } from '../../components/ui';
import { 
  FolderKanban, Globe, Search, Lightbulb, Users, 
  ArrowLeft, ExternalLink, Save, Zap, Tag, CheckCircle2
} from 'lucide-react';

export function ProjectDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const api = useApi();
  const { currentProjectId, setCurrentProjectId, setActiveProject } = useAppStore();

  const activeId = id || currentProjectId;
  const [project, setProject] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Form Fields
  const [name, setName] = useState('');
  const [url, setUrl] = useState('');
  const [businessName, setBusinessName] = useState('');
  const [description, setDescription] = useState('');
  const [industry, setIndustry] = useState('');
  const [country, setCountry] = useState('United States');
  const [language, setLanguage] = useState('en');
  const [automationMode, setAutomationMode] = useState<string>('assisted');
  const [keywords, setKeywords] = useState('');
  const [targetAudience, setTargetAudience] = useState('');

  useEffect(() => {
    if (activeId) {
      loadProject(activeId);
    }
  }, [activeId]);

  const loadProject = async (projId: string) => {
    if (!api?.projects) return;
    setLoading(true);
    try {
      const p = await api.projects.getById(projId);
      if (p) {
        setProject(p);
        setName(p.name || '');
        setUrl(p.website_url || '');
        setBusinessName(p.business_name || '');
        setDescription(p.business_description || '');
        setIndustry(p.industry || '');
        setCountry(p.country || 'United States');
        setLanguage(p.language || 'en');
        setAutomationMode(p.automation_mode || 'assisted');
        setKeywords(p.keywords || '');
        setTargetAudience(p.target_audience || '');
      }
    } catch (err) {
      console.error('Error loading project details:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeId || !api?.projects) return;
    setSaving(true);
    setSaveSuccess(false);
    try {
      const updated = await api.projects.update(activeId, {
        name,
        website_url: url,
        business_name: businessName,
        business_description: description,
        industry,
        country,
        language,
        automation_mode: automationMode as any,
        keywords,
        target_audience: targetAudience,
      });
      if (updated) {
        setProject(updated);
        setActiveProject(updated);
        setSaveSuccess(true);
        setTimeout(() => setSaveSuccess(false), 3000);
      }
    } catch (err) {
      console.error('Save failed:', err);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="p-8 text-center text-xs text-zinc-500">Loading project configuration...</div>;
  }

  if (!project) {
    return (
      <div className="p-8 text-center space-y-4">
        <p className="text-xs text-zinc-400">Project not found or no active project selected.</p>
        <Button variant="primary" onClick={() => navigate('/projects')}>Back to Projects</Button>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* HEADER */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button variant="secondary" size="sm" onClick={() => navigate('/projects')}>
            <ArrowLeft size={13} className="mr-1" />
            Projects
          </Button>
          <div>
            <h1 className="text-xl font-bold text-zinc-100 flex items-center gap-2">
              {project.name || project.website_url}
            </h1>
            <a
              href={project.website_url}
              target="_blank"
              rel="noreferrer"
              className="text-xs font-mono text-zinc-400 hover:text-blue-400 flex items-center gap-1 mt-0.5"
            >
              <Globe size={11} />
              {project.website_url}
              <ExternalLink size={10} />
            </a>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="secondary" size="sm" onClick={() => navigate('/site-explorer')}>
            <Search size={13} className="mr-1.5" />
            Crawl Site
          </Button>
          <Button variant="primary" size="sm" onClick={() => navigate('/opportunities')}>
            <Lightbulb size={13} className="mr-1.5" />
            Opportunities
          </Button>
        </div>
      </div>

      {/* FORM CARD */}
      <form onSubmit={handleSave}>
        <Card className="bg-zinc-900 border-zinc-800">
          <CardHeader className="pb-3 border-b border-zinc-800 flex flex-row items-center justify-between">
            <CardTitle className="text-sm font-semibold text-zinc-200">Project Configuration & Intelligence Parameters</CardTitle>
            {saveSuccess && (
              <span className="text-xs text-emerald-400 flex items-center gap-1">
                <CheckCircle2 size={13} />
                Saved successfully
              </span>
            )}
          </CardHeader>
          <CardContent className="space-y-4 pt-4 text-xs">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="font-medium text-zinc-300">Project Title</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="mt-1 w-full bg-zinc-950 border border-zinc-800 rounded px-3 py-2 text-zinc-100 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="font-medium text-zinc-300">Target Website URL</label>
                <input
                  type="text"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  className="mt-1 w-full bg-zinc-950 border border-zinc-800 rounded px-3 py-2 text-zinc-100 font-mono focus:outline-none focus:border-blue-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="font-medium text-zinc-300">Business / Brand Name</label>
                <input
                  type="text"
                  value={businessName}
                  onChange={(e) => setBusinessName(e.target.value)}
                  className="mt-1 w-full bg-zinc-950 border border-zinc-800 rounded px-3 py-2 text-zinc-100 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="font-medium text-zinc-300">Industry / Niche</label>
                <input
                  type="text"
                  value={industry}
                  onChange={(e) => setIndustry(e.target.value)}
                  className="mt-1 w-full bg-zinc-950 border border-zinc-800 rounded px-3 py-2 text-zinc-100 focus:outline-none focus:border-blue-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="font-medium text-zinc-300">Target Operating Country</label>
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

              <div>
                <label className="font-medium text-zinc-300">Primary Language</label>
                <input
                  type="text"
                  value={language}
                  onChange={(e) => setLanguage(e.target.value)}
                  className="mt-1 w-full bg-zinc-950 border border-zinc-800 rounded px-3 py-2 text-zinc-100 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="font-medium text-zinc-300">Automation Mode</label>
                <select
                  value={automationMode}
                  onChange={(e) => setAutomationMode(e.target.value)}
                  className="mt-1 w-full bg-zinc-950 border border-zinc-800 rounded px-3 py-2 text-zinc-200 focus:outline-none focus:border-blue-500"
                >
                  <option value="manual">Manual</option>
                  <option value="assisted">Assisted (Recommended)</option>
                  <option value="autonomous">Full Autonomous</option>
                </select>
              </div>
            </div>

            <div>
              <label className="font-medium text-zinc-300">Target Keywords & Core Topics (comma separated)</label>
              <input
                type="text"
                placeholder="e.g. cloud security, kubernetes management, devops monitoring"
                value={keywords}
                onChange={(e) => setKeywords(e.target.value)}
                className="mt-1 w-full bg-zinc-950 border border-zinc-800 rounded px-3 py-2 text-zinc-100 focus:outline-none focus:border-blue-500"
              />
              <p className="text-[10px] text-zinc-500 mt-1">Used by discovery agents to locate relevant resource pages, guest posts, and directories.</p>
            </div>

            <div>
              <label className="font-medium text-zinc-300">Target Audience Profile</label>
              <input
                type="text"
                placeholder="e.g. CTOs, VP Engineering, DevOps Engineers at tech startups"
                value={targetAudience}
                onChange={(e) => setTargetAudience(e.target.value)}
                className="mt-1 w-full bg-zinc-950 border border-zinc-800 rounded px-3 py-2 text-zinc-100 focus:outline-none focus:border-blue-500"
              />
            </div>

            <div>
              <label className="font-medium text-zinc-300">Business Description & Value Proposition</label>
              <textarea
                rows={4}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="mt-1 w-full bg-zinc-950 border border-zinc-800 rounded px-3 py-2 text-zinc-100 focus:outline-none focus:border-blue-500"
              />
            </div>

            <div className="flex justify-end pt-3 border-t border-zinc-800">
              <Button variant="primary" type="submit" disabled={saving}>
                <Save size={13} className="mr-1.5" />
                {saving ? 'Saving...' : 'Save Configuration'}
              </Button>
            </div>
          </CardContent>
        </Card>
      </form>
    </div>
  );
}