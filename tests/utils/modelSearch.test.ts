import { matchesModelQuery } from '../../src/utils/modelSearch';

const KNOWN = new Set(['hy3', 'deepseek-v4-flash', 'glm-5.3']);
const opt = (value: string, label: string) => ({ value, label });
const shown = (input: string) =>
  [opt('hy3', 'Hunyuan hy3'), opt('deepseek-v4-flash', 'DeepSeek V4 Flash'), opt('glm-5.3', 'GLM-5.3')]
    .filter((o) => matchesModelQuery(KNOWN, input, o))
    .map((o) => o.value);

describe('模型下拉的搜索判据', () => {
  // 回归：曾经写成逐条判（option.value === input），选好模型之后再点开下拉
  // 只剩自己那一条，而 antd 在唯一选项与输入完全相同时不弹下拉 —— 用户看到的是
  // 「这家只有一个模型」。判据要问的是【输入】是不是已知 SKU，然后放行全部。
  it('输入已是选中的 SKU → 显示【全部】备选，而不是只剩自己', () => {
    expect(shown('hy3')).toEqual(['hy3', 'deepseek-v4-flash', 'glm-5.3']);
  });

  it('空输入显示全部', () => {
    expect(shown('')).toHaveLength(3);
  });

  it('真正在打字时照常筛选，SKU 与友好名都能命中', () => {
    expect(shown('deep')).toEqual(['deepseek-v4-flash']); // 命中 SKU
    expect(shown('Hunyuan')).toEqual(['hy3']); // 命中友好名
    expect(shown('GLM')).toEqual(['glm-5.3']); // 大小写不敏感
  });

  it('手填一个不在清单里的 SKU：照常按子串筛，筛不到就空', () => {
    expect(shown('my-self-hosted')).toEqual([]);
  });
});
