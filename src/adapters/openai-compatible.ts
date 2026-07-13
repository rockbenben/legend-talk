import type { LLMAdapter, ModelOption, ChatParams, ThinkingLevel } from '../types';
import { parseSSE } from './sse';

// level === undefined means thinking is off. A mapper returning undefined for the
// off state omits thinking params entirely (server default kept); returning a body
// sends an explicit disable — required for providers whose server default is
// thinking ON, where omission silently burns reasoning tokens the stream never shows.
type ThinkingMapper = (level: ThinkingLevel | undefined) => Record<string, unknown> | undefined;

const THINKING_MAPPERS: Record<string, ThinkingMapper> = {
  // Graded reasoning_effort, omit when off — shared by heterogeneous providers,
  // some of which reject an explicit "none".
  reasoning_effort: (level) => (level ? { reasoning_effort: level } : undefined),
  // OpenAI GPT-5.x: reasoning is server-default ON (medium) — off sends explicit "none".
  reasoning_effort_none: (level) => ({ reasoning_effort: level ?? 'none' }),
  // xAI: only low/high tiers exist (medium 400s), off sends explicit "none".
  reasoning_effort_low_high: (level) => ({ reasoning_effort: level ? (level === 'high' ? 'high' : 'low') : 'none' }),
  // OpenRouter: graded effort when on; universal reasoning:{enabled:false} when off.
  reasoning_effort_openrouter: (level) => (level ? { reasoning_effort: level } : { reasoning: { enabled: false } }),
  enable_thinking: (level) => (level ? { enable_thinking: true } : undefined),
  // Binary thinking:{type} — server-default ON lineups (DeepSeek V4, GLM-5.x,
  // Kimi K2.6, MiMo), so off sends explicit disabled.
  thinking_type: (level) => ({ thinking: { type: level ? 'enabled' : 'disabled' } }),
  // MiniMax M3: thinking:{type:"adaptive"|"disabled"} only, server default adaptive (ON).
  thinking_adaptive: (level) => ({ thinking: { type: level ? 'adaptive' : 'disabled' } }),
};

export class OpenAICompatibleAdapter implements LLMAdapter {
  docsUrl?: string;
  apiKeyUrl?: string;
  group?: string;
  private thinkingMapper?: ThinkingMapper;

  constructor(
    public id: string,
    public name: string,
    public baseUrl: string,
    public models: ModelOption[],
    opts?: { docsUrl?: string; apiKeyUrl?: string; thinkingStyle?: string; group?: string },
  ) {
    this.docsUrl = opts?.docsUrl;
    this.apiKeyUrl = opts?.apiKeyUrl;
    this.group = opts?.group;
    if (opts?.thinkingStyle) this.thinkingMapper = THINKING_MAPPERS[opts.thinkingStyle];
  }

  async validateKey(key: string, corsProxy?: string): Promise<boolean> {
    try {
      const url = this.buildUrl('/models', corsProxy);
      const res = await fetch(url, {
        headers: { Authorization: `Bearer ${key}` },
      });
      return res.ok;
    } catch {
      return false;
    }
  }

  async *chat(params: ChatParams): AsyncGenerator<string> {
    const url = this.buildUrl('/chat/completions', params.corsProxy);
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (params.apiKey) headers['Authorization'] = `Bearer ${params.apiKey}`;

    const body: Record<string, unknown> = {
      messages: params.messages,
      stream: true,
    };
    if (params.model) body.model = params.model;
    if (this.thinkingMapper) {
      const modelOpt = this.models.find((m) => m.id === params.model);
      const level = params.thinkingLevel && params.thinkingLevel !== 'off' ? params.thinkingLevel : undefined;
      if (level) {
        // On: listed non-thinking models opt out; unlisted (custom) models are the
        // user's call — they explicitly picked a thinking level.
        if (modelOpt?.thinking !== false) Object.assign(body, this.thinkingMapper(level) ?? {});
      } else if (modelOpt && modelOpt.thinking !== false) {
        // Off: only listed thinking-capable models get an explicit disable —
        // sending one to an unknown SKU risks a 400 on models without the param.
        Object.assign(body, this.thinkingMapper(undefined) ?? {});
      }
    }

    const response = await fetch(url, {
      method: 'POST',
      headers,
      body: JSON.stringify(body),
      signal: params.signal,
    });

    if (!response.ok) {
      let detail = response.statusText;
      try {
        const errBody = await response.json();
        detail = errBody.error?.message || JSON.stringify(errBody);
      } catch { /* ignore */ }
      // Some providers mistranslate "insufficient balance" as "平衡不足" (equilibrium) instead of "余额不足" (account balance).
      throw new Error(detail.replace(/平衡不足/g, '余额不足'));
    }

    for await (const data of parseSSE(response)) {
      try {
        const parsed = JSON.parse(data);
        const content = parsed.choices?.[0]?.delta?.content;
        if (content) yield content;
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
