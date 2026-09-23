import React, { useEffect, useState } from 'react';
import { useApi } from '../../hooks/useApi';
import { useAppStore } from '../../stores/app-store';
import { Card, CardContent, CardHeader, CardTitle, Button, Badge } from '../../components/ui';
import { 
  Mail, Send, Sparkles, RefreshCw, CheckCircle2, 
  Clock, Plus, X, ExternalLink
} from 'lucide-react';

export function OutreachPage() {
  const api = useApi();
  const { currentProjectId, activeProject } = useAppStore();

  const [messages, setMessages] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showPitchModal, setShowPitchModal] = useState(false);
  const [generating, setGenerating] = useState(false);

  // Pitch Generator Form
  const [targetDomain, setTargetDomain] = useState('');
  const [recipientName, setRecipientName] = useState('Editor');
  const [opportunityType, setOpportunityType] = useState('resource_page');
  const [customInstructions, setCustomInstructions] = useState('');
  const [generatedSubject, setGeneratedSubject] = useState('');
  const [generatedBody, setGeneratedBody] = useState('');

  useEffect(() => {
    if (currentProjectId) loadMessages();
  }, [currentProjectId]);

  const loadMessages = async () => {
    if (!api?.outreach || !currentProjectId) return;
    setLoading(true);
    try {
      const list = await api.outreach.getMessages(currentProjectId);
      setMessages(list || []);
    } catch (e) {
      console.error('Failed loading messages:', e);
    } finally {
      setLoading(false);
    }
  };

  const handleGeneratePitch = async () => {
    if (!api?.outreach || !currentProjectId) return;
    setGenerating(true);
    try {
      const result = await api.outreach.generatePitch({
        projectId: currentProjectId,
        recipientName,
        targetDomain: targetDomain || 'prospect-domain.com',
        opportunityType,
        customPrompt: customInstructions,
      });

      if (result) {
        setGeneratedSubject(result.subject || '');
        setGeneratedBody(result.body || '');
      }
    } catch (err: any) {
      console.error('AI pitch error:', err);
    } finally {
      setGenerating(false);
    }
  };

  const handleSaveMessage = async () => {
    if (!api?.outreach || !currentProjectId || !generatedSubject) return;
    try {
      await api.outreach.sendMessage({
        projectId: currentProjectId,
        subject: generatedSubject,
        body: generatedBody,
      });
      setShowPitchModal(false);
      setGeneratedSubject('');
      setGeneratedBody('');
      loadMessages();
    } catch (err) {
      console.error('Save message error:', err);
    }
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-zinc-100 flex items-center gap-2">
            <Mail className="text-orange-500" />
            AI Outreach & Pitch Engine
          </h1>
          <p className="text-xs text-zinc-400 mt-0.5">
            Craft high-converting, personalized outreach emails with Groq / OpenRouter AI models.
          </p>
        </div>

        <Button variant="primary" size="sm" onClick={() => setShowPitchModal(true)}>
          <Sparkles size={13} className="mr-1.5 text-amber-400" />
          Generate AI Pitch
        </Button>
      </div>

      {/* MESSAGES TABLE */}
      <Card className="bg-zinc-900 border-zinc-800">
        <CardHeader className="pb-3 border-b border-zinc-800 flex flex-row items-center justify-between">
          <CardTitle className="text-sm font-semibold text-zinc-200">
            Outreach Campaigns & History ({messages.length})
          </CardTitle>
          <Button variant="secondary" size="sm" onClick={loadMessages}>
            <RefreshCw size={12} />
          </Button>
        </CardHeader>
        <CardContent className="p-0">
          {messages.length === 0 ? (
            <div className="py-16 text-center text-xs text-zinc-500 space-y-2">
              <Mail size={36} className="mx-auto text-zinc-700 mb-2" />
              <p>No outreach messages recorded yet.</p>
              <Button variant="secondary" size="sm" onClick={() => setShowPitchModal(true)}>
                Draft your first AI outreach pitch
              </Button>
            </div>
          ) : (
            <div className="divide-y divide-zinc-800/60">
              {messages.map((m) => (
                <div key={m.id} className="p-4 hover:bg-zinc-800/20 transition-colors space-y-2 text-xs">
                  <div className="flex items-center justify-between">
                    <h4 className="font-semibold text-zinc-100 text-sm">{m.subject}</h4>
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-emerald-500/10 text-emerald-400">
                      {m.status || 'sent'}
                    </span>
                  </div>
                  <p className="text-zinc-400 whitespace-pre-wrap font-sans text-xs bg-zinc-950/60 p-3 rounded border border-zinc-800/50">
                    {m.body}
                  </p>
                  <div className="text-[10px] text-zinc-500 pt-1">
                    Sent: {m.sent_at ? new Date(m.sent_at).toLocaleString() : 'Recently'}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* GENERATE PITCH MODAL */}
      {showPitchModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-4">
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl max-w-2xl w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
              <h3 className="text-base font-semibold text-zinc-100 flex items-center gap-2">
                <Sparkles size={16} className="text-amber-400" />
                AI Outreach Pitch Generator
              </h3>
              <button onClick={() => setShowPitchModal(false)} className="text-zinc-400 hover:text-zinc-200">
                <X size={16} />
              </button>
            </div>

            <div className="space-y-3.5 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-medium text-zinc-300">Target Publication / Domain</label>
                  <input
                    type="text"
                    placeholder="e.g. techtarget.com"
                    value={targetDomain}
                    onChange={(e) => setTargetDomain(e.target.value)}
                    className="mt-1 w-full bg-zinc-950 border border-zinc-800 rounded px-3 py-2 text-zinc-100 focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="font-medium text-zinc-300">Recipient Name / Role</label>
                  <input
                    type="text"
                    placeholder="e.g. Sarah / Managing Editor"
                    value={recipientName}
                    onChange={(e) => setRecipientName(e.target.value)}
                    className="mt-1 w-full bg-zinc-950 border border-zinc-800 rounded px-3 py-2 text-zinc-100 focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="font-medium text-zinc-300">Opportunity Strategy Angle</label>
                <select
                  value={opportunityType}
                  onChange={(e) => setOpportunityType(e.target.value)}
                  className="mt-1 w-full bg-zinc-950 border border-zinc-800 rounded px-3 py-2 text-zinc-200 focus:outline-none focus:border-blue-500"
                >
                  <option value="resource_page">Resource Page Link Addition</option>
                  <option value="broken_link">Broken Link Replacement</option>
                  <option value="link_gap">Competitor Co-Citation Pitch</option>
                  <option value="editorial">Guest Post / Expert Editorial</option>
                </select>
              </div>

              <div>
                <label className="font-medium text-zinc-300">Extra AI Instructions (Optional)</label>
                <input
                  type="text"
                  placeholder="e.g. Keep it under 100 words, friendly tone, highlight data study"
                  value={customInstructions}
                  onChange={(e) => setCustomInstructions(e.target.value)}
                  className="mt-1 w-full bg-zinc-950 border border-zinc-800 rounded px-3 py-2 text-zinc-100 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="flex justify-end pt-1">
                <Button variant="primary" size="sm" onClick={handleGeneratePitch} disabled={generating}>
                  <Sparkles size={13} className="mr-1.5" />
                  {generating ? 'Drafting with AI...' : 'Draft Pitch with LLM'}
                </Button>
              </div>

              {generatedSubject && (
                <div className="space-y-2 pt-3 border-t border-zinc-800">
                  <div>
                    <label className="font-medium text-zinc-300">Generated Subject</label>
                    <input
                      type="text"
                      value={generatedSubject}
                      onChange={(e) => setGeneratedSubject(e.target.value)}
                      className="mt-1 w-full bg-zinc-950 border border-zinc-800 rounded px-3 py-1.5 text-zinc-100 font-medium focus:outline-none focus:border-blue-500"
                    />
                  </div>

                  <div>
                    <label className="font-medium text-zinc-300">Generated Email Body</label>
                    <textarea
                      rows={6}
                      value={generatedBody}
                      onChange={(e) => setGeneratedBody(e.target.value)}
                      className="mt-1 w-full bg-zinc-950 border border-zinc-800 rounded px-3 py-2 text-zinc-100 font-sans focus:outline-none focus:border-blue-500"
                    />
                  </div>
                </div>
              )}

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-zinc-800">
                <Button variant="secondary" onClick={() => setShowPitchModal(false)}>
                  Cancel
                </Button>
                <Button variant="primary" onClick={handleSaveMessage} disabled={!generatedSubject}>
                  <Send size={13} className="mr-1.5" />
                  Record & Queue Message
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}