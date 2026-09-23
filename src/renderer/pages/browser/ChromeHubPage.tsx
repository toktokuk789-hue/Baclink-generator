import React, { useEffect, useState } from 'react';
import { useApi } from '../../hooks/useApi';
import { Card, CardContent, CardHeader, CardTitle, Button, Badge } from '../../components/ui';
import { 
  Chrome, Play, Square, ExternalLink, RefreshCw, AlertCircle, 
  CheckCircle2, ShieldAlert, Monitor, Terminal
} from 'lucide-react';

export function ChromeHubPage() {
  const api = useApi();
  const [cdpEndpoint, setCdpEndpoint] = useState('http://127.0.0.1:9222');
  const [status, setStatus] = useState<any>({
    status: 'disconnected',
    currentUrl: null,
    activeTabsCount: 0,
    waitingForHuman: false,
    humanReason: null
  });
  const [targetUrl, setTargetUrl] = useState('https://google.com');
  const [loading, setLoading] = useState(false);
  const [logs, setLogs] = useState<string[]>([]);

  useEffect(() => {
    checkStatus();
  }, []);

  const addLog = (msg: string) => {
    setLogs(prev => [ `[${new Date().toLocaleTimeString()}] ${msg}`, ...prev.slice(0, 40) ]);
  };

  const checkStatus = async () => {
    if (!api?.browser) return;
    try {
      const s = await api.browser.getStatus();
      if (s) setStatus(s);
    } catch (e: any) {
      console.warn('Browser getStatus error:', e);
    }
  };

  const handleConnect = async () => {
    if (!api?.browser) return;
    setLoading(true);
    addLog(`Attempting connection to Chrome CDP at ${cdpEndpoint}...`);
    try {
      const res = await api.browser.connect({ endpoint: cdpEndpoint });
      setStatus(res);
      addLog(`Connected successfully! Active tabs: ${res.activeTabsCount}`);
    } catch (err: any) {
      addLog(`Connection failed: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleDisconnect = async () => {
    if (!api?.browser) return;
    try {
      await api.browser.disconnect();
      addLog('Disconnected from browser session.');
      checkStatus();
    } catch (err: any) {
      addLog(`Disconnect failed: ${err.message}`);
    }
  };

  const handleNavigate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!api?.browser || !targetUrl.trim()) return;
    addLog(`Navigating browser to: ${targetUrl}...`);
    try {
      await api.browser.openUrl(targetUrl);
      addLog(`Navigation completed.`);
      checkStatus();
    } catch (err: any) {
      addLog(`Navigation error: ${err.message}`);
    }
  };

  const isConnected = status.status === 'ready' || status.status === 'busy';

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* HEADER */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-zinc-100 flex items-center gap-2">
          <Chrome className="text-yellow-500" />
          Chrome Browser Hub & Automation Bridge
        </h1>
        <p className="text-xs text-zinc-400 mt-0.5">
          Connect to local Chrome via Chrome DevTools Protocol (CDP) for human-in-the-loop navigation and submission execution.
        </p>
      </div>

      {/* HUMAN HANDOFF BANNER */}
      {status.waitingForHuman && (
        <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 flex items-start gap-3">
          <ShieldAlert size={20} className="shrink-0 text-amber-400 mt-0.5" />
          <div>
            <div className="font-semibold text-sm">Human Intervention Required</div>
            <p className="text-xs text-amber-200/80 mt-0.5">
              {status.humanReason || 'A CAPTCHA or authentication wall was encountered. Please complete it in the Chrome window.'}
            </p>
          </div>
        </div>
      )}

      {/* CONNECTION CONTROL PANEL */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card className="bg-zinc-900 border-zinc-800">
          <CardHeader className="pb-3 border-b border-zinc-800">
            <CardTitle className="text-sm font-semibold text-zinc-200 flex items-center justify-between">
              <span>CDP Bridge Connection</span>
              <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                isConnected ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-zinc-800 text-zinc-400'
              }`}>
                {status.status}
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 pt-4 text-xs">
            <div>
              <label className="font-medium text-zinc-300">CDP Remote Debugging URL</label>
              <input
                type="text"
                value={cdpEndpoint}
                onChange={(e) => setCdpEndpoint(e.target.value)}
                className="mt-1 w-full bg-zinc-950 border border-zinc-800 rounded px-3 py-2 text-zinc-100 font-mono focus:outline-none focus:border-blue-500"
              />
              <p className="text-[10px] text-zinc-500 mt-1">
                Launch Chrome with: <code className="text-zinc-400 bg-zinc-950 px-1 py-0.5 rounded">chrome.exe --remote-debugging-port=9222</code>
              </p>
            </div>

            <div className="flex items-center gap-2 pt-2">
              {!isConnected ? (
                <Button variant="primary" onClick={handleConnect} disabled={loading} className="w-full">
                  <Play size={13} className="mr-1.5 fill-current" />
                  {loading ? 'Connecting...' : 'Connect to Chrome'}
                </Button>
              ) : (
                <Button variant="secondary" onClick={handleDisconnect} className="w-full text-red-400 border-red-500/30">
                  <Square size={13} className="mr-1.5 fill-current" />
                  Disconnect
                </Button>
              )}
              <Button variant="secondary" onClick={checkStatus}>
                <RefreshCw size={13} />
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* BROWSER INTERACTION */}
        <Card className="bg-zinc-900 border-zinc-800">
          <CardHeader className="pb-3 border-b border-zinc-800">
            <CardTitle className="text-sm font-semibold text-zinc-200">Active Tab & Navigation</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 pt-4 text-xs">
            <form onSubmit={handleNavigate} className="space-y-3">
              <div>
                <label className="font-medium text-zinc-300">Navigate to URL</label>
                <input
                  type="text"
                  placeholder="https://..."
                  value={targetUrl}
                  onChange={(e) => setTargetUrl(e.target.value)}
                  disabled={!isConnected}
                  className="mt-1 w-full bg-zinc-950 border border-zinc-800 rounded px-3 py-2 text-zinc-100 font-mono focus:outline-none focus:border-blue-500 disabled:opacity-50"
                />
              </div>
              <Button variant="primary" type="submit" disabled={!isConnected} className="w-full">
                <ExternalLink size={13} className="mr-1.5" />
                Open in Controlled Chrome
              </Button>
            </form>

            <div className="p-3 bg-zinc-950 rounded border border-zinc-800/80 space-y-1.5 text-[11px]">
              <div className="text-zinc-500">Current URL:</div>
              <div className="font-mono text-zinc-300 truncate">{status.currentUrl || 'No tab loaded'}</div>
              <div className="text-zinc-500 pt-1">Active Tabs: <strong className="text-zinc-200">{status.activeTabsCount || 0}</strong></div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* SESSION LOGS */}
      <Card className="bg-zinc-900 border-zinc-800">
        <CardHeader className="pb-2 flex flex-row items-center justify-between">
          <CardTitle className="text-xs font-semibold text-zinc-400 flex items-center gap-1.5 uppercase tracking-wider">
            <Terminal size={13} />
            Browser Automation Activity Log
          </CardTitle>
          <Button variant="secondary" size="sm" onClick={() => setLogs([])}>Clear</Button>
        </CardHeader>
        <CardContent>
          <div className="h-44 bg-zinc-950 border border-zinc-800 rounded-md p-3 overflow-y-auto font-mono text-[11px] text-zinc-400 space-y-1">
            {logs.length === 0 ? (
              <span className="text-zinc-600 italic">No activity yet. Connect to Chrome to begin automation.</span>
            ) : (
              logs.map((log, idx) => <div key={idx} className="leading-relaxed">{log}</div>)
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}