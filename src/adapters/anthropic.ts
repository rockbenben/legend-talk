import type { LLMAdapter, ChatParams } from '../types';
import { parseSSE } from './sse';

export class AnthropicAdapter implements LLMAdapter {
  id = 'anthropic';
  name = 'Anthropic';
  models = [
    { id: 'claude-opus-4-6', name: 'Claude Opus 4.6' },
    { id: 'claude-sonnet-4-6', name: 'Claude Sonnet 4.6' },
    { id: 'claude-haiku-4-5', name: 'Claude Haiku 4.5' },
  ];
  docsUrl = 'https://docs.anthropic.com/en/api/messages';
  apiKeyUrl = 'https://console.anthropic.com/settings/keys';

  private baseUrl = 'https://api.anthropic.com/v1';

  async validateKey(key: string, corsProxy?: string): Promise<boolean> {
    try {
      const url = this.buildUrl('/messages', corsProxy);
      const res = await fetch(url, {
        method: 'POST',
        headers: {
          'x-api-key': key,
          'anthropic-version': '2023-06-01',
          'Content-Type': 'application/json',
          'anthropic-dangerous-direct-browser-access': 'true',
        },
        body: JSON.stringify({
          model: this.models[0].id,
          max_tokens: 1,
          messages: [{ role: 'user', content: 'hi' }],
        }),
      });
      return res.ok;
    } catch {
      return false;
    }
  }

  async *chat(params: ChatParams): AsyncGenerator<string> {
    const url = this.buildUrl('/messages', params.corsProxy);

    let system: string | undefined;
    const messages = params.messages.filter((m) => {
      if (m.role === 'system') {
        system = m.content;
        return false;
      }
      return true;
    });

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': params.apiKey,
        'anthropic-version': '2023-06-01',
        'anthropic-dangerous-direct-browser-access': 'true',
      },
      body: JSON.stringify({
        model: params.model,
        max_tokens: params.thinkingLevel ? 128000 : 16384,
        stream: true,
        ...(system && { system }),
        ...(params.thinkingLevel && {
          thinking: {
            type: 'enabled',
            budget_tokens: { low: 10000, medium: 50000, high: 100000 }[params.thinkingLevel as 'low' | 'medium' | 'high'],
          },
        }),
        messages,
      }),
      signal: params.signal,
    });

    if (!response.ok) {
      let detail = response.statusText;
      try {
        const body = await response.json();
        detail = body.error?.message || JSON.stringify(body);
      } catch { /* ignore */ }
      throw new Error(detail);
    }

    for await (const data of parseSSE(response)) {
      try {
        const parsed = JSON.parse(data);
        if (parsed.type === 'content_block_delta' && parsed.delta?.text) {
          yield parsed.delta.text;
        }
      } catch {
        // skip malformed JSON
      }
    }
  }

  private buildUrl(path: string, corsProxy?: string): string {
    const fullUrl = `${this.baseUrl}${path}`;
    return corsProxy ? `${corsProxy}/${fullUrl}` : fullUrl;
  }
}
