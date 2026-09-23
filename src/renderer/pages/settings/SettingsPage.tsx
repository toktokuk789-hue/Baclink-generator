import React, { useState, useEffect } from 'react';
import { useApi } from '../../hooks/useApi';
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent
} from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Spinner } from '../../components/ui/Spinner';
import {
  Key,
  Cpu,
  ShieldCheck,
  Globe,
  Database,
  CheckCircle2,
  AlertCircle,
  Eye,
  EyeOff,
  Sparkles,
  Zap,
  Save,
  Server
} from 'lucide-react';

export function SettingsPage() {
  const api = useApi();
  const [activeTab, setActiveTab] = useState<'ai' | 'browser' | 'database'>('ai');

  // Groq State
  const [groqKey, setGroqKey] = useState('');
  const [groqModel, setGroqModel] = useState('llama-3.3-70b-versatile');
  const [groqTesting, setGroqTesting] = useState(false);
  const [groqStatus, setGroqStatus] = useState<{ success?: boolean; message?: string } | null>(null);
  const [showGroqKey, setShowGroqKey] = useState(false);

  // OpenRouter State
  const [openrouterKey, setOpenrouterKey] = useState('');
  const [openrouterModel, setOpenrouterModel] = useState('anthropic/claude-3.5-sonnet');
  const [openrouterTesting, setOpenrouterTesting] = useState(false);
  const [openrouterStatus, setOpenrouterStatus] = useState<{ success?: boolean; message?: string } | null>(null);
  const [showOpenrouterKey, setShowOpenrouterKey] = useState(false);

  // Browser CDP State
  const [cdpEndpoint, setCdpEndpoint] = useState('http://127.0.0.1:9222');
  const [savingSettings, setSavingSettings] = useState(false);

  useEffect(() => {
    loadSavedSettings();
  }, []);

  const loadSavedSettings = async () => {
    if (!api) return;
    try {
      const providers = await api.providers.getAll();
      if (providers?.groq) {
        setGroqKey(providers.groq.apiKey || '');
        setGroqModel(providers.groq.model || 'llama-3.3-70b-versatile');
      }
      if (providers?.openrouter) {
        setOpenrouterKey(providers.openrouter.apiKey || '');
        setOpenrouterModel(providers.openrouter.model || 'anthropic/claude-3.5-sonnet');
      }
      const savedCdp = await api.settings.get('chrome_cdp_endpoint');
      if (savedCdp) setCdpEndpoint(savedCdp);
    } catch (err) {
      console.error('Failed to load settings:', err);
    }
  };

  const handleTestGroq = async () => {
    if (!api || !groqKey) return;
    setGroqTesting(true);
    setGroqStatus(null);
    try {
      const res = await api.providers.testGroq(groqKey, groqModel);
      setGroqStatus(res);
      if (res.success) {
        await api.providers.configure('groq', { apiKey: groqKey, model: groqModel });
      }
    } catch (err: any) {
      setGroqStatus({ success: false, message: err.message });
    } finally {
      setGroqTesting(false);
    }
  };

  const handleSaveGroq = async () => {
    if (!api) return;
    setSavingSettings(true);
    try {
      await api.providers.configure('groq', { apiKey: groqKey, model: groqModel });
      alert('Groq configuration saved successfully.');
    } catch (err) {
      console.error('Save failed:', err);
    } finally {
      setSavingSettings(false);
    }
  };

  const handleTestOpenRouter = async () => {
    if (!api || !openrouterKey) return;
    setOpenrouterTesting(true);
    setOpenrouterStatus(null);
    try {
      const res = await api.providers.testOpenRouter(openrouterKey, openrouterModel);
      setOpenrouterStatus(res);
      if (res.success) {
        await api.providers.configure('openrouter', { apiKey: openrouterKey, model: openrouterModel });
      }
    } catch (err: any) {
      setOpenrouterStatus({ success: false, message: err.message });
    } finally {
      setOpenrouterTesting(false);
    }
  };

  const handleSaveOpenRouter = async () => {
    if (!api) return;
    setSavingSettings(true);
    try {
      await api.providers.configure('openrouter', { apiKey: openrouterKey, model: openrouterModel });
      alert('OpenRouter configuration saved successfully.');
    } catch (err) {
      console.error('Save failed:', err);
    } finally {
      setSavingSettings(false);
    }
  };

  const handleSaveBrowser = async () => {
    if (!api) return;
    try {
      await api.settings.set('chrome_cdp_endpoint', cdpEndpoint);
      alert('Browser configuration saved.');
    } catch (err) {
      console.error('Save browser settings failed:', err);
    }
  };

  return (
    <div className="space-y-6 max-w-5xl">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-zinc-100">Settings & API Providers</h1>
        <p className="text-sm text-zinc-400 mt-1">
          Configure AI intelligence engines, local Chrome automation parameters, and database encryption.
        </p>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-zinc-800">
        <button
          onClick={() => setActiveTab('ai')}
          className={`pb-3 px-4 text-sm font-medium border-b-2 transition-colors ${
            activeTab === 'ai'
              ? 'border-blue-500 text-blue-400'
              : 'border-transparent text-zinc-400 hover:text-zinc-200'
          }`}
        >
          <div className="flex items-center gap-2">
            <Cpu className="w-4 h-4" />
            AI Model Providers
          </div>
        </button>

        <button
          onClick={() => setActiveTab('browser')}
          className={`pb-3 px-4 text-sm font-medium border-b-2 transition-colors ${
            activeTab === 'browser'
              ? 'border-blue-500 text-blue-400'
              : 'border-transparent text-zinc-400 hover:text-zinc-200'
          }`}
        >
          <div className="flex items-center gap-2">
            <Globe className="w-4 h-4" />
            Chrome Browser Hub
          </div>
        </button>

        <button
          onClick={() => setActiveTab('database')}
          className={`pb-3 px-4 text-sm font-medium border-b-2 transition-colors ${
            activeTab === 'database'
              ? 'border-blue-500 text-blue-400'
              : 'border-transparent text-zinc-400 hover:text-zinc-200'
          }`}
        >
          <div className="flex items-center gap-2">
            <Database className="w-4 h-4" />
            Database & Security
          </div>
        </button>
      </div>

      {/* TAB 1: AI MODEL PROVIDERS (GROQ & OPENROUTER) */}
      {activeTab === 'ai' && (
        <div className="space-y-6">
          {/* GROQ API SETUP CARD */}
          <Card className="bg-zinc-900/60 border-zinc-800">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-orange-500/10 border border-orange-500/20 flex items-center justify-center">
                    <Zap className="w-4 h-4 text-orange-400" />
                  </div>
                  <div>
                    <CardTitle className="text-base text-zinc-100 flex items-center gap-2">
                      Groq API Configuration
                      <Badge variant="outline" className="text-[10px] text-orange-400 border-orange-500/30 bg-orange-500/10">
                        Ultra High Speed (500+ tok/s)
                      </Badge>
                    </CardTitle>
                    <CardDescription className="text-xs text-zinc-400">
                      Powers high-speed opportunity qualification, link context classification, and profile drafting.
                    </CardDescription>
                  </div>
                </div>

                {groqStatus?.success && (
                  <Badge variant="success" size="sm">
                    <CheckCircle2 className="w-3 h-3 mr-1" />
                    Connected
                  </Badge>
                )}
              </div>
            </CardHeader>

            <CardContent className="space-y-4 pt-1">
              <div className="space-y-3">
                <div>
                  <label className="text-xs font-medium text-zinc-300">Groq API Key</label>
                  <div className="relative mt-1">
                    <input
                      type={showGroqKey ? 'text' : 'password'}
                      placeholder="gsk_..."
                      value={groqKey}
                      onChange={(e) => setGroqKey(e.target.value)}
                      className="w-full text-xs font-mono bg-zinc-950 border border-zinc-800 rounded px-3 py-2 pr-10 text-zinc-100 placeholder-zinc-600 focus:outline-none focus:border-blue-500"
                    />
                    <button
                      type="button"
                      onClick={() => setShowGroqKey(!showGroqKey)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300"
                    >
                      {showGroqKey ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                  <p className="text-[11px] text-zinc-500 mt-1">
                    Get your key from{' '}
                    <a
                      href="https://console.groq.com/keys"
                      target="_blank"
                      rel="noreferrer"
                      className="text-blue-400 hover:underline"
                    >
                      console.groq.com/keys
                    </a>
                  </p>
                </div>

                <div>
                  <label className="text-xs font-medium text-zinc-300">Model Selection</label>
                  <select
                    value={groqModel}
                    onChange={(e) => setGroqModel(e.target.value)}
                    className="mt-1 w-full text-xs bg-zinc-950 border border-zinc-800 rounded px-3 py-2 text-zinc-200 focus:outline-none focus:border-blue-500"
                  >
                    <option value="llama-3.3-70b-versatile">llama-3.3-70b-versatile (Recommended - High Reasoning)</option>
                    <option value="deepseek-r1-distill-llama-70b">deepseek-r1-distill-llama-70b (Deep Reasoning & Strategy)</option>
                    <option value="mixtral-8x7b-32768">mixtral-8x7b-32768 (High Context 32k)</option>
                    <option value="llama-3.1-8b-instant">llama-3.1-8b-instant (Ultra Fast Extraction)</option>
                  </select>
                </div>

                {groqStatus && (
                  <div
                    className={`p-3 rounded text-xs flex items-start gap-2 ${
                      groqStatus.success
                        ? 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-300'
                        : 'bg-red-500/10 border border-red-500/20 text-red-300'
                    }`}
                  >
                    {groqStatus.success ? (
                      <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400 mt-0.5" />
                    ) : (
                      <AlertCircle className="w-4 h-4 shrink-0 text-red-400 mt-0.5" />
                    )}
                    <div className="break-all">{groqStatus.message}</div>
                  </div>
                )}
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-zinc-800/80">
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={handleTestGroq}
                  disabled={groqTesting || !groqKey}
                >
                  {groqTesting ? <Spinner className="w-3.5 h-3.5 mr-1.5" /> : <Zap className="w-3.5 h-3.5 mr-1.5" />}
                  Test Groq Connection
                </Button>
                <Button
                  variant="primary"
                  size="sm"
                  onClick={handleSaveGroq}
                  disabled={savingSettings || !groqKey}
                >
                  <Save className="w-3.5 h-3.5 mr-1.5" />
                  Save Groq Config
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* OPENROUTER API SETUP CARD */}
          <Card className="bg-zinc-900/60 border-zinc-800">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-purple-500/10 border border-purple-500/20 flex items-center justify-center">
                    <Sparkles className="w-4 h-4 text-purple-400" />
                  </div>
                  <div>
                    <CardTitle className="text-base text-zinc-100 flex items-center gap-2">
                      OpenRouter API Configuration
                      <Badge variant="outline" className="text-[10px] text-purple-400 border-purple-500/30 bg-purple-500/10">
                        Universal Multi-Model Hub
                      </Badge>
                    </CardTitle>
                    <CardDescription className="text-xs text-zinc-400">
                      Access Claude 3.5 Sonnet, DeepSeek R1, GPT-4o, and hundreds of top foundation models through a single key.
                    </CardDescription>
                  </div>
                </div>

                {openrouterStatus?.success && (
                  <Badge variant="success" size="sm">
                    <CheckCircle2 className="w-3 h-3 mr-1" />
                    Connected
                  </Badge>
                )}
              </div>
            </CardHeader>

            <CardContent className="space-y-4 pt-1">
              <div className="space-y-3">
                <div>
                  <label className="text-xs font-medium text-zinc-300">OpenRouter API Key</label>
                  <div className="relative mt-1">
                    <input
                      type={showOpenrouterKey ? 'text' : 'password'}
                      placeholder="sk-or-v1-..."
                      value={openrouterKey}
                      onChange={(e) => setOpenrouterKey(e.target.value)}
                      className="w-full text-xs font-mono bg-zinc-950 border border-zinc-800 rounded px-3 py-2 pr-10 text-zinc-100 placeholder-zinc-600 focus:outline-none focus:border-blue-500"
                    />
                    <button
                      type="button"
                      onClick={() => setShowOpenrouterKey(!showOpenrouterKey)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300"
                    >
                      {showOpenrouterKey ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                  <p className="text-[11px] text-zinc-500 mt-1">
                    Get your key from{' '}
                    <a
                      href="https://openrouter.ai/keys"
                      target="_blank"
                      rel="noreferrer"
                      className="text-blue-400 hover:underline"
                    >
                      openrouter.ai/keys
                    </a>
                  </p>
                </div>

                <div>
                  <label className="text-xs font-medium text-zinc-300">Default Model</label>
                  <select
                    value={openrouterModel}
                    onChange={(e) => setOpenrouterModel(e.target.value)}
                    className="mt-1 w-full text-xs bg-zinc-950 border border-zinc-800 rounded px-3 py-2 text-zinc-200 focus:outline-none focus:border-blue-500"
                  >
                    <option value="anthropic/claude-3.5-sonnet">anthropic/claude-3.5-sonnet (Industry Leading Outreach & Strategy)</option>
                    <option value="deepseek/deepseek-r1">deepseek/deepseek-r1 (Deep Mathematical & Logical Reasoning)</option>
                    <option value="openai/gpt-4o">openai/gpt-4o (Multimodal & Fast)</option>
                    <option value="meta-llama/llama-3.3-70b-instruct">meta-llama/llama-3.3-70b-instruct (Cost Effective Open Source)</option>
                    <option value="google/gemini-2.5-pro">google/gemini-2.5-pro (Large Context)</option>
                  </select>
                </div>

                {openrouterStatus && (
                  <div
                    className={`p-3 rounded text-xs flex items-start gap-2 ${
                      openrouterStatus.success
                        ? 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-300'
                        : 'bg-red-500/10 border border-red-500/20 text-red-300'
                    }`}
                  >
                    {openrouterStatus.success ? (
                      <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400 mt-0.5" />
                    ) : (
                      <AlertCircle className="w-4 h-4 shrink-0 text-red-400 mt-0.5" />
                    )}
                    <div className="break-all">{openrouterStatus.message}</div>
                  </div>
                )}
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-zinc-800/80">
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={handleTestOpenRouter}
                  disabled={openrouterTesting || !openrouterKey}
                >
                  {openrouterTesting ? <Spinner className="w-3.5 h-3.5 mr-1.5" /> : <Sparkles className="w-3.5 h-3.5 mr-1.5" />}
                  Test OpenRouter Connection
                </Button>
                <Button
                  variant="primary"
                  size="sm"
                  onClick={handleSaveOpenRouter}
                  disabled={savingSettings || !openrouterKey}
                >
                  <Save className="w-3.5 h-3.5 mr-1.5" />
                  Save OpenRouter Config
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* TAB 2: CHROME BROWSER HUB SETTINGS */}
      {activeTab === 'browser' && (
        <Card className="bg-zinc-900/60 border-zinc-800">
          <CardHeader>
            <CardTitle className="text-base text-zinc-100">Chrome Automation & CDP Endpoint</CardTitle>
            <CardDescription className="text-xs text-zinc-400">
              Connect BacklinkForge to your existing Google Chrome browser session with remote debugging enabled.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-xs font-medium text-zinc-300">Chrome DevTools Protocol (CDP) Endpoint</label>
              <input
                type="text"
                value={cdpEndpoint}
                onChange={(e) => setCdpEndpoint(e.target.value)}
                placeholder="http://127.0.0.1:9222"
                className="mt-1 w-full text-xs font-mono bg-zinc-950 border border-zinc-800 rounded px-3 py-2 text-zinc-100 focus:outline-none focus:border-blue-500"
              />
              <p className="text-[11px] text-zinc-500 mt-1">
                To launch Chrome with debugging: <code className="text-zinc-400">chrome.exe --remote-debugging-port=9222</code>
              </p>
            </div>

            <div className="p-3 rounded bg-zinc-950/70 border border-zinc-800 text-xs space-y-1 text-zinc-400">
              <div className="font-semibold text-zinc-200 flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                Human-in-the-Loop Protection
              </div>
              <p>Whenever CAPTCHAs, MFA, or security verifications occur, BacklinkForge automatically pauses and hands control to you in Chrome.</p>
            </div>

            <div className="pt-2 flex justify-end">
              <Button variant="primary" size="sm" onClick={handleSaveBrowser}>
                Save Browser Settings
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* TAB 3: DATABASE & SECURITY */}
      {activeTab === 'database' && (
        <Card className="bg-zinc-900/60 border-zinc-800">
          <CardHeader>
            <CardTitle className="text-base text-zinc-100">Local Database & Windows Security</CardTitle>
            <CardDescription className="text-xs text-zinc-400">
              SQLite embedded engine status and OS security layers.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 text-xs">
            <div className="flex justify-between py-2 border-b border-zinc-800">
              <span className="text-zinc-400">Database Engine:</span>
              <span className="font-mono text-zinc-200">SQLite (better-sqlite3)</span>
            </div>
            <div className="flex justify-between py-2 border-b border-zinc-800">
              <span className="text-zinc-400">Journal Mode:</span>
              <span className="font-mono text-emerald-400">WAL (Write-Ahead Logging)</span>
            </div>
            <div className="flex justify-between py-2 border-b border-zinc-800">
              <span className="text-zinc-400">Credential Encryption:</span>
              <span className="font-mono text-emerald-400">Windows DPAPI (safeStorage)</span>
            </div>
            <div className="flex justify-between py-2">
              <span className="text-zinc-400">Local Storage Location:</span>
              <span className="font-mono text-zinc-300">userData / backlinkforge.db</span>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}