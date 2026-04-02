<h1 align="center">Legend Talk</h1>

<p align="center">
  Kế hoạch mã nguồn mở 365 #002 · Bàn tròn AI với những bộ óc vĩ đại nhất lịch sử
</p>

<p align="center">
  <a href="../README.md">English</a> ·
  <a href="../README.zh.md">中文</a> ·
  <a href="README.zh-Hant.md">繁體中文</a> ·
  <a href="README.ja.md">日本語</a> ·
  <a href="README.ko.md">한국어</a> ·
  <a href="README.es.md">Español</a> ·
  <a href="README.fr.md">Français</a> ·
  <a href="README.de.md">Deutsch</a> ·
  <a href="README.pt.md">Português</a> ·
  <a href="README.it.md">Italiano</a> ·
  <a href="README.ru.md">Русский</a> ·
  <a href="README.ar.md">العربية</a> ·
  <a href="README.hi.md">हिन्दी</a> ·
  <a href="README.th.md">ไทย</a> ·
  <a href="README.tr.md">Türkçe</a> ·
  <a href="README.id.md">Indonesia</a> ·
  <a href="README.bn.md">বাংলা</a>
</p>

Tập hợp những bộ óc vĩ đại nhất thế giới và để họ tranh luận về vấn đề của bạn.

Legend Talk là công cụ thảo luận bàn tròn AI nhiều vòng — chọn 2-10 nhân vật và xem cuộc tranh luận.

Cũng hoạt động như công cụ 1-1: tham vấn hơn 140 nhà tư tưởng.

**Demo:** [talk.newzone.top](https://talk.newzone.top)

## Ảnh chụp

| Trang chủ | Chat |
|:-:|:-:|
| ![Trang chủ](../docs/images/home-chat.png) | ![Chat](../docs/images/chat-view.png) |

## Cách dùng

### Chat 1-1

Nhấn nút **Chat** trên bất kỳ thẻ nào.

### Bàn Tròn

Nhấn **+** trên 2-10 thẻ. Hoặc **🎲 Ngẫu nhiên** để chọn 5 người.

### Mẫu

6 mẫu bàn tròn với quan điểm đối lập.

### Trong cuộc trò chuyện

- **Dừng** — hủy tạo
- **Thêm/xóa người tham gia**
- **Đặt số vòng**
- **Tiếp tục**
- **Bắt đầu lại**
- **Tóm tắt** — tóm tắt AI
- **Chia sẻ**
- **Xuất** — Markdown, JSON hoặc tạo thẻ chia sẻ qua [json2card](https://github.com/rockbenben/json2card) (cấu hình endpoint API trong Cài đặt)
- **Nhập**
- **Nhánh**

### Liên kết trực tiếp

Bắt đầu qua URL:

- **Theo tên:** `/#/chat?chars=Socrates,Confucius`
- **Theo ID:** `/#/chat?chars=socrates,confucius`
- **Theo danh mục:** `/#/chat?category=philosophy`
- **Chat đơn:** `/#/chat?chars=socrates`
- **Tên tùy chỉnh:** `/#/chat?chars=Ada Lovelace,Linus Torvalds` (tên không nhận diện được tự động tạo nhân vật)

Danh mục có sẵn: `philosophy`, `strategy`, `business`, `finance`, `history`, `sociology`, `psychology`, `science`, `literature`, `art`, `economics`, `politics`, `technology`, `religion`, `education`

Cũng có thể tạo liên kết từ giao diện.

**Định tuyến ngôn ngữ:** Tiền tố ngôn ngữ trong URL. 18 ngôn ngữ.

## Tính năng khác

Ngoài những điều trên:

- **140+ nhà tư tưởng** trong 15 lĩnh vực
- **Nhân vật tùy chỉnh**
- **Tìm kiếm** · **Yêu thích** · **Đồng bộ** (AES)
- **Mức suy nghĩ** · **Mô hình tùy chỉnh** · **LLM tùy chỉnh**
- **Đa API**: OpenAI, Anthropic, DeepSeek + 5 khác
- **18 ngôn ngữ** · **Chế độ tối** · **Responsive** · **Ưu tiên cục bộ**

## API hỗ trợ

| Provider | Models |
|----------|--------|
| OpenAI | GPT-5.4, GPT-5.4 Mini/Nano, o4 Mini, o3, GPT-4.1 series |
| Anthropic | Claude Opus 4.6, Claude Sonnet 4.6, Claude Haiku 4.5 |
| DeepSeek | DeepSeek Chat, DeepSeek Reasoner |
| Volcengine | Doubao Seed 2.0 Pro, Doubao 1.5 series, DeepSeek R1/V3 |
| Alibaba Bailian | Qwen 3.5 Plus, Kimi K2.5, GLM-5, MiniMax M2.5, etc. |
| SiliconFlow | DeepSeek V3/R1, Qwen 2.5 series |
| Groq | LLaMA 4 Scout/Maverick, DeepSeek R1 |
| OpenRouter | Any model via OpenRouter catalog |

Tất cả hỗ trợ ID mô hình tùy chỉnh. Mặc định: DeepSeek Chat.

## Bắt đầu nhanh

```bash
npm install
npm run dev
```

Mở http://localhost:5173, vào Cài đặt, nhập khóa API.

## Proxy CORS

Một số nhà cung cấp chặn yêu cầu trực tiếp. Cấu hình proxy CORS theo nhà cung cấp.

Để triển khai riêng, tạo [Cloudflare Worker](https://dash.cloudflare.com):

<details>
<summary>Worker code</summary>

```javascript
export default {
  async fetch(request) {
    const url = new URL(request.url);
    const targetUrl = url.pathname.slice(1) + url.search;
    if (!targetUrl || !targetUrl.startsWith('https://')) {
      return new Response('Usage: /https://target-api.com/path', { status: 400 });
    }
    if (request.method === 'OPTIONS') {
      return new Response(null, {
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
          'Access-Control-Allow-Headers': '*',
          'Access-Control-Max-Age': '86400',
        },
      });
    }
    const response = await fetch(targetUrl, {
      method: request.method,
      headers: request.headers,
      body: request.body,
    });
    const newResponse = new Response(response.body, response);
    newResponse.headers.set('Access-Control-Allow-Origin', '*');
    return newResponse;
  },
};
```

</details>

## Cấu trúc dự án

```
src/
  adapters/       # LLM API adapters (OpenAI, Anthropic, etc.)
  characters/     # Character presets and custom character generation
  components/     # React components
  hooks/          # useChat, useRoundtable
  i18n/           # Internationalization
  stores/         # Zustand state management
  utils/          # Prompt building, export, compression, storage
  types.ts        # Type definitions
```

## Công nghệ

React 19, Vite, Tailwind CSS v4, Zustand, i18next, React Router, TypeScript

## Script

| Lệnh | Mô tả |
|------|-------|
| `npm run dev` | Server phát triển |
| `npm run build` | Kiểm tra kiểu + build |
| `npm run test` | Chạy test |
| `npm run preview` | Xem trước build |

## Triển khai

Build và triển khai `dist/` lên hosting tĩnh bất kỳ:

```bash
npm run build
```

Dùng hash routing (`/#/chat/...`), không cần cấu hình server.

## Về Kế hoạch 365

Đây là dự án #002 của [Kế hoạch Mã nguồn mở 365](https://github.com/rockbenben/365opensource).

1 người + AI, 300+ dự án mã nguồn mở trong một năm. [Gửi ý tưởng →](https://my.feishu.cn/share/base/form/shrcnI6y7rrmlSjbzkYXh6sjmzb)

## License

MIT
