import type { LLMAdapter, ChatParams } from '../types';
import { parseSSE } from './sse';

export class AnthropicAdapter implements LLMAdapter {
  id = 'anthropic';
  name = 'Anthropic';
  models = [
    { id: 'claude-opus-4-7', name: 'Claude Opus 4.7' },
    { id: 'claude-sonnet-4-6', name: 'Claude Sonnet 4.6' },
    { id: 'claude-haiku-4-5-20251001', name: 'Claude Haiku 4.5' },
  ];
  docsUrl = 'https://docs.anthropic.com/en/api/messages';
  apiKeyUrl = 'https://console.anthropic.com/settings/keys';
  group = 'international';

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
    if (!params.apiKey) throw new Error('Missing API key');
    const url = this.buildUrl('/messages', params.corsProxy);

    let system: string | undefined;
    const messages = params.messages.filter((m) => {
      if (m.role === 'system') {
        system = m.content;
        return false;
      }
      return true;
    });

    const model = params.model || '';
    // Output caps: Opus 4.6+ supports 128K output tokens; Sonnet 4.6 / Haiku 4.5 cap at 64K.
    const maxTokens = params.thinkingLevel ? (model.includes('opus') ? 128000 : 64000) : 16384;
    // Opus 4.7+ removed `thinking: enabled` (400) and Sonnet 4.6 deprecated it —
    // both use adaptive thinking + effort. Haiku 4.5 still uses the budget style
    // (budget must stay below its 64K max_tokens).
    const isHaiku = model.includes('haiku');
    const level = params.thinkingLevel as 'low' | 'medium' | 'high';

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
        max_tokens: maxTokens,
        stream: true,
        ...(system && { system }),
        ...(params.thinkingLevel && (isHaiku
          ? {
              thinking: {
                type: 'enabled',
                budget_tokens: { low: 10000, medium: 25000, high: 50000 }[level] ?? 25000,
              },
            }
          : {
              thinking: { type: 'adaptive' },
              ...(['low', 'medium', 'high'].includes(level) && { output_config: { effort: level } }),
            })),
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
      // Some providers mistranslate "insufficient balance" as "平衡不足" (equilibrium) instead of "余额不足" (account balance).
      throw new Error(detail.replace(/平衡不足/g, '余额不足'));
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
