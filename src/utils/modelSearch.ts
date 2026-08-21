/**
 * 模型下拉的搜索判据 —— 匹配友好名(label)或 SKU(value)。
 *
 * ⚠ 「输入恰好是某个已知 SKU 时显示全部」这一条问的是【输入】，不是【当前这个
 * 选项】。写成逐条判（`option.value === input`）时只有自己那一条通过，而 antd
 * 在唯一选项与输入完全相同时不弹下拉 —— 表现为选好模型之后再点开【什么都不
 * 出来】，一个有 9 个型号的服务商看起来只有一个。这正是它要防的事。
 *
 * 语义：输入是一个已选中的 SKU ⇒ 用户在浏览备选，不是在筛选。
 */
export function matchesModelQuery(knownIds: ReadonlySet<string>, input: string, option: { value?: unknown; label?: unknown }): boolean {
  if (!input) return true;
  if (knownIds.has(input)) return true;
  const q = input.toLowerCase();
  return String(option.value ?? '').toLowerCase().includes(q) || String(option.label ?? '').toLowerCase().includes(q);
}
