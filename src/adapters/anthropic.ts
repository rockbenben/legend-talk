import type { LLMAdapter, ChatParams } from '../types';
import { parseSSE } from './sse';

export class AnthropicAdapter implements LLMAdapter {
  id = 'anthropic';
  name = 'Anthropic';
  models = [
    { id: 'claude-opus-4-8', name: 'Claude Opus 4.8' },
    { id: 'claude-sonnet-5', name: 'Claude Sonnet 5' },
    { id: 'claude-haiku-4-5-20251001', name: 'Claude Haiku 4.5' },
    { id: 'claude-fable-5', name: 'Claude Fable 5' },
  ];
  docsUrl = 'https://platform.claude.com/docs/en/api/messages';
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
          // Pin the ping to Haiku: cheapest, and its server default is thinking-off —
          // adaptive-generation models may engage thinking on their own, which a
          // max_tokens:1 probe can't accommodate.
          model: 'claude-haiku-4-5-20251001',
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
    const level = params.thinkingLevel && params.thinkingLevel !== 'off'
      ? (params.thinkingLevel as 'low' | 'medium' | 'high')
      : undefined;
    // Two thinking generations (platform.claude.com/docs/en/build-with-claude/adaptive-thinking):
    // the adaptive generation (Opus 4.7/4.8, Sonnet 5, Fable 5, Mythos) takes
    // thinking:{type:'adaptive'} + output_config.effort and 400s on the legacy
    // budget_tokens shape; everything else (Haiku 4.5, Sonnet 4.6) keeps the
    // budget style. Substring regex so dated snapshot ids still match.
    const isAdaptive = /claude-(opus-4-[78]|sonnet-5|fable-5|mythos)/.test(model);
    // Output caps: Opus supports 128K output tokens; the rest cap at 64K.
    const maxTokens = level ? (model.includes('opus') ? 128000 : 64000) : 16384;
    const thinkingBody = isAdaptive
      ? level
        ? { thinking: { type: 'adaptive' }, output_config: { effort: level } }
        // Adaptive models can default thinking ON server-side (Sonnet 5 does) —
        // off must send an explicit disable, or every reply silently burns
        // reasoning tokens the stream never displays.
        : { thinking: { type: 'disabled' } }
      : level
        ? {
            thinking: {
              type: 'enabled',
              // budget_tokens must stay below the 64K max_tokens cap.
              budget_tokens: { low: 10000, medium: 25000, high: 50000 }[level] ?? 25000,
            },
          }
        : {};

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
        ...thinkingBody,
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
