/**
 * 把第三方来源的地址收窄到 http(s)；不合格返回 undefined。
 *
 * 用在导入分享配置那条路径上。那份 JSON 里有三个字段决定【用户自己的 API key
 * 发到哪台机器】——corsProxy、customBaseUrl、baseUrlByProvider——而配置是从
 * 链接里来的，等于第三方输入。一条把 corsProxy 指向他人域名的分享链接，足以让
 * 对方收走此后每一次请求的 key。
 *
 * 不合格时【整条丢弃】而不是退回默认值：退回默认会让用户以为那一项导入成功了。
 * 校验只是一半，另一半是【披露】——地址必须出现在导入确认框里，否则用户是在对
 * 看不见的东西点同意。
 */
export function safeHttpUrl(v: unknown): string | undefined {
  if (typeof v !== 'string') return undefined;
  const trimmed = v.trim();
  if (!trimmed) return undefined;
  try {
    const u = new URL(trimmed);
    return u.protocol === 'http:' || u.protocol === 'https:' ? trimmed : undefined;
  } catch {
    // 相对地址（'/api'）也会走到这里：它没有主机名，拿来当 API 端点没有意义，
    // 丢掉是对的。
    return undefined;
  }
}
