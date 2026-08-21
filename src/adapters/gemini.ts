import type { LLMAdapter, ChatParams, ModelOption } from '../types';
import { parseSSE } from './sse';
import { findProvider } from './providerCatalog.generated';
import { resolveThinkingWire } from './thinking';

const CATALOG =
  findProvider('gemini') ??
  (() => {
    throw new Error("providerCatalog 里没有 gemini —— 上游删了它，本适配器无从取模型清单");
  })();

/**
 * Gemini 的【原生】接口（:streamGenerateContent），不是官方的 OpenAI 兼容层。
 *
 * 兼容层能跑，但它是 Google 为迁移方便提供的薄封装，思考参数、systemInstruction、
 * 多 text part 这些都要按 OpenAI 的形状再翻译一次 —— 上游一改我们就得跟着猜。
 * 走原生接口则与上游（web-tools）说同一套协议，形态可以直接对齐。
 *
 * 认证走 x-goog-api-key 头：官方 api-key 文档已经撤掉 ?key= 查询参数（2026-06），
 * 而且不把 key 塞进 URL 也省得它进日志和 Referer。
 */
export class GeminiAdapter implements LLMAdapter {
  id = 'gemini';
  name = 'Google Gemini';
  models: ModelOption[] = CATALOG.models.map((m) => ({ id: m.id, name: m.name, ...(m.thinkingWire ? { thinkingWire: m.thinkingWire } : {}) }));
  docsUrl = CATALOG.docs;
  apiKeyUrl = CATALOG.apiKeyUrl;
  group = 'international';

  baseUrl = CATALOG.endpoints[0]!.baseUrl;

  /**
   * 地址可换 —— 与中转开关【正交】：这里决定打哪个地址，中转只决定走不走那一跳。
   * 自建网关、公司内网的反代都靠它，而「谁会被上游按 origin 拦」
   * 本来就无法预判，逃生口逐个手发必然漏掉最需要它的人（上游的判例）。
   */
  withBaseUrl(baseUrl: string): GeminiAdapter {
    if (baseUrl === this.baseUrl) return this;
    const next = new GeminiAdapter();
    next.baseUrl = baseUrl;
    return next;
  }

  /** 与 chat() 里取形态那行同一条判据 —— 界面显示控件 ⇔ 请求真会带思考参数。 */
  supportsThinking(model: string): boolean {
    const listed = this.models.find((m) => m.id === model);
    return Boolean(listed ? listed.thinkingWire : CATALOG.thinkingWire);
  }

  async *chat(params: ChatParams): AsyncGenerator<string> {
    if (!params.apiKey) throw new Error('Missing API key');
    const model = params.model || CATALOG.defaultModel || '';

    // system 单独走 systemInstruction；其余按 user/model 交替。
    // ⚠ 空 text 会被 Gemini 400，所以没有 system 时整个字段省略。
    let system: string | undefined;
    const rest = params.messages.filter((m) => {
      if (m.role === 'system') {
        system = m.content;
        return false;
      }
      return true;
    });

    const url = this.buildUrl(`/v1beta/models/${model}:streamGenerateContent?alt=sse`, params.corsProxy);

    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-goog-api-key': params.apiKey },
      body: JSON.stringify({
        ...(system ? { systemInstruction: { parts: [{ text: system }] } } : {}),
        contents: rest.map((m) => ({
          role: m.role === 'assistant' ? 'model' : 'user',
          parts: [{ text: m.content }],
        })),
        // 不发 temperature：Gemini 3.x 官方建议用默认值（调低有回环/降智风险）。
        // 思考档位逐 SKU 由目录给，形态本身就带 generationConfig 这一层。
        // 关闭态发的是该 SKU 的最低档而不是省略 —— Gemini 3 没有关闭开关，
        // 省略会落到服务端默认档位，用户点了「关」反而按中档计费。
        ...(resolveThinkingWire(this.models, CATALOG.thinkingWire, model, params.thinkingLevel ?? 'off') ?? {}),
      }),
      signal: params.signal,
    });

    if (!response.ok) {
      let detail = response.statusText;
      try {
        const body = await response.json();
        detail = body.error?.message || JSON.stringify(body);
      } catch { /* ignore */ }
      throw new Error(`[${response.status}] ${detail}`);
    }

    for await (const data of parseSSE(response)) {
      try {
        const parsed = JSON.parse(data);
        // ⚠ 拼接【全部】text part，不是取 parts[0]：官方允许把一条回复拆成多个
        // 连续 text part，只取第一个 = 长输出被静默截断。
        // thought:true 的 part 是思考摘要，不进正文。
        const parts: Array<{ text?: string; thought?: boolean }> = parsed.candidates?.[0]?.content?.parts ?? [];
        const delta = parts.filter((p) => !p.thought).map((p) => p.text ?? '').join('');
        if (delta) yield delta;
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
