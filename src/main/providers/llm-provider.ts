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
   * Fetch available models for a Groq API key
   */
  public async getGroqModels(apiKey: string): Promise<string[]> {
    try {
      const response = await request('https://api.groq.com/openai/v1/models', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${apiKey.trim()}`,
        },
      });

      if (response.statusCode === 200) {
        const body = (await response.body.json()) as any;
        if (Array.isArray(body.data)) {
          return body.data
            .map((m: any) => m.id as string)
            .filter((id: string) => !id.includes('whisper') && !id.includes('guard'));
        }
      }
    } catch (e) {
      console.warn('Could not fetch Groq models list:', e);
    }
    return ['llama-3.1-8b-instant', 'llama-3.3-70b-versatile', 'deepseek-r1-distill-llama-70b', 'mixtral-8x7b-32768'];
  }

  /**
   * Test connection to Groq API with automatic fallback to active models
   */
  public async testGroq(apiKey: string, preferredModel?: string): Promise<{ success: boolean; message: string; activeModel?: string; availableModels?: string[] }> {
    try {
      if (!apiKey || apiKey.trim().length === 0) {
        return { success: false, message: 'Groq API Key is empty.' };
      }

      const key = apiKey.trim();

      // Step 1: Query models list from Groq to verify key and obtain allowed models
      let availableModels: string[] = [];
      try {
        const modelsRes = await request('https://api.groq.com/openai/v1/models', {
          method: 'GET',
          headers: { 'Authorization': `Bearer ${key}` },
        });

        if (modelsRes.statusCode === 401) {
          return { success: false, message: 'Invalid Groq API Key (HTTP 401). Please check your key at console.groq.com/keys' };
        }

        if (modelsRes.statusCode === 200) {
          const body = (await modelsRes.body.json()) as any;
          if (Array.isArray(body?.data)) {
            availableModels = body.data
              .map((m: any) => m.id as string)
              .filter((id: string) => !id.includes('whisper') && !id.includes('guard') && !id.includes('safeguard'));
          }
        }
      } catch (err: any) {
        console.warn('Could not query Groq models endpoint directly:', err.message);
      }

      // Determine which model to test
      let targetModel = preferredModel || 'llama-3.1-8b-instant';
      if (availableModels.length > 0) {
        if (preferredModel && availableModels.includes(preferredModel)) {
          targetModel = preferredModel;
        } else if (availableModels.includes('llama-3.1-8b-instant')) {
          targetModel = 'llama-3.1-8b-instant';
        } else if (availableModels.includes('llama-3.3-70b-versatile')) {
          targetModel = 'llama-3.3-70b-versatile';
        } else {
          targetModel = availableModels[0];
        }
      } else {
        // Fallback default
        targetModel = 'llama-3.1-8b-instant';
      }

      // Step 2: Test completion with selected target model
      const response = await request('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${key}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: targetModel,
          messages: [{ role: 'user', content: 'Respond with "Groq verified"' }],
          max_tokens: 15,
        }),
      });

      if (response.statusCode === 200) {
        const body = (await response.body.json()) as any;
        const text = body.choices?.[0]?.message?.content || 'Verified';
        const modelNote = preferredModel && preferredModel !== targetModel
          ? ` (Auto-selected active model: ${targetModel})`
          : ` (${targetModel})`;

        return {
          success: true,
          message: `Successfully connected to Groq!${modelNote} Response: "${text.trim()}"`,
          activeModel: targetModel,
          availableModels,
        };
      } else {
        const errText = await response.body.text();
        return {
          success: false,
          message: `Groq error (HTTP ${response.statusCode}): ${errText}`,
          availableModels,
        };
      }
    } catch (err: any) {
      return { success: false, message: `Groq connection failed: ${err.message}` };
    }
  }

  /**
   * Test connection to OpenRouter API
   */
  public async testOpenRouter(apiKey: string, model: string = 'meta-llama/llama-3.3-70b-instruct'): Promise<{ success: boolean; message: string; activeModel?: string }> {
    try {
      if (!apiKey || apiKey.trim().length === 0) {
        return { success: false, message: 'OpenRouter API Key is empty.' };
      }

      const key = apiKey.trim();
      const candidates = [
        model,
        'meta-llama/llama-3.3-70b-instruct',
        'google/gemini-2.0-flash-001',
        'anthropic/claude-3.5-sonnet',
        'deepseek/deepseek-r1'
      ].filter(Boolean) as string[];

      const uniqueCandidates = Array.from(new Set(candidates));
      let lastError = '';

      for (const m of uniqueCandidates) {
        try {
          const response = await request('https://openrouter.ai/api/v1/chat/completions', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${key}`,
              'Content-Type': 'application/json',
              'HTTP-Referer': 'https://backlinkforge.app',
              'X-Title': 'BacklinkForge SEO OS',
            },
            body: JSON.stringify({
              model: m,
              messages: [{ role: 'user', content: 'Respond with "OpenRouter verified"' }],
              max_tokens: 15,
            }),
          });

          if (response.statusCode === 200) {
            const body = (await response.body.json()) as any;
            const text = body.choices?.[0]?.message?.content || 'Verified';
            return {
              success: true,
              message: `Successfully connected to OpenRouter (${m})! Response: "${text.trim()}"`,
              activeModel: m,
            };
          } else {
            const errorText = await response.body.text();
            lastError = `HTTP ${response.statusCode}: ${errorText}`;
            if (response.statusCode === 404 || errorText.includes('not found')) {
              continue;
            } else {
              return { success: false, message: `OpenRouter error (${response.statusCode}): ${errorText}` };
            }
          }
        } catch (inner: any) {
          lastError = inner.message;
        }
      }

      return { success: false, message: `OpenRouter connection failed: ${lastError}` };
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

    // Default to fast reliable model if unspecified
    const targetModel = model || (isGroq ? 'llama-3.1-8b-instant' : 'meta-llama/llama-3.3-70b-instruct');

    const response = await request(endpoint, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        model: targetModel,
        messages,
        temperature: options?.temperature ?? 0.7,
        max_tokens: options?.maxTokens ?? 1024,
      }),
    });

    if (response.statusCode !== 200) {
      const err = await response.body.text();
      // If 404 on Groq, fallback to llama-3.1-8b-instant
      if (isGroq && (response.statusCode === 404 || err.includes('model_not_found'))) {
        const fallbackRes = await request(endpoint, {
          method: 'POST',
          headers,
          body: JSON.stringify({
            model: 'llama-3.1-8b-instant',
            messages,
            temperature: options?.temperature ?? 0.7,
            max_tokens: options?.maxTokens ?? 1024,
          }),
        });
        if (fallbackRes.statusCode === 200) {
          const fallbackData = (await fallbackRes.body.json()) as any;
          return fallbackData.choices?.[0]?.message?.content || '';
        }
      }
      throw new Error(`${provider.toUpperCase()} API Error (${response.statusCode}): ${err}`);
    }

    const data = (await response.body.json()) as any;
    return data.choices?.[0]?.message?.content || '';
  }
}
