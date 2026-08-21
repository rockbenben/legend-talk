import { safeHttpUrl } from '../../src/utils/url';

describe('safeHttpUrl', () => {
  it('放行 http(s)，并去掉首尾空白', () => {
    expect(safeHttpUrl('https://api.example.com/v1')).toBe('https://api.example.com/v1');
    expect(safeHttpUrl('http://127.0.0.1:1234/v1')).toBe('http://127.0.0.1:1234/v1');
    expect(safeHttpUrl('  https://a.example/v1  ')).toBe('https://a.example/v1');
  });

  it('挡掉非 http(s) 协议', () => {
    for (const bad of ['javascript:alert(1)', 'data:text/html,x', 'file:///etc/passwd', 'ftp://a.example']) {
      expect(safeHttpUrl(bad), bad).toBeUndefined();
    }
  });

  it('挡掉相对地址与非字符串 —— 没有主机名的东西当不了 API 端点', () => {
    for (const bad of ['/api', 'api.example.com', '', '   ', undefined, null, 42, {}]) {
      expect(safeHttpUrl(bad), String(bad)).toBeUndefined();
    }
  });
});
