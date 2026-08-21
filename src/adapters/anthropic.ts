import type { LLMAdapter, ChatParams, ModelOption } from '../types';
import { parseSSE } from './sse';
import { findProvider } from './providerCatalog.generated';
import { resolveThinkingWire } from './thinking';

const CATALOG =
  findProvider('claude') ??
  (() => {
    throw new Error("providerCatalog 里没有 claude —— 上游删了它，本适配器无从取模型清单");
  })();

/**
 * Anthropic 的【原生】接口（/v1/messages + SSE），不走 OpenAI 兼容层。
 *
 * 模型清单、链接、思考形态（含「按名判代」那条规则）都取自 provider 目录。
 * 本地只剩 budget_tokens 的数值与 max_tokens —— 理由写在 chat() 里：它们是
 * 绝对 token 数，天然耦合本 app 的输出上限，是目录里唯一不可移植的一处。
 */
// 按本 app 的 max_tokens（64K）定档，留出大半给可见回复。
// 官方硬约束：budget_tokens 必须【小于】max_tokens、至少 1024，且思考 token
// 计入 max_tokens。改这里前先看 chat() 里 maxTokens 那一行，两者是配套的。
const BUDGET = { low: 10_000, medium: 25_000, high: 50_000 } as const;

export class AnthropicAdapter implements LLMAdapter {
  id = 'claude';
  name = 'Anthropic';
  models: ModelOption[] = CATALOG.models.map((m) => ({ id: m.id, name: m.name }));
  docsUrl = CATALOG.docs;
  apiKeyUrl = CATALOG.apiKeyUrl;
  group = 'international';

  baseUrl = CATALOG.endpoints[0]!.baseUrl;

  /**
   * 地址可换 —— 与中转开关【正交】：这里决定打哪个地址，中转只决定走不走那一跳。
   * 自建的 Anthropic 兼容网关、公司内网的反代都靠它，而「谁会被上游按 origin 拦」
   * 本来就无法预判，逃生口逐个手发必然漏掉最需要它的人（上游的判例）。
   */
  withBaseUrl(baseUrl: string): AnthropicAdapter {
    if (baseUrl === this.baseUrl) return this;
    const next = new AnthropicAdapter();
    next.baseUrl = baseUrl;
    return next;
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

    const model = params.model || CATALOG.defaultModel || '';
    const level = params.thinkingLevel ?? 'off';

    // Claude 有两代思考协议：adaptive 世代发 thinking:{type:'adaptive'} +
    // output_config.effort，旧世代发 budget_tokens —— 两代混用会 400。
    //
    // 判代【不】在本地写：属于哪一代只能按模型名判（手填的 SKU 不在任何清单里），
    // 而官方明写 4.7 及以后【拒收】budget_tokens、用了直接 400。这条规则各处各写
    // 一份必然漂 —— 真漂过：某次精简把 4.7/4.8 从本地那份删掉，手填 opus-4-8 就
    // 会 400。现在连正则带形态一起由目录下发（thinkingWireIf）。
    //
    // ⚠ 只有 budget_tokens 的【数值】留在本地：它是绝对整数（官方要求 ≥1024 且
    // 必须小于 max_tokens，思考 token 计入 max_tokens），所以天然耦合调用方的输出
    // 上限。目录里那份是按上游自己的 max_tokens 反推的，照搬会把「高」档压到远低于
    // 本 app 的余量。其余思考参数都是枚举/布尔，都由目录给。
    // 判代按名字（正则由目录下发），但形态优先取【该 SKU 自己那份】—— 同代之内
    // 仍有差别：有的型号连「关闭」都不接受（关不掉，官方表标 Always on，发
    // disabled 直接 400），它们在目录里就没有 off 形态。正则那份只兜手填的 SKU。
    // adaptive 那半直接用目录的（纯枚举，可移植）；旧世代那半只借形状，数值用本地。
    // ⚠ 取【首个】匹配的规则，别改成 some()/合并：规则之间互相包含 —— 官方标
    // Always on 的那几支同属新世代，正则是新世代那条的子集，形态却差在关闭档
    // （连 disabled 都回 400，所以那条规则没有 off 键）。目录已按「窄的在前」排好。
    const effort = level === 'off' ? undefined : level;
    const rule = CATALOG.thinkingWireIf?.find((r) => new RegExp(r.pattern).test(model));
    const thinkingBody = rule
      ? resolveThinkingWire(CATALOG.models, rule.wire, model, level) ?? {}
      : effort
        ? { thinking: { type: 'enabled', budget_tokens: BUDGET[effort] } }
        : // 旧世代服务端默认就是关的，省略即可（目录的回退同样没有 off 键）。
          {};

    // 输出上限是【本 app 的事】，目录不管：budget_tokens 必须小于 max_tokens。
    // 一律 64K —— 这是当前全部在册型号都支持的输出上限（新一代到 128K，Haiku 4.5
    // 与 4.5 代整体是 64K）。不按 opus/其他分档：那种按名字猜上限的写法对手填的
    // 老 SKU 会猜高并 400，而这是个对话应用，回复长度离 64K 远得很，把上限拉到
    // 128K 一点用处也没有。max_tokens 是天花板不是目标，设高不额外花钱。
    const maxTokens = 64000;

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': params.apiKey,
        'anthropic-version': '2023-06-01',
        'anthropic-dangerous-direct-browser-access': 'true',
      },
      body: JSON.stringify({
        // 发【上面那个 model】，不是 params.model —— 判思考世代用的是套过兜底的
        // 值，body 里绕开兜底就等于两边看的不是同一个模型：模型名为空时会按兜底
        // SKU 选好 adaptive 形态，再把 model:"" 发出去。
        model,
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
      // Status is prefixed unconditionally: an origin/WAF block answers with an
      // HTML page, not JSON, so `detail` alone carries no code — and the UI needs
      // the number to tell a 403 (relay would fix it) from a plain failure.
      throw new Error(`[${response.status}] ${detail.replace(/平衡不足/g, '余额不足')}`);
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
