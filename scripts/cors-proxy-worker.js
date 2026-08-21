// CORS 中转 Worker —— 浏览器直连拿不到 CORS 头的服务商，请求经它转发。
// 部署到自己的 Cloudflare 账号，然后在设置里把「CORS 中转」指向它。
//
// 【底线】目标由部署方声明，绝不由调用方自带。
// 早期那版是开放代理：路径给什么就转发到什么（实测 `GET /https://example.com`
// 返回 200）。那等于给全网开了一个免费的 CORS 逃逸服务 —— 你的 Cloudflare 配额
// 被陌生人吃掉、滥用流量顶着你的域名出去、上游一旦按 IP 限流就是全体用户一起死。
// 这个洞在客户端修不了：worker 是对整个互联网开放的，不只对本 app。
//
// 客户端契约没变（路径就是完整目标 URL），所以换成本版不需要改 app、
// 不需要协同发版；加的只是 host 白名单 + 只放行 https。
//
// 自建就是改这份文件：往 ALLOWED_HOSTS 里加你要用的 host 即可，没有别的配置。
//
// 维护：ALLOWED_HOSTS 要覆盖 src/adapters 里每个 provider 的 host ——
// tests/utils/corsWorker.test.ts 机械校验，新增 provider 而这里漏加会红。
// 本地服务（LiteLLM / Ollama 之类）【不要】加：它们同源可达、本就不需要代理，
// 把 127.0.0.1 放进来等于让 worker 去打它自己的内网。
//
// 除转发外还带【分享短链】的两个端点，因为分享链接里烘着这台机器的地址
// （`#/shared/s:{base64url(本机地址)}:{id}`），换机器旧链接就全死了：
//   · POST /shorten  —— body 是 base64 串，存 KV，回 {id}
//   · GET  /s/{id}   —— 取回那段 base64
// 需要绑 KV namespace，变量名 LINKS（与线上原版一致 —— 名字对不上等于换了个空
// 库，旧短链会全部解析不到：代码看着没问题，坏的是数据）。
// 没绑也不会崩：/shorten 回 501，客户端静默退回长 URL（它有兜底）。

// 允许转发到的 host（含各家的区域 / 产品线变体）。
const ALLOWED_HOSTS = new Set([
  // 海外
  "api.anthropic.com",
  "api.atlascloud.ai",
  "api.cerebras.ai",
  "api.cohere.ai",
  "api.fireworks.ai",
  "api.groq.com",
  "api.mistral.ai",
  "api.openai.com",
  "api.together.xyz",
  "api.x.ai",
  "generativelanguage.googleapis.com",
  "integrate.api.nvidia.com",
  "openrouter.ai",
  "opencode.ai",
  "llm.api.cloud.yandex.net",
  // 国内
  "api.deepseek.com",
  "api.minimax.io",
  "api.minimaxi.com",
  "api.moonshot.ai",
  "api.moonshot.cn",
  "api.siliconflow.cn",
  "api.stepfun.com",
  "api.xiaomimimo.com",
  "api.z.ai",
  "ark.cn-beijing.volces.com",
  "dashscope.aliyuncs.com",
  "dashscope-intl.aliyuncs.com",
  "dashscope-us.aliyuncs.com",
  "open.bigmodel.cn",
  "qianfan.baidubce.com",
  "token-plan-ams.xiaomimimo.com",
  "token-plan-cn.xiaomimimo.com",
  "token-plan-sgp.xiaomimimo.com",
  "tokenhub.tencentmaas.com",
  "tokenhub-intl.tencentmaas.com",
  // Coding Plan 订阅线（与按量付费不是同一个 host）
  "coding.dashscope.aliyuncs.com",
]);

// 短链【不过期】，改按条数封顶。分享出去的链接是给别人点的，按时间自杀最难受：
// 一周后失效，而发链接的人毫不知情（客户端把 内容哈希→id 缓存在 localStorage
// 里且不带过期，第 8 天照样复用那个 id 拼链接，对面拿到 404）。
// 按条数淘汰则是「新的挤掉旧的」—— 上限内的链接永远有效。
//
// 能精确删掉最旧的，靠的是【key 本身按时间有序】：base36 毫秒时间戳打头，
// KV 的 list 是字典序，字典序在这里就等于时间序，所以 list 回来的头几个就是
// 最旧的几个。用随机 id 做不到这件事 —— 那样 list 出来的顺序与时间无关，
// 只能靠给每条挂 metadata 再全量拉回来排序，成本高一个量级。
const MAX_LINKS = 900;
const MAX_SHORTEN_BYTES = 512_000;

/**
 * 超出上限就删掉最旧的几条。跑在 waitUntil 里，不占用户等待。
 * list 一次上限 1000 条，而 MAX_LINKS 取 900 —— 留出余量，任何一次写入后
 * 都能在同一次 list 里看到溢出并削掉；突发写入撑过 1000 也会在随后的写入里
 * 逐次收敛回去，不会无限涨。
 */
async function pruneLinks(kv) {
  const { keys } = await kv.list({ limit: 1000 });
  const excess = keys.length - MAX_LINKS;
  if (excess <= 0) return;
  await Promise.all(keys.slice(0, excess).map((k) => kv.delete(k.name)));
}

// 转发到上游的请求头【白名单】。用白名单而不是「剥掉已知的坏头」：Cloudflare
// 明天多加一个带来源信息的头，黑名单会放过去，白名单不会。
// 凭据类必须在列 —— 代它转发正是这台机器的用途。
const FORWARDED_HEADERS = new Set([
  "content-type",
  "accept", // text/event-stream —— 少了它有的上游不给流式
  "authorization", // OpenAI 兼容
  "x-api-key", // Anthropic
  "anthropic-version",
  "anthropic-beta",
  "anthropic-dangerous-direct-browser-access",
  "x-goog-api-key", // Gemini 原生
  "http-referer", // OpenRouter 归属统计
  "x-title", // 同上
]);

const corsHeaders = (origin) => ({
  "Access-Control-Allow-Origin": origin || "*",
  "Access-Control-Allow-Methods": "GET,POST,PUT,PATCH,DELETE,OPTIONS",
  "Access-Control-Allow-Headers": [...FORWARDED_HEADERS].join(", "),
  "Access-Control-Max-Age": "86400",
});

const deny = (status, message, origin) =>
  new Response(JSON.stringify({ error: message }), {
    status,
    headers: { "Content-Type": "application/json", ...corsHeaders(origin) },
  });

export default {
  async fetch(request, env, ctx) {
    const origin = request.headers.get("Origin");
    if (request.method === "OPTIONS") return new Response(null, { status: 204, headers: corsHeaders(origin) });

    const url = new URL(request.url);

    // ── 分享短链 ──────────────────────────────────────────────────────────
    // 放在目标解析【之前】：这两条路径不是转发目标，交给下面会被判成畸形 URL。
    if (url.pathname === "/shorten" && request.method === "POST") {
      // ⚠ 写入这条路【故意不设任何闸】—— 不是漏了，是想过之后决定不加。
      //
      // 来源白名单先被否掉：短链给谁用不该由这台机器挑，fork 出去自部署前端、从
      // 别的域名打过来、局域网里跑都是正当用法，按 Origin 拦正好把他们拦掉；而真
      // 要刷的人 curl 一行就能编出任意 Origin。那道闸只挡好人，别再加回来。
      //
      // 按 IP 限流也不加：它要多一个 wrangler 绑定，而这份文件的卖点是「改
      // ALLOWED_HOSTS 就行，没有别的配置」。
      //
      // 于是天花板明摆着：约 MAX_LINKS 次匿名写入就能把所有人的现有短链挤光（见
      // 下面的 pruneLinks，「新的挤掉旧的」），而且死得无声 —— 客户端把
      // 内容哈希→id 缓存在 localStorage 且不带过期，之后照样拿那个已经 404 的 id
      // 拼链接。这是【已知并接受】的风险：短链只是分享的加分项，没有它客户端本来
      // 就会退回长 URL。哪天真被刷了，方向是限流 / 鉴权 / Turnstile，不是 Origin。
      if (!env?.LINKS) return deny(501, "Short links not configured (bind a KV namespace as LINKS)", origin);
      const content = await request.text();
      if (!content) return deny(400, "Empty content", origin);
      if (content.length > MAX_SHORTEN_BYTES) return deny(413, "Payload too large", origin);
      // 时间戳打头保证 list 的字典序 = 时间序（见 pruneLinks）；后缀防同毫秒撞车。
      // base36 的毫秒时间戳到 2059 年都是 8 位，长度不变，排序才稳。
      const id = Date.now().toString(36) + crypto.randomUUID().slice(0, 4);
      await env.LINKS.put(id, content);
      ctx?.waitUntil?.(pruneLinks(env.LINKS));
      return new Response(JSON.stringify({ id }), { headers: { "Content-Type": "application/json", ...corsHeaders(origin) } });
    }
    if (url.pathname.startsWith("/s/")) {
      if (!env?.LINKS) return deny(501, "Short links not configured (bind a KV namespace as LINKS)", origin);
      const content = await env.LINKS.get(url.pathname.slice(3));
      if (content === null) return deny(404, "Not found", origin);
      // 客户端读的是 res.text()，不是 JSON
      return new Response(content, { headers: { "Content-Type": "text/plain; charset=utf-8", ...corsHeaders(origin) } });
    }
    // ─────────────────────────────────────────────────────────────────────
    // 路径即目标：/https://api.deepseek.com/chat/completions
    // 去掉前导斜杠后必须是一个完整 URL；查询串原样跟在目标后面。
    const raw = url.pathname.slice(1) + url.search;
    if (!raw) return deny(400, "Usage: /https://<allowed-host>/path", origin);

    let target;
    try {
      target = new URL(raw);
    } catch {
      return deny(400, "Malformed target URL", origin);
    }
    // 只允许 https：与 002 README 的参考实现一致（它也只收 https://）。
    // 白名单里没有本地/明文服务，放开 http 只会多一类把 worker 当跳板的尝试。
    if (target.protocol !== "https:") {
      return deny(400, "Only https targets are allowed", origin);
    }
    // 【核心】目标必须在部署方声明的集合里 —— 这一条把它与开放代理区分开。
    // 注意比 host（含端口）而不是 hostname：端口不同就是不同的服务。
    if (!ALLOWED_HOSTS.has(target.host)) {
      return deny(403, `Target host not allowed: ${target.host}`, origin);
    }

    const headers = new Headers();
    for (const [k, v] of request.headers) {
      if (FORWARDED_HEADERS.has(k.toLowerCase())) headers.set(k, v);
    }
    if (!headers.has("Content-Type")) headers.set("Content-Type", "application/json");

    let upstream;
    try {
      upstream = await fetch(target.toString(), {
        method: request.method,
        headers,
        // GET/HEAD 不能带 body；其余原样透传（流式请求体也走这条）
        body: request.method === "GET" || request.method === "HEAD" ? undefined : request.body,
        // 流式响应要原样往下传，不能等 Worker 缓冲完
        ...(request.body ? { duplex: "half" } : {}),
      });
    } catch (e) {
      // 不接住的话 Worker 抛出的是不带 CORS 头的 1101 —— 浏览器只会报「跨域失败」，
      // 真实原因（上游连不上、DNS 挂了）一个字都到不了用户眼前。
      return deny(502, `Upstream request failed: ${e?.message || e}`, origin);
    }

    // 上游的响应头原样保留（含 Content-Type: text/event-stream），只覆盖 CORS 那几个。
    const out = new Headers(upstream.headers);
    for (const [k, v] of Object.entries(corsHeaders(origin))) out.set(k, v);
    // Retry-After 不在 CORS 安全列表里 —— 不显式 expose，浏览器会把它藏起来，
    // 客户端读不到就只能退回自己那套猜测性的退避。
    if (upstream.headers.has("Retry-After")) out.set("Access-Control-Expose-Headers", "Retry-After");
    return new Response(upstream.body, { status: upstream.status, statusText: upstream.statusText, headers: out });
  },
};
