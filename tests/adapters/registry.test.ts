import { getAdapter, getAllAdapters, MODEL_ID_MIGRATIONS, PROVIDER_ID_MIGRATIONS, PROXY_BY_DEFAULT } from '../../src/adapters/registry';
import { PROVIDER_CATALOG } from '../../src/adapters/providerCatalog.generated';
import { OpenAICompatibleAdapter } from '../../src/adapters/openai-compatible';
import { canDisableThinking } from '../../src/adapters/thinking';

/** 当前所有 adapter 在售的模型 id。 */
function liveModelIds(): Set<string> {
  return new Set(getAllAdapters().flatMap((a) => a.models.map((m) => m.id)));
}

describe('MODEL_ID_MIGRATIONS', () => {
  // 迁移只跑一次，指向另一个已死的 id 等于没迁 —— 旧版真出现过一串
  // hunyuan-* → hunyuan-a13b，而 a13b 本身随后也退役了。
  it('每个 target 都是当前在售的模型 id', () => {
    const live = liveModelIds();
    const dead = Object.entries(MODEL_ID_MIGRATIONS).filter(([, to]) => !live.has(to));
    expect(dead, `迁移目标已不存在：${dead.map(([f, t]) => `${f}→${t}`).join(', ')}`).toEqual([]);
  });

  // Coding Plan 与官方线有重名 SKU（glm-4.7 / kimi-k2.5 / MiniMax-M2.5 至今仍是
  // Coding Plan 的合法型号）。把它们写进迁移表会把订阅用户选好的模型改掉。
  it('每个 key 都已不在任何 adapter 里', () => {
    const live = liveModelIds();
    const stillLive = Object.keys(MODEL_ID_MIGRATIONS).filter((from) => live.has(from));
    expect(stillLive, `这些 id 仍在售，不该被迁移：${stillLive.join(', ')}`).toEqual([]);
  });

  it('不存在链式迁移（target 不能又是别人的 key）', () => {
    const keys = new Set(Object.keys(MODEL_ID_MIGRATIONS));
    const chained = Object.entries(MODEL_ID_MIGRATIONS).filter(([, to]) => keys.has(to));
    expect(chained, `链式迁移只会跑一步：${chained.map(([f, t]) => `${f}→${t}`).join(', ')}`).toEqual([]);
  });
});

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

  it('能关闭的照旧为 true，目录里没有的本地条目按能关处理', () => {
    expect(canDisableThinking('deepseek')).toBe(true);
    expect(canDisableThinking('volcengine')).toBe(true); // Coding Plan，目录里没有
    expect(canDisableThinking(undefined)).toBe(true);
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
