import { request } from 'undici';

export interface LLMMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface LLMCompletionOptions {
  model?: string;
  temperature?: number;
  maxTokens?: number;
}

export interface LLMProviderConfig {
  apiKey: string;
  model: string;
  baseUrl?: string;
}

export class LLMProviderService {
  /**
   * Test connection to Groq API
   */
  public async testGroq(apiKey: string, model: string = 'llama-3.3-70b-versatile'): Promise<{ success: boolean; message: string }> {
    try {
      if (!apiKey || apiKey.trim().length === 0) {
        return { success: false, message: 'Groq API Key is empty.' };
      }

      const response = await request('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey.trim()}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: model || 'llama-3.3-70b-versatile',
          messages: [{ role: 'user', content: 'Respond with "Groq connection verified."' }],
          max_tokens: 15,
        }),
      });

      if (response.statusCode === 200) {
        const body = (await response.body.json()) as any;
        const text = body.choices?.[0]?.message?.content || 'Verified';
        return { success: true, message: `Successfully connected to Groq (${model}): "${text.trim()}"` };
      } else {
        const errorText = await response.body.text();
        return { success: false, message: `Groq error (HTTP ${response.statusCode}): ${errorText}` };
      }
    } catch (err: any) {
      return { success: false, message: `Groq connection failed: ${err.message}` };
    }
  }

  /**
   * Test connection to OpenRouter API
   */
  public async testOpenRouter(apiKey: string, model: string = 'anthropic/claude-3.5-sonnet'): Promise<{ success: boolean; message: string }> {
    try {
      if (!apiKey || apiKey.trim().length === 0) {
        return { success: false, message: 'OpenRouter API Key is empty.' };
      }

      const response = await request('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey.trim()}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': 'https://backlinkforge.app',
          'X-Title': 'BacklinkForge SEO OS',
        },
        body: JSON.stringify({
          model: model || 'anthropic/claude-3.5-sonnet',
          messages: [{ role: 'user', content: 'Respond with "OpenRouter connection verified."' }],
          max_tokens: 15,
        }),
      });

      if (response.statusCode === 200) {
        const body = (await response.body.json()) as any;
        const text = body.choices?.[0]?.message?.content || 'Verified';
        return { success: true, message: `Successfully connected to OpenRouter (${model}): "${text.trim()}"` };
      } else {
        const errorText = await response.body.text();
        return { success: false, message: `OpenRouter error (HTTP ${response.statusCode}): ${errorText}` };
      }
    } catch (err: any) {
      return { success: false, message: `OpenRouter connection failed: ${err.message}` };
    }
  }

  /**
   * Universal completion router prioritizing configured high-speed / reasoning models
   */
  public async complete(
    provider: 'groq' | 'openrouter',
    apiKey: string,
    model: string,
    messages: LLMMessage[],
    options?: LLMCompletionOptions
  ): Promise<string> {
    const isGroq = provider === 'groq';
    const endpoint = isGroq 
      ? 'https://api.groq.com/openai/v1/chat/completions' 
      : 'https://openrouter.ai/api/v1/chat/completions';

    const headers: Record<string, string> = {
      'Authorization': `Bearer ${apiKey.trim()}`,
      'Content-Type': 'application/json',
    };

    if (!isGroq) {
      headers['HTTP-Referer'] = 'https://backlinkforge.app';
      headers['X-Title'] = 'BacklinkForge';
    }

    const response = await request(endpoint, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        model,
        messages,
        temperature: options?.temperature ?? 0.7,
        max_tokens: options?.maxTokens ?? 1024,
      }),
    });

    if (response.statusCode !== 200) {
      const err = await response.body.text();
      throw new Error(`${provider.toUpperCase()} API Error (${response.statusCode}): ${err}`);
    }

    const data = (await response.body.json()) as any;
    return data.choices?.[0]?.message?.content || '';
  }
}
