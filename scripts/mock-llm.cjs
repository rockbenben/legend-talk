// Minimal OpenAI-compatible SSE mock for end-to-end testing (no API key needed).
// Streams a short Chinese response token-by-token with CORS enabled.
const http = require('http');

http.createServer((req, res) => {
  if (req.method === 'OPTIONS') {
    res.writeHead(204, {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': '*',
      'Access-Control-Allow-Headers': '*',
    });
    return res.end();
  }
  if (req.url.endsWith('/chat/completions')) {
    let body = '';
    req.on('data', (d) => { body += d; });
    req.on('end', () => {
      res.writeHead(200, {
        'Content-Type': 'text/event-stream',
        'Access-Control-Allow-Origin': '*',
        'Cache-Control': 'no-cache',
      });
      const words = ['这是', '一段', '来自', '本地', '模拟', '服务', '的', '流式', '回应', '，', '内容', '足够', '长', '以便', '验证', '节流', '与', '中断', '路径', '。'];
      let i = 0;
      const t = setInterval(() => {
        if (i < words.length) {
          res.write(`data: ${JSON.stringify({ choices: [{ delta: { content: words[i++] } }] })}\n\n`);
        } else {
          res.write('data: [DONE]\n\n');
          clearInterval(t);
          res.end();
        }
      }, 35);
      // NOTE: req 'close' fires on message-complete in modern Node — listening
      // there kills the interval immediately. res 'close' = connection gone.
      res.on('close', () => clearInterval(t));
    });
  } else {
    res.writeHead(404, { 'Access-Control-Allow-Origin': '*' });
    res.end();
  }
}).listen(8787, () => console.log('mock-llm listening on 8787'));
