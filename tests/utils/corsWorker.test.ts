import worker from '../../scripts/cors-proxy-worker.js?raw';

// scripts/cors-proxy-worker.js 是【唯一一份】Worker 代码：线上那台照它部署，
// README（含全部翻译）也只是链接到它。以前 18 份 README 各内嵌一份副本，
// 只改主文件而漏掉翻译，等于继续给大多数语言的读者发开放代理版。
const readmes = import.meta.glob('../../{README.md,README.zh.md,docs/i18n/README.*.md}', {
  query: '?raw',
  import: 'default',
  eager: true,
}) as Record<string, string>;

describe('CORS Worker', () => {
  it('目标由部署方声明 —— 少了 host 白名单或 https 检查就退化回开放代理', () => {
    expect(worker).toContain('const ALLOWED_HOSTS');
    expect(worker).toContain('ALLOWED_HOSTS.has(target.host)');
    expect(worker).toMatch(/target\.protocol !== "https:"/);
  });

  it('白名单里没有本地回环 —— 那会让 worker 去打它自己的内网', () => {
    const hosts = [...worker.matchAll(/"([^"]+)"/g)].map((m) => m[1]);
    const bad = hosts.filter((h) => /^(127\.|10\.|192\.168\.|localhost|0\.0\.0\.0)/.test(h));
    expect(bad, `不该出现在白名单里：${bad.join(', ')}`).toEqual([]);
  });

  it('白名单覆盖本 app 收录的每个 provider —— 漏一个的表现是它一开代理就 403', async () => {
    const listed = new Set([...worker.matchAll(/"([a-z0-9.-]+\.[a-z]{2,})"/g)].map((m) => m[1]));
    const { getAllAdapters } = await import('../../src/adapters/registry');
    const missing: string[] = [];
    for (const a of getAllAdapters()) {
      const base = (a as unknown as { baseUrl?: string }).baseUrl;
      if (!base) continue; // custom（llm）没有默认地址
      const host = new URL(base).host;
      // 本地服务同源可达、本就不需要代理，见上一条
      if (/^(127\.|10\.|192\.168\.|localhost|0\.0\.0\.0)/.test(host)) continue;
      if (!listed.has(host)) missing.push(`${a.id} → ${host}`);
    }
    expect(missing, `白名单缺：${missing.join(', ')}`).toEqual([]);
  });

  it('带分享短链的两个端点 —— 分享链接里烘着本机地址，少了它旧链接就全死', () => {
    // 客户端契约：POST /shorten（body 是 base64，回 {id}）+ GET /s/{id}（回纯文本）。
    // 见 ChatView 的分享逻辑与 SharedView 的 s: 解析。这两条曾经被"精简"掉过一次，
    // 表现是新分享静默退回长链接、已发出的短链全部 404 —— 客户端有兜底所以不报错。
    expect(worker).toContain('"/shorten"');
    expect(worker).toContain('/s/');
    expect(worker).toContain('LINKS');
    // 必须排在目标解析之前，否则会被当成畸形转发目标
    expect(worker.indexOf('"/shorten"')).toBeLessThan(worker.indexOf('ALLOWED_HOSTS.has(target.host)'));
  });

  it('短链不过期，按条数淘汰 —— 分享出去的链接不该到期自杀', () => {
    // 客户端把 内容哈希→id 缓存在 localStorage 且不带过期，所以 TTL 一到，
    // 发链接的人毫不知情地继续复用死 id，对面拿到 404。
    expect(worker).not.toContain('expirationTtl');
    expect(worker).toContain('MAX_LINKS');
    expect(worker).toContain('pruneLinks');
  });

  it('短链 id 以时间戳打头 —— 淘汰最旧那批靠的就是它', () => {
    // KV 的 list 是字典序；只有 key 按时间有序，字典序才等于时间序，
    // list 回来的头几个才真的是最旧的。改成纯随机 id 会静默失去淘汰能力：
    // 代码照跑，删掉的却是随机几条。
    expect(worker).toContain('Date.now().toString(36)');
  });

  it('转发请求头用白名单 —— 黑名单挡不住上游明天新增的头', () => {
    expect(worker).toContain('FORWARDED_HEADERS');
    expect(worker).toContain('FORWARDED_HEADERS.has(');
    // 凭据必须在列，否则代理等于把请求打成匿名的
    for (const h of ['authorization', 'x-api-key', 'x-goog-api-key']) {
      expect(worker, `${h} 不在转发白名单里`).toContain(`"${h}"`);
    }
  });

  it('上游失败也带 CORS 头 —— 否则浏览器只报跨域，真实原因到不了用户眼前', () => {
    expect(worker).toContain('Upstream request failed');
    expect(worker).toContain('Access-Control-Expose-Headers');
  });

  it('README 只链接、不内嵌副本', () => {
    const files = Object.entries(readmes);
    expect(files.length).toBeGreaterThanOrEqual(18);
    for (const [name, md] of files) {
      expect(md, `${name} 又内嵌了 Worker 代码`).not.toContain('ALLOWED_HOSTS');
      expect(md, `${name} 没有指向 Worker 文件的链接`).toContain('scripts/cors-proxy-worker.js');
    }
  });
});
