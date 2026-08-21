import type { LLMAdapter, ModelOption, ChatParams, ThinkingWire, EndpointOption } from '../types';
import { parseSSE } from './sse';

interface AdapterOpts {
  docsUrl?: string;
  apiKeyUrl?: string;
  group?: string;
  endpoints?: EndpointOption[];
  /**
   * 用户手填的、不在 models 清单里的 SKU 该发的思考参数。清单内的 SKU 一律用
   * 它自己的 thinkingWire —— 同一家的形态可以逐 SKU 不同，拿这个套上去会 4xx。
   */
  fallbackThinkingWire?: ThinkingWire;
}

export class OpenAICompatibleAdapter implements LLMAdapter {
  docsUrl?: string;
  apiKeyUrl?: string;
  group?: string;
  endpoints?: EndpointOption[];
  private fallbackThinkingWire?: ThinkingWire;
  private opts?: AdapterOpts;

  constructor(
    public id: string,
    public name: string,
    public baseUrl: string,
    public models: ModelOption[],
    opts?: AdapterOpts,
  ) {
    this.opts = opts;
    this.docsUrl = opts?.docsUrl;
    this.apiKeyUrl = opts?.apiKeyUrl;
    this.group = opts?.group;
    this.endpoints = opts?.endpoints;
    this.fallbackThinkingWire = opts?.fallbackThinkingWire;
  }

  /**
   * 这个 SKU 有没有已知的思考形态 —— 判据与 chat() 里选形态那两行【同一条】，
   * 所以界面显示控件 ⇔ 请求真会带思考参数，不会出现一个点了没反应的开关。
   * 没有形态时（已知不思考，或这家没有已知形态）返回 false。
   */
  supportsThinking(model: string): boolean {
    const modelOpt = this.models.find((m) => m.id === model);
    return Boolean(modelOpt ? modelOpt.thinkingWire : this.fallbackThinkingWire);
  }

  /** Same provider on a different host — a regional endpoint the user picked,
   *  or a gateway they pasted. Models, thinking shape and links are provider
   *  identity and must survive the swap; only the host changes. */
  withBaseUrl(baseUrl: string): OpenAICompatibleAdapter {
    return baseUrl === this.baseUrl
      ? this
      : new OpenAICompatibleAdapter(this.id, this.name, baseUrl, this.models, this.opts);
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
    // 思考参数：逐 SKU 查表，没有条目就一个字段都不发。
    // 清单内的 SKU 用它自己的形态；用户手填的未列出 SKU 能力未知，退到本
    // provider 的通用形态（fallbackThinkingWire）—— 与 web-tools 的三路门控一致。
    const modelOpt = this.models.find((m) => m.id === params.model);
    const wire = modelOpt ? modelOpt.thinkingWire : this.fallbackThinkingWire;
    const slot = wire?.[params.thinkingLevel ?? 'off'];
    if (slot) Object.assign(body, slot);

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
      // Status is prefixed unconditionally: an origin/WAF block answers with an
      // HTML page, not JSON, so `detail` alone carries no code — and the UI needs
      // the number to tell a 403 (relay would fix it) from a plain failure.
      throw new Error(`[${response.status}] ${detail.replace(/平衡不足/g, '余额不足')}`);
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
