import { ipcMain } from 'electron';
import { IPC } from '../../shared/ipc-channels';
import { MessageRepository } from '../database/repositories/messages';
import { ProjectRepository } from '../database/repositories/projects';
import { LLMProviderService } from '../providers/llm-provider';
import { Database } from '../database/connection';
import { QueryOptions } from '../../shared/types';

export function registerOutreachHandlers(messageRepo: MessageRepository, projectRepo: ProjectRepository, db: Database) {
  const llmService = new LLMProviderService();
  const sqlite = db.getDb();

  ipcMain.handle(IPC.OUTREACH.GET_MESSAGES, async (_event, projectId: string, options?: QueryOptions) => {
    return messageRepo.findByProject(projectId, options);
  });

  ipcMain.handle(IPC.OUTREACH.GENERATE_PITCH, async (_event, data: {
    projectId: string;
    recipientName?: string;
    targetDomain?: string;
    opportunityType?: string;
    customPrompt?: string;
  }) => {
    const project = projectRepo.findById(data.projectId);
    const domain = data.targetDomain || 'example.com';
    const recipient = data.recipientName || 'Editor / Webmaster';
    const oppType = data.opportunityType || 'resource_page';

    // Retrieve saved providers
    const rows = sqlite.prepare("SELECT key, value FROM settings WHERE category = 'providers'").all() as { key: string; value: string }[];
    let provider = 'groq';
    let apiKey = '';
    let model = 'llama-3.1-8b-instant';

    for (const r of rows) {
      if (r.key === 'provider_groq') {
        try {
          const cfg = JSON.parse(r.value);
          if (cfg.apiKey) {
            provider = 'groq';
            apiKey = cfg.apiKey;
            model = cfg.model || 'llama-3.1-8b-instant';
            break;
          }
        } catch {}
      } else if (r.key === 'provider_openrouter') {
        try {
          const cfg = JSON.parse(r.value);
          if (cfg.apiKey && !apiKey) {
            provider = 'openrouter';
            apiKey = cfg.apiKey;
            model = cfg.model || 'meta-llama/llama-3.3-70b-instruct';
          }
        } catch {}
      }
    }

    const business = project?.business_name || project?.name || 'Our Company';
    const site = project?.website_url || 'https://example.com';
    const desc = project?.business_description || 'a leading provider in this space';

    let subject = `Collaboration & Resource Suggestion for ${domain}`;
    let body = `Hi ${recipient},\n\nI was exploring ${domain} and came across your helpful resources. We recently published a comprehensive guide at ${site} by ${business} (${desc}) that could add strong value to your audience.\n\nWould you be open to referencing this?\n\nBest regards,\n${business} Partnerships`;

    if (apiKey) {
      try {
        const prompt = `Write a high-converting, professional, courteous SEO outreach email pitch from "${business}" (website: ${site}, description: ${desc}) to "${recipient}" at "${domain}".
Opportunity Angle: ${oppType.replace('_', ' ')}.
${data.customPrompt ? `Extra Instructions: ${data.customPrompt}` : ''}

Format your output EXACTLY as:
SUBJECT: <subject line>
BODY:
<body text without placeholders>`;

        const response = await llmService.complete(provider as any, apiKey, model, [
          { role: 'system', content: 'You are an elite SEO outreach and relationship building expert. Write human, respectful, high-converting outreach emails.' },
          { role: 'user', content: prompt }
        ], { maxTokens: 400 });

        if (response) {
          const subMatch = response.match(/SUBJECT:\s*(.+)/i);
          const bodyMatch = response.match(/BODY:\s*([\s\S]+)/i);

          if (subMatch && subMatch[1]) subject = subMatch[1].trim();
          if (bodyMatch && bodyMatch[1]) body = bodyMatch[1].trim();
          else if (!subMatch) body = response.trim();
        }
      } catch (e: any) {
        console.warn('AI pitch generation fallback triggered:', e.message);
      }
    }

    return {
      subject,
      body,
      recipient,
      targetDomain: domain,
      opportunityType: oppType,
      providerUsed: apiKey ? provider : 'template',
    };
  });

  ipcMain.handle(IPC.OUTREACH.SEND_MESSAGE, async (_event, data: any) => {
    return messageRepo.create({
      project_id: data.projectId || 'default',
      campaign_id: data.campaignId || null,
      contact_id: data.contactId || null,
      opportunity_id: data.opportunityId || null,
      type: 'outreach',
      subject: data.subject,
      body: data.body,
      status: 'sent',
      sent_at: new Date().toISOString(),
      response_classification: null,
      created_at: new Date().toISOString(),
    });
  });

  ipcMain.handle(IPC.OUTREACH.UPDATE_STATUS, async (_event, id: string, status: string) => {
    return messageRepo.update(id, { status: status as any });
  });
}
