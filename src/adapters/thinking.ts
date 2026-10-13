import type { ModelOption, ThinkingLevel, ThinkingWire } from '../types';
import { findProvider } from './providerCatalog.generated';

/**
 * 这一档该往请求体里合并的字段。三个适配器（OpenAI 兼容 / Anthropic / Gemini）
 * 共用同一条查法，形态本身逐 SKU 由 provider 目录给。
 *
 * 三路，与上游的门控一致：
 *   · 清单内且有形态 → 用它自己的（同一家可以逐 SKU 不同：Kimi K3 收顶层
 *     reasoning_effort，K2.x 收 thinking:{type}；Claude 的 adaptive 世代用
 *     output_config，旧世代用 budget_tokens）
 *   · 清单内但没有形态 → 一个字段都不发（已知不思考，或这家没有已知形态）
 *   · 不在清单里（用户手填）→ 退到 provider 级形态；provider 也没有就不发
 *
 * 返回 undefined 与返回 {} 等价，调用方一律 `...(x ?? {})` 展开。
 */
export function resolveThinkingWire(
  models: readonly ModelOption[],
  fallback: ThinkingWire | undefined,
  model: string,
  level: ThinkingLevel,
): Record<string, unknown> | undefined {
  const listed = models.find((m) => m.id === model);
  const wire = listed ? listed.thinkingWire : fallback;
  return wire?.[level];
}

/**
 * 「关」档实际要发出去的那份字段，算不算【真的不思考】。
 *
 * 只认叶子值：false / 0 / none / disabled / off 是真关闭（qwen 的
 * `enable_thinking:false`、openai 的 `reasoning_effort:"none"`、claude 的
 * `thinking:{type:"disabled"}` 都落在这一侧）；而 `{"reasoning_effort":"low"}`、
 * `thinking:{type:"between_tools"}`、`{thinking:{type:"enabled"},…}` 那些是
 * 「发的是最低档、模型还在推理」，账单上并没有省下来。
 *
 * undefined（这家这个 SKU 根本没有关闭形态）算【不算】—— 什么都不发既可能是
 * 「服务端默认就关」，也可能是「关不掉」，目录当前不区分这两种，从严按还在想处理：
 * 少说一句「更快更省」不伤人，说了而账单照跑才是真坑。
 */
function isRealOff(wire: Record<string, unknown> | undefined): boolean {
  if (!wire) return false;
  const leaves = (v: unknown): unknown[] => (v !== null && typeof v === "object" ? Object.values(v).flatMap(leaves) : [v]);
  const vs = leaves(wire);
  return vs.length > 0 && vs.every((v) => v === false || v === 0 || (typeof v === "string" && ["none", "disabled", "off"].includes(v.toLowerCase())));
}

/**
 * 这家【这个型号】有没有「关闭思考」这一档。
 *
 * ⚠ false 的意思是【厂商没有关闭值】：选最低档时发的是它自己的最低档，模型
 * 仍在推理、仍在计费。界面因此不能把最低档写成「关闭」：用户以为省下了推理的
 * 钱，账单上并没有。
 *
 * 判据是【关闭态实际发出去的那个值】—— 与 resolveThinkingWire（也就是 chat()
 * 真正合并进请求体的那一份）同一条查法，所以标签与线格式由构造保证不叉开。
 *
 * ⚠ 必须逐 SKU 判，provider 级那个布尔不够用：同一家里可以两种能力都有 ——
 * openai / azureopenai 的 gpt-6-luna 与 gpt-5.4-mini 收 `none`（真关），
 * gpt-6-astra 与 gpt-6.1-sol 官方明写不收 none/minimal（只能发最低档）；反过来
 * claude 的 provider 级是 true，而 opus-5-5 / fable-5-1 是 always-on、根本没有
 * 关闭档。拿一个布尔说话，两个方向都会说错。
 * 不给 model 时（调用方只知道服务商）退回 provider 级判据。
 */
export function canDisableThinking(providerId: string | undefined, model?: string): boolean {
  const p = providerId ? findProvider(providerId) : undefined;
  if (!p) return true; // 目录里没有的本地条目按「能关」处理 —— 它们的形态里确实带着真正的关闭值
  if (model) {
    const sku = p.models.find((m) => m.id === model);
    if (sku) {
      if (!sku.thinkingWire) return true; // 压根不发思考参数，控件本来就不显示，无所谓关不关
      return isRealOff(sku.thinkingWire.off);
    }
  }
  return p.canDisableThinking !== false;
}
