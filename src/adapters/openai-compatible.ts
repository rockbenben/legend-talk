import type { LLMAdapter, ModelOption, ChatParams, ThinkingLevel } from '../types';
import { parseSSE } from './sse';

type ThinkingMapper = (level: ThinkingLevel) => Record<string, unknown>;

const THINKING_MAPPERS: Record<string, ThinkingMapper> = {
  reasoning_effort: (level) => ({ reasoning_effort: level }),
  enable_thinking: () => ({ enable_thinking: true }),
};

export class OpenAICompatibleAdapter implements LLMAdapter {
  docsUrl?: string;
  apiKeyUrl?: string;
  private thinkingMapper?: ThinkingMapper;

  constructor(
    public id: string,
    public name: string,
    public baseUrl: string,
    public models: ModelOption[],
    opts?: { docsUrl?: string; apiKeyUrl?: string; thinkingStyle?: string },
  ) {
    this.docsUrl = opts?.docsUrl;
    this.apiKeyUrl = opts?.apiKeyUrl;
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
    if (params.thinkingLevel && this.thinkingMapper) {
      Object.assign(body, this.thinkingMapper(params.thinkingLevel));
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
        const body = await response.json();
        detail = body.error?.message || JSON.stringify(body);
      } catch { /* ignore */ }
      throw new Error(detail);
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
