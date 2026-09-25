import React, { useState, useEffect } from 'react';
import { useAppStore } from '../../stores/app-store';
import { useApi } from '../../hooks/useApi';
import {
  SubmissionTarget,
  BusinessProfile,
  DocumentAsset,
  SubmissionCenterStats,
  SubmissionTargetType,
  DocumentAssetType
} from '../../../shared/types';
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent
} from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Input } from '../../components/ui/Input';
import { Spinner } from '../../components/ui/Spinner';
import { EmptyState } from '../../components/ui/EmptyState';
import {
  Share2,
  FileText,
  Building,
  CheckCircle2,
  AlertTriangle,
  ExternalLink,
  ShieldCheck,
  RefreshCw,
  Plus,
  Search,
  Filter,
  Layers,
  FileCheck,
  Globe,
  Upload,
  Sparkles,
  UserCheck
} from 'lucide-react';

export function SubmissionCenterPage() {
  const { currentProjectId } = useAppStore();
  const api = useApi();

  const [activeTab, setActiveTab] = useState<'targets' | 'assets' | 'profile' | 'verification'>('targets');
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState<SubmissionCenterStats | null>(null);
  const [targets, setTargets] = useState<SubmissionTarget[]>([]);
  const [assets, setAssets] = useState<DocumentAsset[]>([]);
  const [profile, setProfile] = useState<BusinessProfile | null>(null);

  // Filters
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [qualFilter, setQualFilter] = useState<string>('all');

  // Human Handoff modal / banner state
  const [humanActionAttempt, setHumanActionAttempt] = useState<{ id: string; reason: string; platform: string; submissionUrl?: string } | null>(null);

  // PDF Generator Modal
  const [showPdfModal, setShowPdfModal] = useState(false);
  const [pdfTitle, setPdfTitle] = useState('');
  const [pdfType, setPdfType] = useState<DocumentAssetType>('pdf_guide');
  const [pdfAuthor, setPdfAuthor] = useState('');
  const [pdfSummary, setPdfSummary] = useState('');
  const [pdfTargetUrl, setPdfTargetUrl] = useState('');
  const [generatingPdf, setGeneratingPdf] = useState(false);

  // Profile Form state
  const [profileForm, setProfileForm] = useState<Partial<BusinessProfile>>({});

  useEffect(() => {
    if (currentProjectId) {
      loadAllData();
    }
  }, [currentProjectId]);

  const loadAllData = async () => {
    if (!currentProjectId || !api) return;
    setLoading(true);
    try {
      const [statsData, targetsRes, assetsRes, profileData] = await Promise.all([
        api.submissions.getStats(currentProjectId),
        api.submissions.getTargets(currentProjectId, { pageSize: 100 }),
        api.assets.getAll(currentProjectId, { pageSize: 50 }),
        api.submissions.getProfile(currentProjectId)
      ]);

      setStats(statsData);
      setTargets(targetsRes?.data || []);
      setAssets(assetsRes?.data || []);
      setProfile(profileData || null);
      if (profileData) {
        setProfileForm(profileData);
        setPdfAuthor(profileData.business_name || '');
        setPdfTargetUrl(profileData.website_url || '');
      }
    } catch (err) {
      console.error('Failed to load submission data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDiscover = async () => {
    if (!currentProjectId || !api) return;
    setLoading(true);
    try {
      await api.submissions.discoverTargets(currentProjectId);
      await loadAllData();
    } catch (err) {
      console.error('Discovery failed:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleQualifyAll = async () => {
    if (!currentProjectId || !api) return;
    setLoading(true);
    try {
      await api.submissions.qualifyTargets(currentProjectId);
      await loadAllData();
    } catch (err) {
      console.error('Qualification failed:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleExecuteSubmission = async (target: SubmissionTarget) => {
    if (!api) return;
    try {
      const res = await api.submissions.executeSubmission(target.id, {
        profileId: profile?.id,
        mode: 'browser_assisted'
      });

      if (res?.humanActionRequired) {
        setHumanActionAttempt({
          id: res.attempt?.id || target.id,
          reason: res.reason,
          platform: target.platform_name,
          submissionUrl: res.submissionUrl || target.submission_url
        });
      }
      await loadAllData();
    } catch (err: any) {
      console.error('Submission execution failed:', err);
      alert(`Submission execution failed: ${err?.message || err}`);
    }
  };

  const handleResumeHumanAction = async () => {
    if (!humanActionAttempt || !api) return;
    try {
      await api.submissions.resumeAfterHuman(humanActionAttempt.id);
      setHumanActionAttempt(null);
      await loadAllData();
    } catch (err: any) {
      console.error('Resume failed:', err);
      alert(`Resume failed: ${err?.message || err}`);
    }
  };

  const handleVerify = async (targetId: string) => {
    if (!api) return;
    try {
      await api.submissions.verifyTarget(targetId);
      await loadAllData();
    } catch (err) {
      console.error('Verification failed:', err);
    }
  };

  const handleVerifyAll = async () => {
    if (!currentProjectId || !api) return;
    setLoading(true);
    try {
      await api.submissions.verifyAll(currentProjectId);
      await loadAllData();
    } catch (err) {
      console.error('Verify all failed:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveProfile = async () => {
    if (!currentProjectId || !api) return;
    try {
      const saved = await api.submissions.saveProfile(currentProjectId, profileForm);
      setProfile(saved);
      alert('Business Profile Package saved successfully.');
    } catch (err) {
      console.error('Save profile failed:', err);
    }
  };

  const handleGeneratePdf = async () => {
    if (!currentProjectId || !api || !pdfTitle) return;
    setGeneratingPdf(true);
    try {
      const res = await api.assets.generateBrief(currentProjectId, {
        title: pdfTitle,
        assetType: pdfType,
        author: pdfAuthor || profileForm.business_name || 'Team',
        summary: pdfSummary,
        targetUrl: pdfTargetUrl || profileForm.website_url || '',
        sections: [
          {
            title: '1. Strategic Framework & Objectives',
            content: 'This document details the core industry methodology, operational metrics, and verified quality standards maintained across all service applications.'
          },
          {
            title: '2. Industry Insights & Benchmark Data',
            content: 'Through comprehensive analysis of verified market signals, our research provides reproducible benchmarks for professionals and organizational decision makers.'
          },
          {
            title: '3. Implementation Guidelines & Resources',
            content: 'Practical recommendations, best practices, and verified citations designed for immediate domain integration and sustainable linkable utility.'
          }
        ]
      });

      if (res.isDuplicate) {
        alert('Notice: ' + res.message);
      } else {
        setShowPdfModal(false);
        setPdfTitle('');
        setPdfSummary('');
        await loadAllData();
      }
    } catch (err) {
      console.error('PDF generation failed:', err);
    } finally {
      setGeneratingPdf(false);
    }
  };

  const filteredTargets = targets.filter(t => {
    if (typeFilter !== 'all' && t.target_type !== typeFilter) return false;
    if (qualFilter !== 'all' && t.qualification_status !== qualFilter) return false;
    if (search) {
      const s = search.toLowerCase();
      return (
        t.platform_name.toLowerCase().includes(s) ||
        t.domain.toLowerCase().includes(s) ||
        t.submission_url.toLowerCase().includes(s)
      );
    }
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-zinc-100">Submission & Asset Distribution</h1>
            <Badge variant="outline" className="border-blue-500/30 text-blue-400 bg-blue-500/10">
              Autonomous Agent Subsystem
            </Badge>
          </div>
          <p className="text-sm text-zinc-400 mt-1">
            Discover, qualify, prepare, and verify legitimate business profile listings, niche directories, and PDF document distribution.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="secondary" onClick={loadAllData} disabled={loading}>
            <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button variant="primary" onClick={handleDiscover} disabled={loading}>
            <Search className="w-4 h-4 mr-2" />
            Discover Targets
          </Button>
        </div>
      </div>

      {/* Human Action Required Banner */}
      {humanActionAttempt && (
        <div className="p-4 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-200 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
            <div>
              <div className="font-semibold text-amber-300">HUMAN ACTION REQUIRED — {humanActionAttempt.platform}</div>
              <p className="text-xs text-zinc-300 mt-0.5">{humanActionAttempt.reason}</p>
              <p className="text-xs text-zinc-400 mt-1">Complete any CAPTCHA or verification challenge in Chrome, then click Confirm & Resume.</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {humanActionAttempt.submissionUrl && (
              <Button
                variant="secondary"
                size="sm"
                onClick={() => {
                  if (api?.browser?.openUrl) {
                    api.browser.openUrl(humanActionAttempt.submissionUrl!);
                  } else {
                    window.open(humanActionAttempt.submissionUrl, '_blank');
                  }
                }}
                className="text-xs text-zinc-200"
              >
                <ExternalLink className="w-3.5 h-3.5 mr-1" />
                Re-open in Chrome
              </Button>
            )}
            <Button variant="primary" size="sm" onClick={handleResumeHumanAction} className="bg-amber-600 hover:bg-amber-500 text-white">
              <UserCheck className="w-4 h-4 mr-1.5" />
              Confirm & Resume Agent
            </Button>
            <Button variant="ghost" size="sm" onClick={() => setHumanActionAttempt(null)}>
              Dismiss
            </Button>
          </div>
        </div>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        <Card className="bg-zinc-900/50 border-zinc-800">
          <CardContent className="p-4">
            <div className="text-xs text-zinc-400">Targets Found</div>
            <div className="text-2xl font-bold text-zinc-100 mt-1">{stats?.targetsDiscovered ?? targets.length}</div>
            <div className="text-[11px] text-zinc-500 mt-1">Discovered platforms</div>
          </CardContent>
        </Card>

        <Card className="bg-zinc-900/50 border-zinc-800">
          <CardContent className="p-4">
            <div className="text-xs text-zinc-400">Qualified</div>
            <div className="text-2xl font-bold text-blue-400 mt-1">{stats?.qualified ?? 0}</div>
            <div className="text-[11px] text-zinc-500 mt-1">Passed quality filter</div>
          </CardContent>
        </Card>

        <Card className="bg-zinc-900/50 border-zinc-800">
          <CardContent className="p-4">
            <div className="text-xs text-zinc-400">Filter Rejected</div>
            <div className="text-2xl font-bold text-red-400 mt-1">{stats?.rejected ?? 0}</div>
            <div className="text-[11px] text-zinc-500 mt-1">Spam / low trust blocked</div>
          </CardContent>
        </Card>

        <Card className="bg-zinc-900/50 border-zinc-800">
          <CardContent className="p-4">
            <div className="text-xs text-zinc-400">Submitted</div>
            <div className="text-2xl font-bold text-amber-400 mt-1">{stats?.submitted ?? 0}</div>
            <div className="text-[11px] text-zinc-500 mt-1">Submissions processed</div>
          </CardContent>
        </Card>

        <Card className="bg-zinc-900/50 border-zinc-800">
          <CardContent className="p-4">
            <div className="text-xs text-zinc-400">Links Verified</div>
            <div className="text-2xl font-bold text-emerald-400 mt-1">{stats?.linksFound ?? 0}</div>
            <div className="text-[11px] text-zinc-500 mt-1">Live active backlinks</div>
          </CardContent>
        </Card>

        <Card className="bg-zinc-900/50 border-zinc-800">
          <CardContent className="p-4">
            <div className="text-xs text-zinc-400">PDF & Docs</div>
            <div className="text-2xl font-bold text-purple-400 mt-1">{assets.length}</div>
            <div className="text-[11px] text-zinc-500 mt-1">Assets ready to share</div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs Navigation */}
      <div className="flex border-b border-zinc-800">
        <button
          onClick={() => setActiveTab('targets')}
          className={`pb-3 px-4 text-sm font-medium border-b-2 transition-colors ${
            activeTab === 'targets'
              ? 'border-blue-500 text-blue-400'
              : 'border-transparent text-zinc-400 hover:text-zinc-200'
          }`}
        >
          <div className="flex items-center gap-2">
            <Building className="w-4 h-4" />
            Directories & Profiles ({targets.length})
          </div>
        </button>

        <button
          onClick={() => setActiveTab('assets')}
          className={`pb-3 px-4 text-sm font-medium border-b-2 transition-colors ${
            activeTab === 'assets'
              ? 'border-blue-500 text-blue-400'
              : 'border-transparent text-zinc-400 hover:text-zinc-200'
          }`}
        >
          <div className="flex items-center gap-2">
            <FileText className="w-4 h-4" />
            Document & PDF Distribution ({assets.length})
          </div>
        </button>

        <button
          onClick={() => setActiveTab('profile')}
          className={`pb-3 px-4 text-sm font-medium border-b-2 transition-colors ${
            activeTab === 'profile'
              ? 'border-blue-500 text-blue-400'
              : 'border-transparent text-zinc-400 hover:text-zinc-200'
          }`}
        >
          <div className="flex items-center gap-2">
            <Layers className="w-4 h-4" />
            Business Profile Package
          </div>
        </button>

        <button
          onClick={() => setActiveTab('verification')}
          className={`pb-3 px-4 text-sm font-medium border-b-2 transition-colors ${
            activeTab === 'verification'
              ? 'border-blue-500 text-blue-400'
              : 'border-transparent text-zinc-400 hover:text-zinc-200'
          }`}
        >
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4" />
            Verification & Links ({stats?.linksFound ?? 0})
          </div>
        </button>
      </div>

      {/* TAB 1: DIRECTORIES & PROFILES */}
      {activeTab === 'targets' && (
        <div className="space-y-4">
          {/* Action and Filter bar */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <div className="relative flex-1 sm:w-64">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
                <input
                  type="text"
                  placeholder="Search platforms, domains..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full pl-9 pr-3 py-1.5 text-xs bg-zinc-900 border border-zinc-800 rounded-md text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-blue-500"
                />
              </div>

              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                className="text-xs bg-zinc-900 border border-zinc-800 rounded-md px-2.5 py-1.5 text-zinc-300 focus:outline-none"
              >
                <option value="all">All Target Types</option>
                <option value="business_profile">Business Profiles</option>
                <option value="industry_directory">Industry Directories</option>
                <option value="tool_listing">Tool Listings</option>
                <option value="document_sharing">Document Platforms</option>
                <option value="presentation">Presentations</option>
              </select>

              <select
                value={qualFilter}
                onChange={(e) => setQualFilter(e.target.value)}
                className="text-xs bg-zinc-900 border border-zinc-800 rounded-md px-2.5 py-1.5 text-zinc-300 focus:outline-none"
              >
                <option value="all">All Qualifications</option>
                <option value="high_priority">High Priority</option>
                <option value="medium_priority">Medium Priority</option>
                <option value="low_priority">Low Priority</option>
                <option value="rejected">Rejected by Filter</option>
              </select>
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
              <Button variant="secondary" size="sm" onClick={handleQualifyAll} disabled={loading || targets.length === 0}>
                <ShieldCheck className="w-3.5 h-3.5 mr-1.5 text-blue-400" />
                Qualify All Targets
              </Button>
            </div>
          </div>

          {/* Targets Table */}
          {filteredTargets.length === 0 ? (
            <EmptyState
              icon={<Building className="w-8 h-8 text-zinc-600" />}
              title="No submission targets discovered yet"
              description="Deploy the Submission Discovery Agent to find legitimate directories, profile platforms, and document distribution hubs matching your project."
              actionLabel="Discover Targets Now"
              onAction={handleDiscover}
            />
          ) : (
            <div className="border border-zinc-800 rounded-lg overflow-hidden bg-zinc-900/30">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-zinc-900/80 text-zinc-400 border-b border-zinc-800 uppercase tracking-wider font-medium">
                    <tr>
                      <th className="px-4 py-3">Platform</th>
                      <th className="px-4 py-3">Type</th>
                      <th className="px-4 py-3">Link Attribution</th>
                      <th className="px-4 py-3">Relevance</th>
                      <th className="px-4 py-3">Qualification</th>
                      <th className="px-4 py-3">Status</th>
                      <th className="px-4 py-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-800/60 text-zinc-200">
                    {filteredTargets.map((t) => (
                      <tr key={t.id} className="hover:bg-zinc-800/30 transition-colors">
                        <td className="px-4 py-3">
                          <div className="font-semibold text-zinc-100 flex items-center gap-1.5">
                            {t.platform_name}
                            <a
                              href={t.submission_url}
                              target="_blank"
                              rel="noreferrer"
                              className="text-zinc-500 hover:text-blue-400"
                              title="Visit Platform"
                            >
                              <ExternalLink className="w-3 h-3" />
                            </a>
                          </div>
                          <div className="text-[11px] text-zinc-400 font-mono">{t.domain}</div>
                        </td>

                        <td className="px-4 py-3">
                          <span className="capitalize text-zinc-300">
                            {t.target_type.replace('_', ' ')}
                          </span>
                        </td>

                        <td className="px-4 py-3">
                          {t.estimated_link_type === 'follow' ? (
                            <Badge variant="success" size="sm">DoFollow</Badge>
                          ) : t.estimated_link_type === 'nofollow' ? (
                            <Badge variant="default" size="sm">NoFollow Citation</Badge>
                          ) : (
                            <span className="text-zinc-400">Profile Link</span>
                          )}
                        </td>

                        <td className="px-4 py-3 font-mono">
                          {Math.round(t.topical_relevance * 100)}%
                        </td>

                        <td className="px-4 py-3">
                          {t.qualification_status === 'high_priority' && (
                            <Badge variant="success" size="sm">High Priority</Badge>
                          )}
                          {t.qualification_status === 'medium_priority' && (
                            <Badge variant="info" size="sm">Medium Priority</Badge>
                          )}
                          {t.qualification_status === 'low_priority' && (
                            <Badge variant="warning" size="sm">Low Priority</Badge>
                          )}
                          {t.qualification_status === 'rejected' && (
                            <Badge variant="error" size="sm" title={t.qualification_reason || 'Rejected by quality filter'}>
                              Rejected by Filter
                            </Badge>
                          )}
                          {t.qualification_status === 'pending' && (
                            <Badge variant="outline" size="sm">Pending Analysis</Badge>
                          )}
                        </td>

                        <td className="px-4 py-3">
                          <span className="capitalize text-zinc-300 font-medium">
                            {t.status.replace('_', ' ')}
                          </span>
                        </td>

                        <td className="px-4 py-3 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            {t.status === 'submitted' || t.status === 'published' ? (
                              <Button
                                variant="secondary"
                                size="sm"
                                onClick={() => handleVerify(t.id)}
                                title="Check if listing and link are live"
                              >
                                <CheckCircle2 className="w-3.5 h-3.5 mr-1 text-emerald-400" />
                                Verify
                              </Button>
                            ) : t.qualification_status === 'rejected' ? (
                              <span className="text-[11px] text-zinc-500 italic">Excluded</span>
                            ) : (
                              <Button
                                variant="primary"
                                size="sm"
                                onClick={() => handleExecuteSubmission(t)}
                              >
                                <Globe className="w-3.5 h-3.5 mr-1" />
                                Submit via Chrome
                              </Button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 2: DOCUMENT & PDF DISTRIBUTION */}
      {activeTab === 'assets' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-semibold text-zinc-100">Document & PDF Assets</h2>
              <p className="text-xs text-zinc-400">
                Legitimate whitepapers, research reports, guides, and studies formatted for digital libraries.
              </p>
            </div>
            <Button variant="primary" onClick={() => setShowPdfModal(true)}>
              <Sparkles className="w-4 h-4 mr-1.5" />
              Create Linkable PDF Asset
            </Button>
          </div>

          {assets.length === 0 ? (
            <EmptyState
              icon={<FileText className="w-8 h-8 text-zinc-600" />}
              title="No document assets created yet"
              description="Use the PDF Creation Assistant to generate a research summary, guide, or case study containing structured backlink attribution."
              actionLabel="Create First PDF Asset"
              onAction={() => setShowPdfModal(true)}
            />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {assets.map((asset) => (
                <Card key={asset.id} className="bg-zinc-900/60 border-zinc-800">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between gap-2">
                      <Badge variant="outline" className="border-purple-500/30 text-purple-400 bg-purple-500/10 uppercase text-[10px]">
                        {asset.asset_type.replace('_', ' ')}
                      </Badge>
                      <div className="text-xs font-mono text-zinc-400">
                        {asset.file_size ? `${(asset.file_size / 1024).toFixed(1)} KB` : ''}
                      </div>
                    </div>
                    <CardTitle className="text-sm font-semibold text-zinc-100 mt-2 line-clamp-1">
                      {asset.title}
                    </CardTitle>
                    <CardDescription className="text-xs text-zinc-400 line-clamp-2">
                      {asset.summary || 'Official publication asset.'}
                    </CardDescription>
                  </CardHeader>

                  <CardContent className="pt-0 text-xs space-y-3">
                    <div className="p-2.5 rounded bg-zinc-950/60 border border-zinc-800/80 space-y-1.5 font-mono text-[11px]">
                      <div className="flex justify-between text-zinc-400">
                        <span>Quality Score:</span>
                        <span className="font-bold text-emerald-400">{asset.quality_score}/100</span>
                      </div>
                      <div className="w-full bg-zinc-800 h-1.5 rounded-full overflow-hidden">
                        <div
                          className="bg-emerald-500 h-full rounded-full"
                          style={{ width: `${asset.quality_score}%` }}
                        />
                      </div>
                      <div className="flex justify-between text-zinc-500 text-[10px]">
                        <span>Citations: {asset.citations_count}</span>
                        <span>Hash: {asset.file_hash?.substring(0, 10)}...</span>
                      </div>
                    </div>

                    <div className="text-[11px] text-zinc-400">
                      <span className="text-zinc-500">Backlink:</span>{' '}
                      <span className="text-blue-400 break-all">{asset.website_url || 'Target Website'}</span>
                    </div>

                    <div className="pt-1 flex items-center justify-between border-t border-zinc-800">
                      <span className="text-[11px] text-zinc-500">Duplicate Check: Protected</span>
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => {
                          setActiveTab('targets');
                          setTypeFilter('document_sharing');
                        }}
                      >
                        <Share2 className="w-3.5 h-3.5 mr-1" />
                        Distribute
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 3: BUSINESS PROFILE PACKAGE */}
      {activeTab === 'profile' && (
        <Card className="bg-zinc-900/50 border-zinc-800">
          <CardHeader>
            <CardTitle className="text-base text-zinc-100">Business Profile Package</CardTitle>
            <CardDescription className="text-xs text-zinc-400">
              This normalized profile package is used across business directories and review platforms to maintain brand consistency.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-medium text-zinc-300">Business Name</label>
                <input
                  type="text"
                  value={profileForm.business_name || ''}
                  onChange={(e) => setProfileForm({ ...profileForm, business_name: e.target.value })}
                  className="mt-1 w-full text-xs bg-zinc-950 border border-zinc-800 rounded px-3 py-2 text-zinc-100 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="text-xs font-medium text-zinc-300">Website URL</label>
                <input
                  type="text"
                  value={profileForm.website_url || ''}
                  onChange={(e) => setProfileForm({ ...profileForm, website_url: e.target.value })}
                  className="mt-1 w-full text-xs bg-zinc-950 border border-zinc-800 rounded px-3 py-2 text-zinc-100 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="text-xs font-medium text-zinc-300">Tagline</label>
                <input
                  type="text"
                  value={profileForm.tag_line || ''}
                  onChange={(e) => setProfileForm({ ...profileForm, tag_line: e.target.value })}
                  className="mt-1 w-full text-xs bg-zinc-950 border border-zinc-800 rounded px-3 py-2 text-zinc-100 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="text-xs font-medium text-zinc-300">Industry & Main Category</label>
                <input
                  type="text"
                  value={profileForm.industry || ''}
                  onChange={(e) => setProfileForm({ ...profileForm, industry: e.target.value })}
                  className="mt-1 w-full text-xs bg-zinc-950 border border-zinc-800 rounded px-3 py-2 text-zinc-100 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="text-xs font-medium text-zinc-300">Public Business Email</label>
                <input
                  type="email"
                  value={profileForm.public_email || ''}
                  onChange={(e) => setProfileForm({ ...profileForm, public_email: e.target.value })}
                  className="mt-1 w-full text-xs bg-zinc-950 border border-zinc-800 rounded px-3 py-2 text-zinc-100 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="text-xs font-medium text-zinc-300">Phone</label>
                <input
                  type="text"
                  value={profileForm.phone || ''}
                  onChange={(e) => setProfileForm({ ...profileForm, phone: e.target.value })}
                  className="mt-1 w-full text-xs bg-zinc-950 border border-zinc-800 rounded px-3 py-2 text-zinc-100 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="text-xs font-medium text-zinc-300">Country / Headquarters</label>
                <input
                  type="text"
                  value={profileForm.country || ''}
                  onChange={(e) => setProfileForm({ ...profileForm, country: e.target.value })}
                  className="mt-1 w-full text-xs bg-zinc-950 border border-zinc-800 rounded px-3 py-2 text-zinc-100 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="text-xs font-medium text-zinc-300">Founded Year</label>
                <input
                  type="number"
                  value={profileForm.founded_year || ''}
                  onChange={(e) => setProfileForm({ ...profileForm, founded_year: parseInt(e.target.value) || null })}
                  className="mt-1 w-full text-xs bg-zinc-950 border border-zinc-800 rounded px-3 py-2 text-zinc-100 focus:outline-none focus:border-blue-500"
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between items-center">
                <label className="text-xs font-medium text-zinc-300">Short Description (for directories with 150 char limits)</label>
                <span className="text-[11px] text-zinc-500">{profileForm.short_description?.length || 0} / 150</span>
              </div>
              <textarea
                rows={2}
                value={profileForm.short_description || ''}
                onChange={(e) => setProfileForm({ ...profileForm, short_description: e.target.value })}
                className="mt-1 w-full text-xs bg-zinc-950 border border-zinc-800 rounded px-3 py-2 text-zinc-100 focus:outline-none focus:border-blue-500"
              />
            </div>

            <div>
              <label className="text-xs font-medium text-zinc-300">Full Detailed Description</label>
              <textarea
                rows={4}
                value={profileForm.long_description || ''}
                onChange={(e) => setProfileForm({ ...profileForm, long_description: e.target.value })}
                className="mt-1 w-full text-xs bg-zinc-950 border border-zinc-800 rounded px-3 py-2 text-zinc-100 focus:outline-none focus:border-blue-500"
              />
            </div>

            <div className="pt-2 flex justify-end">
              <Button variant="primary" onClick={handleSaveProfile}>
                Save Business Profile Package
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* TAB 4: VERIFICATION & LINKS */}
      {activeTab === 'verification' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-semibold text-zinc-100">Live Verification & Link Tracking</h2>
              <p className="text-xs text-zinc-400">
                Audits all published profile listings and document pages to verify whether backlinks are active, dofollow, or removed.
              </p>
            </div>
            <Button variant="secondary" onClick={handleVerifyAll} disabled={loading}>
              <RefreshCw className={`w-4 h-4 mr-1.5 ${loading ? 'animate-spin' : ''}`} />
              Verify All Live Listings
            </Button>
          </div>

          <div className="border border-zinc-800 rounded-lg overflow-hidden bg-zinc-900/30">
            <table className="w-full text-left text-xs">
              <thead className="bg-zinc-900/80 text-zinc-400 border-b border-zinc-800 uppercase tracking-wider font-medium">
                <tr>
                  <th className="px-4 py-3">Platform & Domain</th>
                  <th className="px-4 py-3">Submission URL</th>
                  <th className="px-4 py-3">Verification Status</th>
                  <th className="px-4 py-3">Link Status</th>
                  <th className="px-4 py-3">Last Checked</th>
                  <th className="px-4 py-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/60 text-zinc-200">
                {targets
                  .filter((t) => t.status === 'submitted' || t.status === 'published')
                  .map((t) => (
                    <tr key={t.id} className="hover:bg-zinc-800/30">
                      <td className="px-4 py-3 font-semibold text-zinc-100">
                        {t.platform_name}
                        <div className="text-[11px] text-zinc-400 font-mono">{t.domain}</div>
                      </td>

                      <td className="px-4 py-3">
                        <a
                          href={t.submission_url}
                          target="_blank"
                          rel="noreferrer"
                          className="text-blue-400 hover:underline flex items-center gap-1 font-mono text-[11px]"
                        >
                          {t.submission_url.substring(0, 40)}...
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      </td>

                      <td className="px-4 py-3">
                        {t.status === 'published' ? (
                          <Badge variant="success" size="sm">Published & Live</Badge>
                        ) : (
                          <Badge variant="warning" size="sm">Submitted — Awaiting Index</Badge>
                        )}
                      </td>

                      <td className="px-4 py-3">
                        {t.status === 'published' ? (
                          <span className="text-emerald-400 font-medium">Active Hyperlink Detected</span>
                        ) : (
                          <span className="text-zinc-400">Pending Verification</span>
                        )}
                      </td>

                      <td className="px-4 py-3 text-zinc-400 font-mono text-[11px]">
                        {new Date(t.updated_at).toLocaleDateString()}
                      </td>

                      <td className="px-4 py-3 text-right">
                        <Button variant="secondary" size="sm" onClick={() => handleVerify(t.id)}>
                          Verify Now
                        </Button>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* PDF CREATION MODAL */}
      {showPdfModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-zinc-900 border border-zinc-800 rounded-lg max-w-lg w-full p-6 space-y-4 shadow-xl">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-blue-400" />
                <h3 className="font-semibold text-zinc-100">PDF Creation Assistant</h3>
              </div>
              <button
                onClick={() => setShowPdfModal(false)}
                className="text-zinc-500 hover:text-zinc-200 text-sm"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-xs font-medium text-zinc-300">Document Title</label>
                <input
                  type="text"
                  placeholder="e.g. Modern Industry Standards & Framework Guide 2026"
                  value={pdfTitle}
                  onChange={(e) => setPdfTitle(e.target.value)}
                  className="mt-1 w-full text-xs bg-zinc-950 border border-zinc-800 rounded px-3 py-2 text-zinc-100 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-zinc-300">Asset Type</label>
                  <select
                    value={pdfType}
                    onChange={(e) => setPdfType(e.target.value as any)}
                    className="mt-1 w-full text-xs bg-zinc-950 border border-zinc-800 rounded px-2.5 py-2 text-zinc-200 focus:outline-none"
                  >
                    <option value="pdf_guide">PDF Guide</option>
                    <option value="whitepaper">Whitepaper</option>
                    <option value="research_report">Research Report</option>
                    <option value="case_study">Case Study</option>
                    <option value="statistics_report">Statistics Report</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-medium text-zinc-300">Author / Team</label>
                  <input
                    type="text"
                    value={pdfAuthor}
                    onChange={(e) => setPdfAuthor(e.target.value)}
                    className="mt-1 w-full text-xs bg-zinc-950 border border-zinc-800 rounded px-3 py-2 text-zinc-100 focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-medium text-zinc-300">Embedded Backlink URL</label>
                <input
                  type="text"
                  value={pdfTargetUrl}
                  onChange={(e) => setPdfTargetUrl(e.target.value)}
                  className="mt-1 w-full text-xs bg-zinc-950 border border-zinc-800 rounded px-3 py-2 text-zinc-100 focus:outline-none focus:border-blue-500"
                />
                <p className="text-[11px] text-zinc-500 mt-1">This link will be permanently embedded in the PDF citation footer.</p>
              </div>

              <div>
                <label className="text-xs font-medium text-zinc-300">Executive Summary</label>
                <textarea
                  rows={3}
                  placeholder="Summarize the key insights, objectives, and value of this publication..."
                  value={pdfSummary}
                  onChange={(e) => setPdfSummary(e.target.value)}
                  className="mt-1 w-full text-xs bg-zinc-950 border border-zinc-800 rounded px-3 py-2 text-zinc-100 focus:outline-none focus:border-blue-500"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-zinc-800">
              <Button variant="ghost" size="sm" onClick={() => setShowPdfModal(false)}>
                Cancel
              </Button>
              <Button variant="primary" size="sm" onClick={handleGeneratePdf} disabled={generatingPdf || !pdfTitle}>
                {generatingPdf ? <Spinner className="w-4 h-4 mr-1.5" /> : <Sparkles className="w-4 h-4 mr-1.5" />}
                Generate & Protect Asset
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
