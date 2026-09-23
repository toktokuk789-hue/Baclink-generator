import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApi } from '../../hooks/useApi';
import { useAppStore } from '../../stores/app-store';
import { Card, CardContent } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Spinner } from '../../components/ui/Spinner';
import {
  Globe,
  Building,
  Target,
  Cpu,
  CheckCircle2,
  ArrowRight,
  ArrowLeft,
  Sparkles,
  Zap,
  ShieldCheck
} from 'lucide-react';

export function OnboardingPage() {
  const navigate = useNavigate();
  const api = useApi();
  const { setCurrentProjectId } = useAppStore();

  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);

  // Form Fields
  const [websiteUrl, setWebsiteUrl] = useState('');
  const [businessName, setBusinessName] = useState('');
  const [industry, setIndustry] = useState('Technology & Software');
  const [businessDesc, setBusinessDesc] = useState('');
  const [country, setCountry] = useState('United States');
  const [targetAudience, setTargetAudience] = useState('');

  // AI Keys
  const [groqKey, setGroqKey] = useState('');
  const [openrouterKey, setOpenrouterKey] = useState('');
  const [groqModel, setGroqModel] = useState('llama-3.1-8b-instant');
  const [openrouterModel, setOpenrouterModel] = useState('meta-llama/llama-3.3-70b-instruct');
  const [aiTesting, setAiTesting] = useState(false);
  const [aiStatus, setAiStatus] = useState<string | null>(null);

  const handleTestAI = async () => {
    if (!api) return;
    setAiTesting(true);
    setAiStatus(null);
    try {
      if (groqKey) {
        const res = await api.providers.testGroq(groqKey, groqModel);
        if (res.activeModel) setGroqModel(res.activeModel);
        setAiStatus(res.success ? res.message : `Groq error: ${res.message}`);
      } else if (openrouterKey) {
        const res = await api.providers.testOpenRouter(openrouterKey, openrouterModel);
        if (res.activeModel) setOpenrouterModel(res.activeModel);
        setAiStatus(res.success ? res.message : `OpenRouter error: ${res.message}`);
      } else {
        setAiStatus('Please enter either a Groq or OpenRouter key to test.');
      }
    } catch (err: any) {
      setAiStatus(`Test failed: ${err.message}`);
    } finally {
      setAiTesting(false);
    }
  };

  const handleFinish = async () => {
    if (!api) {
      navigate('/dashboard');
      return;
    }

    setLoading(true);
    try {
      // 1. Create project in database
      const cleanUrl = websiteUrl.startsWith('http') ? websiteUrl : `https://${websiteUrl}`;
      const name = businessName || cleanUrl.replace(/^https?:\/\//i, '').replace(/^www\./i, '').split('/')[0];

      const project = await api.projects.create({
        name,
        website_url: cleanUrl,
        business_name: businessName || name,
        business_description: businessDesc,
        industry,
        country,
        language: 'en',
        target_audience: targetAudience,
        products_services: 'Digital Solutions & Services',
        keywords: `${industry}, solutions, services`,
        automation_mode: 'assisted',
        status: 'active'
      });

      if (project?.id) {
        setCurrentProjectId(project.id);
      }

      // 2. Save Groq / OpenRouter keys if provided
      if (groqKey) {
        await api.providers.configure('groq', { apiKey: groqKey, model: groqModel || 'llama-3.1-8b-instant' });
      }
      if (openrouterKey) {
        await api.providers.configure('openrouter', { apiKey: openrouterKey, model: openrouterModel || 'meta-llama/llama-3.3-70b-instruct' });
      }

      navigate('/dashboard');
    } catch (err) {
      console.error('Onboarding project creation failed:', err);
      navigate('/dashboard');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl bg-zinc-900 border-zinc-800 shadow-2xl">
        <CardContent className="p-8">
          {/* Progress Indicator */}
          <div className="flex items-center justify-between border-b border-zinc-800 pb-4 mb-6">
            <div className="flex items-center gap-2">
              <span className="font-bold text-base text-zinc-100">BacklinkForge</span>
              <Badge variant="outline" className="text-[10px] text-blue-400 border-blue-500/30">
                Setup Wizard
              </Badge>
            </div>
            <div className="text-xs font-mono text-zinc-400">
              Step {step} of 3
            </div>
          </div>

          {/* STEP 1: WEBSITE & BUSINESS */}
          {step === 1 && (
            <div className="space-y-4">
              <div>
                <h2 className="text-xl font-bold text-zinc-100">Target Website & Business</h2>
                <p className="text-xs text-zinc-400 mt-0.5">
                  Enter your website URL to begin automated site discovery and backlink research.
                </p>
              </div>

              <div className="space-y-3 pt-2">
                <div>
                  <label className="text-xs font-medium text-zinc-300">Website URL *</label>
                  <div className="relative mt-1">
                    <Globe className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
                    <input
                      type="text"
                      placeholder="https://example.com"
                      value={websiteUrl}
                      onChange={(e) => setWebsiteUrl(e.target.value)}
                      className="w-full pl-9 pr-3 py-2 text-xs bg-zinc-950 border border-zinc-800 rounded text-zinc-100 placeholder-zinc-600 focus:outline-none focus:border-blue-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-medium text-zinc-300">Business / Brand Name</label>
                    <input
                      type="text"
                      placeholder="e.g. Acme Corp"
                      value={businessName}
                      onChange={(e) => setBusinessName(e.target.value)}
                      className="mt-1 w-full px-3 py-2 text-xs bg-zinc-950 border border-zinc-800 rounded text-zinc-100 placeholder-zinc-600 focus:outline-none focus:border-blue-500"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-medium text-zinc-300">Industry / Sector</label>
                    <input
                      type="text"
                      value={industry}
                      onChange={(e) => setIndustry(e.target.value)}
                      className="mt-1 w-full px-3 py-2 text-xs bg-zinc-950 border border-zinc-800 rounded text-zinc-100 focus:outline-none focus:border-blue-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs font-medium text-zinc-300">Business Summary</label>
                  <textarea
                    rows={3}
                    placeholder="Describe your core products, services, and value proposition..."
                    value={businessDesc}
                    onChange={(e) => setBusinessDesc(e.target.value)}
                    className="mt-1 w-full px-3 py-2 text-xs bg-zinc-950 border border-zinc-800 rounded text-zinc-100 placeholder-zinc-600 focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div className="flex justify-end pt-4">
                <Button
                  variant="primary"
                  onClick={() => setStep(2)}
                  disabled={!websiteUrl.trim()}
                >
                  Next Step
                  <ArrowRight className="w-4 h-4 ml-1.5" />
                </Button>
              </div>
            </div>
          )}

          {/* STEP 2: TARGET AUDIENCE & REGION */}
          {step === 2 && (
            <div className="space-y-4">
              <div>
                <h2 className="text-xl font-bold text-zinc-100">Market & Audience Focus</h2>
                <p className="text-xs text-zinc-400 mt-0.5">
                  Calibrate the opportunity engine and directory qualification to match your target geography.
                </p>
              </div>

              <div className="space-y-3 pt-2">
                <div>
                  <label className="text-xs font-medium text-zinc-300">Target Operating Country</label>
                  <select
                    value={country}
                    onChange={(e) => setCountry(e.target.value)}
                    className="mt-1 w-full px-3 py-2 text-xs bg-zinc-950 border border-zinc-800 rounded text-zinc-200 focus:outline-none focus:border-blue-500"
                  >
                    <option value="United States">United States</option>
                    <option value="United Kingdom">United Kingdom</option>
                    <option value="Canada">Canada</option>
                    <option value="Australia">Australia</option>
                    <option value="Pakistan">Pakistan</option>
                    <option value="India">India</option>
                    <option value="Germany">Germany</option>
                    <option value="Global">Global / Worldwide</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-medium text-zinc-300">Target Audience Profile</label>
                  <input
                    type="text"
                    placeholder="e.g. Small business owners, marketing managers, developers"
                    value={targetAudience}
                    onChange={(e) => setTargetAudience(e.target.value)}
                    className="mt-1 w-full px-3 py-2 text-xs bg-zinc-950 border border-zinc-800 rounded text-zinc-100 placeholder-zinc-600 focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div className="p-3 rounded bg-zinc-950/60 border border-zinc-800 text-xs text-zinc-400 space-y-1">
                  <div className="font-semibold text-zinc-200 flex items-center gap-1.5">
                    <ShieldCheck className="w-4 h-4 text-blue-400" />
                    Automated Quality Signals
                  </div>
                  <p>BacklinkForge will prioritize directory submissions, guest references, and document platforms aligning with this demographic.</p>
                </div>
              </div>

              <div className="flex justify-between pt-4">
                <Button variant="secondary" onClick={() => setStep(1)}>
                  <ArrowLeft className="w-4 h-4 mr-1.5" />
                  Back
                </Button>
                <Button variant="primary" onClick={() => setStep(3)}>
                  Next: AI Engine Setup
                  <ArrowRight className="w-4 h-4 ml-1.5" />
                </Button>
              </div>
            </div>
          )}

          {/* STEP 3: AI ENGINE SETUP (GROQ & OPENROUTER) */}
          {step === 3 && (
            <div className="space-y-4">
              <div>
                <h2 className="text-xl font-bold text-zinc-100">AI Intelligence Engine Setup</h2>
                <p className="text-xs text-zinc-400 mt-0.5">
                  Optionally configure Groq or OpenRouter for autonomous opportunity qualification and personalized outreach generation.
                </p>
              </div>

              <div className="space-y-3 pt-2">
                {/* Groq API Setup */}
                <div className="p-3.5 rounded-lg bg-zinc-950/70 border border-zinc-800 space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Zap className="w-4 h-4 text-orange-400" />
                      <span className="text-xs font-semibold text-zinc-200">Groq API Key (Fastest Inference)</span>
                    </div>
                    <Badge variant="outline" className="text-[10px] text-orange-400 border-orange-500/30">
                      Llama 3.3 70B
                    </Badge>
                  </div>
                  <input
                    type="password"
                    placeholder="gsk_..."
                    value={groqKey}
                    onChange={(e) => setGroqKey(e.target.value)}
                    className="w-full text-xs font-mono bg-zinc-900 border border-zinc-800 rounded px-3 py-1.5 text-zinc-100 placeholder-zinc-600 focus:outline-none focus:border-blue-500"
                  />
                  <div className="flex items-center gap-2 pt-1">
                    <span className="text-[10px] text-zinc-400">Model:</span>
                    <select
                      value={groqModel}
                      onChange={(e) => setGroqModel(e.target.value)}
                      className="text-[11px] bg-zinc-900 border border-zinc-800 rounded px-2 py-1 text-zinc-300 focus:outline-none focus:border-blue-500"
                    >
                      <option value="llama-3.1-8b-instant">llama-3.1-8b-instant (Fastest & Universal)</option>
                      <option value="llama-3.3-70b-versatile">llama-3.3-70b-versatile (Llama 3.3 70B)</option>
                      <option value="deepseek-r1-distill-llama-70b">deepseek-r1-distill-llama-70b (DeepSeek R1)</option>
                      <option value="mixtral-8x7b-32768">mixtral-8x7b-32768 (Mixtral 32k)</option>
                      <option value="gemma2-9b-it">gemma2-9b-it (Google Gemma 2 9B)</option>
                    </select>
                  </div>
                  <p className="text-[10px] text-zinc-500">
                    Get a key from <a href="https://console.groq.com/keys" target="_blank" rel="noreferrer" className="text-blue-400 hover:underline">console.groq.com/keys</a>
                  </p>
                </div>

                {/* OpenRouter API Setup */}
                <div className="p-3.5 rounded-lg bg-zinc-950/70 border border-zinc-800 space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-purple-400" />
                      <span className="text-xs font-semibold text-zinc-200">OpenRouter API Key (Universal Models)</span>
                    </div>
                    <Badge variant="outline" className="text-[10px] text-purple-400 border-purple-500/30">
                      Claude / DeepSeek
                    </Badge>
                  </div>
                  <input
                    type="password"
                    placeholder="sk-or-v1-..."
                    value={openrouterKey}
                    onChange={(e) => setOpenrouterKey(e.target.value)}
                    className="w-full text-xs font-mono bg-zinc-900 border border-zinc-800 rounded px-3 py-1.5 text-zinc-100 placeholder-zinc-600 focus:outline-none focus:border-blue-500"
                  />
                  <div className="flex items-center gap-2 pt-1">
                    <span className="text-[10px] text-zinc-400">Model:</span>
                    <select
                      value={openrouterModel}
                      onChange={(e) => setOpenrouterModel(e.target.value)}
                      className="text-[11px] bg-zinc-900 border border-zinc-800 rounded px-2 py-1 text-zinc-300 focus:outline-none focus:border-blue-500"
                    >
                      <option value="meta-llama/llama-3.3-70b-instruct">meta-llama/llama-3.3-70b-instruct</option>
                      <option value="deepseek/deepseek-r1">deepseek/deepseek-r1</option>
                      <option value="anthropic/claude-3.5-sonnet">anthropic/claude-3.5-sonnet</option>
                      <option value="google/gemini-2.0-flash-001">google/gemini-2.0-flash-001</option>
                    </select>
                  </div>
                  <p className="text-[10px] text-zinc-500">
                    Get a key from <a href="https://openrouter.ai/keys" target="_blank" rel="noreferrer" className="text-blue-400 hover:underline">openrouter.ai/keys</a>
                  </p>
                </div>

                {aiStatus && (
                  <div className="p-2.5 rounded bg-zinc-950 border border-zinc-800 text-xs text-zinc-300 font-mono">
                    {aiStatus}
                  </div>
                )}

                {(groqKey || openrouterKey) && (
                  <div className="flex justify-end">
                    <Button variant="secondary" size="sm" onClick={handleTestAI} disabled={aiTesting}>
                      {aiTesting ? <Spinner className="w-3.5 h-3.5 mr-1.5" /> : <Cpu className="w-3.5 h-3.5 mr-1.5" />}
                      Test Connection
                    </Button>
                  </div>
                )}
              </div>

              <div className="flex justify-between pt-4">
                <Button variant="secondary" onClick={() => setStep(2)}>
                  <ArrowLeft className="w-4 h-4 mr-1.5" />
                  Back
                </Button>
                <Button variant="primary" onClick={handleFinish} disabled={loading}>
                  {loading ? <Spinner className="w-4 h-4 mr-1.5" /> : <CheckCircle2 className="w-4 h-4 mr-1.5 text-emerald-400" />}
                  Launch BacklinkForge
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}