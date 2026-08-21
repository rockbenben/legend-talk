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
 * 这家有没有「关闭思考」这一档。
 *
 * ⚠ false 的意思是【厂商没有关闭值】：选最低档时发的是它自己的最低档，模型
 * 仍在推理、仍在计费。当前这样的有 gemini / grok / groq / cerebras 与 moonshot
 * 的部分 SKU —— 它们的关闭态实际发的是 `reasoning_effort:"low"` 或
 * `thinkingConfig.thinkingLevel:"low"`。界面因此不能把最低档写成「关闭」：
 * 用户以为省下了推理的钱，账单上并没有。
 *
 * 判据由目录下发，不在这里列名单；目录里没有的本地条目（Coding Plan）按
 * 「能关」处理 —— 它们的形态里确实带着真正的关闭值。
 */
export function canDisableThinking(providerId: string | undefined): boolean {
  return providerId ? findProvider(providerId)?.canDisableThinking !== false : true;
}
