import { getAdapter, getAllAdapters, PROVIDER_ID_MIGRATIONS, PROXY_BY_DEFAULT } from '../../src/adapters/registry';
import { PROVIDER_CATALOG } from '../../src/adapters/providerCatalog.generated';
import { OpenAICompatibleAdapter } from '../../src/adapters/openai-compatible';
import { canDisableThinking, clampThinkingLevel, isBinaryThinkingModel, selectableThinkingLevels, thinkingSelectValue } from '../../src/adapters/thinking';

describe('PROVIDER_ID_MIGRATIONS', () => {
  it('每个 target 都是现存的 adapter id，每个 key 都已不存在', () => {
    const live = new Set(getAllAdapters().map((a) => a.id));
    for (const [from, to] of Object.entries(PROVIDER_ID_MIGRATIONS)) {
      expect(live.has(to), `${from}→${to}：目标 provider 不存在`).toBe(true);
      expect(live.has(from), `${from} 仍是现存 provider，不该出现在改名表里`).toBe(false);
    }
  });
});

describe('PROXY_BY_DEFAULT', () => {
  // 目录里标了 directBlocked 的 provider，浏览器直连当前就是不通的。收录了却
  // 不默认开代理，用户第一次用它就是「怎么发都失败、界面说不清原因」——
  // 加 opencode 时正好踩过。
  it('收录了的 directBlocked provider 一律默认走代理', () => {
    const missing = PROVIDER_CATALOG.filter(
      (p) => p.directBlocked && getAdapter(p.key) && !PROXY_BY_DEFAULT[p.key],
    ).map((p) => p.key);
    expect(missing, `这些 provider 直连已坏但没默认开代理：${missing.join(', ')}`).toEqual([]);
  });

  it('表里的每一项都真的是现存 provider', () => {
    for (const key of Object.keys(PROXY_BY_DEFAULT)) {
      expect(getAdapter(key), `${key} 不是现存 provider`).toBeDefined();
    }
  });
});

describe('adapter registry', () => {
  it('returns all registered adapters', () => {
    const adapters = getAllAdapters();
    const ids = adapters.map((a) => a.id);
    expect(ids).toContain('openai');
    expect(ids).toContain('claude');
    expect(ids).toContain('deepseek');
    expect(ids).toContain('volcengine');
    expect(ids).toContain('alibaba');
    expect(ids).toContain('siliconflow');
    expect(ids).toContain('groq');
    expect(ids).toContain('openrouter');
    expect(ids).toContain('llm');
    // Core providers above must all be present; the registry grows over time
    // as new providers are added, so we only guard against accidental removal.
    expect(adapters.length).toBeGreaterThanOrEqual(9);
  });

  it('gets adapter by id', () => {
    const adapter = getAdapter('openai');
    expect(adapter).toBeDefined();
    expect(adapter!.id).toBe('openai');
    expect(adapter!.models.length).toBeGreaterThan(0);
  });

  // hidden 只是【默认选择器过滤】：条目照样注册、照样能解析 —— 已选中它的存档、
  // 导入的设置、按 id 显式获取都必须工作。UI 自己负责在列选项时过滤。
  it('两个 Coding Plan 标了 hidden，其余条目不标；hidden 不影响解析', () => {
    for (const id of ['volcengine', 'alibaba']) {
      const adapter = getAdapter(id);
      expect(adapter, `${id} 必须存在`).toBeDefined();
      expect(adapter!.hidden, `${id} 应默认隐藏`).toBe(true);
    }
    const hiddenOthers = getAllAdapters().filter((a) => a.hidden && a.id !== 'volcengine' && a.id !== 'alibaba');
    expect(hiddenOthers.map((a) => a.id)).toEqual([]);
  });

  it('returns undefined for unknown id', () => {
    expect(getAdapter('nonexistent')).toBeUndefined();
  });

  it('每个 adapter 都有模型清单，除了模型由用户那侧决定的两个', () => {
    // llm（自定义端点）与 litellm（自建网关）能跑哪些模型取决于用户自己接了
    // 什么，任何预置清单都是猜的 —— 空清单是正确状态，不是漏填。
    const userSupplied = new Set(['llm', 'litellm']);
    for (const adapter of getAllAdapters()) {
      if (userSupplied.has(adapter.id)) {
        expect(adapter.models.length, `${adapter.id} 的清单应为空`).toBe(0);
        continue;
      }
      expect(adapter.models.length, adapter.id).toBeGreaterThan(0);
    }
  });
});

describe('思考控件的两条界面不变量', () => {
  // ③ 下拉只能给该型号真有的档 —— 摆一个它不收的档，线上会被钳到更低的一档，
  //    界面上写着「中」而实际跑的是 low（显示 != 线上）。
  it('档位按型号收窄，显示值 = 钳到该型号真有的那一档', () => {
    let narrowed = 0;
    for (const p of PROVIDER_CATALOG) {
      for (const m of p.models) {
        const levels = selectableThinkingLevels(p.key, m.id);
        expect(levels.length, `${p.key}/${m.id}`).toBeGreaterThan(0);
        const table = m.effortLevels ?? m.thinkingLevels;
        if (table?.length) {
          narrowed++;
          expect(levels, `${p.key}/${m.id}`).toEqual(['low', 'medium', 'high'].filter((l) => table.includes(l)));
        }
        for (const want of ['low', 'medium', 'high'] as const) {
          expect(levels, `${p.key}/${m.id} @${want} 钳完仍要在表内`).toContain(clampThinkingLevel(p.key, m.id, want));
        }
      }
    }
    expect(narrowed, '目录里一个声明了档位表的型号都没有 —— 这条在空转').toBeGreaterThan(0);
    // 具体一支：Kimi K3 官方只收 low/high ⇒ 存的 medium 落到 low，线上也发 low
    expect(selectableThinkingLevels('moonshot', 'kimi-k3')).toEqual(['low', 'high']);
    expect(clampThinkingLevel('moonshot', 'kimi-k3', 'medium')).toBe('low');
    // 二元型号（线上三档同 body）下拉必须只剩一个「开」—— 摆低/中/高是骗人：
    // 拨哪个跑的都是同一份，拨「低」以为省了 token 其实没省。
    for (const p of PROVIDER_CATALOG) {
      for (const m of p.models) {
        const wire = m.thinkingWire as Record<string, unknown> | undefined;
        if (!wire) continue;
        const slots = ['low', 'medium', 'high'].map((l) => JSON.stringify(wire[l] ?? null));
        const bin = slots[0] === slots[1] && slots[1] === slots[2];
        expect(isBinaryThinkingModel(p.key, m.id), `${p.key}/${m.id} 二元判定`).toBe(bin);
        if (bin) expect(thinkingSelectValue(p.key, m.id, 'medium'), `${p.key}/${m.id} 二元应显示 on`).toBe('on');
      }
    }
  });

  // ① 显示控件 ⇔ 请求真会带思考参数。否则是个点了没反应的开关，比没有更糟。
  it('supportsThinking 与 chat() 里选形态的判据一致', () => {
    // chat() 的三路门控：清单内看它自己那份形态，清单外退 provider 级。
    // 这条按同一条规则复述一遍 —— 实现改成"只看 provider 级"之类，这里会红。
    let listedWithout = 0;
    for (const a of getAllAdapters()) {
      if (!(a instanceof OpenAICompatibleAdapter)) continue;
      for (const m of a.models) {
        expect(a.supportsThinking(m.id), `${a.id}/${m.id}`).toBe(Boolean(m.thinkingWire));
        if (!m.thinkingWire) listedWithout++;
      }
    }
    // 非空断言：确实存在"在册但没有形态"的 SKU，否则上面那条恒真、守不住任何东西
    expect(listedWithout, '没有任何在册 SKU 缺形态 —— 上面那条是恒真的').toBeGreaterThan(0);
  });

  // ② 界面不能把「其实关不掉」写成「关闭」。这几家选最低档时发的仍是推理值，
  //    用户以为省下了推理的钱，账单上并没有 —— 那是界面在撒谎。
  it('目录标了关不掉的，其关闭档确实仍在思考', () => {
    const noOff = PROVIDER_CATALOG.filter((p) => !p.canDisableThinking);
    expect(noOff.length, '目录里一个都没有，这条测试在空转').toBeGreaterThan(0);
    for (const p of noOff) {
      expect(canDisableThinking(p.key), `${p.key} 应被判为不能关闭`).toBe(false);
      const stillThinks = p.models.some((m) => {
        const off = m.thinkingWire?.off;
        if (!off) return false;
        const j = JSON.stringify(off);
        return !j.includes('"disabled"') && !j.includes('"none"');
      });
      expect(stillThinks, `${p.key} 被标成关不掉，但没有任何 SKU 的关闭档在思考 —— 标记或形态有一个是错的`).toBe(true);
    }
  });

  it('能关闭的照旧为 true（含目录下发的 Coding Plan），未知 id 按能关处理', () => {
    expect(canDisableThinking('deepseek')).toBe(true);
    expect(canDisableThinking('volcengine')).toBe(true); // Coding Plan，目录 canDisableThinking:true
    expect(canDisableThinking(undefined)).toBe(true);
    // ⚠ alibaba 的 provider 级现在是 false：这一家有了【关不掉】的 SKU ——
    //   glm-5.3 是官方「仅思考模式」（传入 enable_thinking=false 不会生效），
    //   关闭态只能发官方最低档 reasoning_effort。provider 级那个布尔答的是
    //   「这一家有没有关不掉的型号」，逐 SKU 判才准（见上面那条用例）。
    expect(canDisableThinking('alibaba')).toBe(false);
  });

  // ③ 逐 SKU 判据。测试【自己独立算一遍】关闭档那个值算不算真关闭，不复用
  //    canDisableThinking 的实现 —— 否则实现改口时这条会跟着改，就成了恒真证人。
  const realOffValue = (off: Record<string, unknown> | undefined): boolean => {
    if (!off) return false;
    const leaves = (v: unknown): unknown[] => (v !== null && typeof v === 'object' ? Object.values(v).flatMap(leaves) : [v]);
    const vs = leaves(off);
    return vs.length > 0 && vs.every((v) => v === false || v === 0 || (typeof v === 'string' && ['none', 'disabled', 'off'].includes(v.toLowerCase())));
  };

  it('逐 SKU：关闭档发的是真关闭值才算关得掉，发最低档 / 根本没有关闭档都不算', () => {
    let checked = 0;
    let vacuous = 0;
    for (const p of PROVIDER_CATALOG) {
      for (const m of p.models) {
        if (!m.thinkingWire) {
          // 压根不发思考参数的 SKU：这一档无所谓关不关，但界面也不该因此显示控件 ——
          // 两件事必须同时成立，否则「按能关处理」就成了没人看见的分支。
          // 只对本 app 收了的那几家成立（没收的 provider 没有 adapter，谈不上控件）。
          const adapter = getAdapter(p.key);
          if (!adapter) continue;
          vacuous++;
          expect(canDisableThinking(p.key, m.id), `${p.key}/${m.id}：不发思考参数，不该被算成关不掉`).toBe(true);
          expect(adapter.supportsThinking?.(m.id) ?? true, `${p.key}/${m.id}：没有形态却显示思考控件`).toBe(false);
          continue;
        }
        checked++;
        expect(canDisableThinking(p.key, m.id), `${p.key}/${m.id}：标签与关闭档实际发的那个值不一致`).toBe(realOffValue(m.thinkingWire.off));
      }
    }
    expect(checked, '目录里一个带思考形态的 SKU 都没有 —— 这条在空转').toBeGreaterThan(0);
    expect(vacuous, '目录里一个不带思考形态的 SKU 都没有 —— 上面那条分支没被走过').toBeGreaterThan(0);
  });

  it('同一家内两种关闭能力并存：provider 级那个布尔必然对一边是错的', () => {
    const wiredOf = (p: (typeof PROVIDER_CATALOG)[number]) => p.models.filter((m) => m.thinkingWire);
    const mixed = PROVIDER_CATALOG.filter((p) => {
      const wired = wiredOf(p);
      return wired.some((m) => realOffValue(m.thinkingWire!.off)) && wired.some((m) => !realOffValue(m.thinkingWire!.off));
    });
    expect(mixed.length, '目录里没有「同一家两种关闭能力」的样本 —— 这条在空转（openai / claude 正是这种）').toBeGreaterThan(0);
    for (const p of mixed) {
      const wired = wiredOf(p);
      const provSays = p.canDisableThinking !== false;
      expect(wired.some((m) => canDisableThinking(p.key, m.id) !== provSays), `${p.key}：provider 级布尔与逐 SKU 判据完全一致，那逐 SKU 这条没在起作用`).toBe(true);
      expect(wired.filter((m) => canDisableThinking(p.key, m.id)).length, `${p.key} 该有关得掉的 SKU`).toBeGreaterThan(0);
      expect(wired.filter((m) => !canDisableThinking(p.key, m.id)).length, `${p.key} 该有关不掉的 SKU`).toBeGreaterThan(0);
    }
  });

  it('手填的 SKU 退回 provider 级保守值', () => {
    for (const p of PROVIDER_CATALOG) {
      expect(canDisableThinking(p.key, 'hand-typed-unknown-sku'), `${p.key}：未在册的型号应等于 provider 级判据`).toBe(p.canDisableThinking !== false);
    }
  });
});

// thinkingWireIf 是【取首个匹配】的有序数组，所以规则之间【没有继承】：某一档在
// 命中的那条规则里缺席 = 那一档什么都不发，而不是回落到宽规则的同名档。
// 这条约束目录在生成时断言，但断言在生成端、出事在这一端 —— 而且 tsc 抓不到：
// 档位全是可选键，少一个只会让请求静默少发 thinking，用户以为自己选了 medium，
// 模型按服务端默认推理并计费，界面上没有任何异常。所以这边自己再兜一道。
describe('thinkingWireIf：取首个匹配 ⇒ 规则之间不继承', () => {
  const withRules = PROVIDER_CATALOG.filter((p) => p.thinkingWireIf?.length);

  it('目录里确实有用到这个字段 —— 否则下面几条是空跑', () => {
    expect(withRules.length).toBeGreaterThan(0);
  });

  it('同一 provider 各规则的【非-off 档位】恒等，缺一档就是静默少发', () => {
    for (const p of withRules) {
      const sets = p.thinkingWireIf!.map((r) =>
        Object.keys(r.wire ?? {}).filter((k) => k !== 'off').sort().join(','),
      );
      for (const [i, s] of sets.entries()) {
        expect(s, `${p.key} 规则[${i}] 与规则[0] 档位不一致：少的那一档会什么都不发`).toBe(sets[0]);
      }
      expect(sets[0], `${p.key} 规则一个非-off 档位都没有`).not.toBe('');
    }
  });

});

describe('adapter.defaultModel（目录开箱默认）', () => {
  // 每个标了 defaultModel 的 adapter，那个型号必须在它自己的清单里 ——
  // 上游目录的"默认 ∈ models[]"不变量在消费侧的等价物；也拦住把字面量
  // 抄回代码里的复发（新装 404 事故的根因形态）。
  it("every advertised default is in the adapter model list", () => {
    for (const a of getAllAdapters()) {
      if (!a.defaultModel) continue;
      expect(a.models.some((m) => m.id === a.defaultModel), `${a.id}: defaultModel=${a.defaultModel} 不在清单`).toBe(true);
    }
  });
  it('the defaults users actually land on are the curated tier, not the first row', () => {
    // 首行≠默认的家是有意为之：claude 首行 opus、tokenhub 首行 preview。
    // 取几个已知错位点，防止哪天有人"顺手"把 models[0] 当默认回去。
    const probe = (id: string) => getAllAdapters().find((a) => a.id === id);
    expect(probe('claude')?.defaultModel).toBe('claude-sonnet-5-5');
    expect(probe('claude')?.models[0]?.id).toBe('claude-opus-5-5');
    expect(probe('tokenhub')?.defaultModel).toBe('hy3');
    expect(probe('moonshot')?.defaultModel).toBe('kimi-k2.6');
    expect(probe('atlascloud')?.defaultModel).toBe('deepseek-ai/deepseek-v4.1-flash');
  });
});
