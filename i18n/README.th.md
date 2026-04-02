<h1 align="center">Legend Talk</h1>

<p align="center">
  แผนโอเพนซอร์ส 365 #002 · โต๊ะกลม AI กับนักคิดผู้ยิ่งใหญ่ที่สุดในประวัติศาสตร์
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
  <a href="README.vi.md">Tiếng Việt</a> ·
  <a href="README.tr.md">Türkçe</a> ·
  <a href="README.id.md">Indonesia</a> ·
  <a href="README.bn.md">বাংলা</a>
</p>

รวมนักคิดที่ยิ่งใหญ่ที่สุดของโลกและให้พวกเขาถกเถียงปัญหาของคุณ

Legend Talk เป็นเครื่องมือโต๊ะกลม AI หลายรอบ — เลือก 2-10 บุคคลและดูการถกเถียง

ใช้เป็นเครื่องมือ 1 ต่อ 1 ได้ด้วย: ปรึกษานักคิดกว่า 140 คน

**สาธิต:** [talk.newzone.top](https://talk.newzone.top)

## ภาพหน้าจอ

| หน้าหลัก | แชท |
|:-:|:-:|
| ![หน้าหลัก](../docs/images/home-chat.png) | ![แชท](../docs/images/chat-view.png) |

## การใช้งาน

### แชท 1 ต่อ 1

คลิกปุ่ม **แชท** บนการ์ดตัวละคร

### โต๊ะกลม

คลิก **+** บน 2-10 การ์ด หรือ **🎲 สุ่ม** สำหรับ 5 นักคิด

### เทมเพลต

6 เทมเพลตโต๊ะกลมที่มีมุมมองขัดแย้ง

### ระหว่างการสนทนา

- **หยุด** — ยกเลิก
- **เพิ่ม/ลบผู้เข้าร่วม**
- **ตั้งรอบ**
- **ดำเนินต่อ**
- **เริ่มใหม่**
- **สรุป** — สรุปโดย AI
- **แชร์**
- **ส่งออก** — Markdown, JSON หรือสร้างการ์ดแชร์ผ่าน [json2card](https://github.com/rockbenben/json2card) (กำหนดค่า API endpoint ในการตั้งค่า)
- **นำเข้า**
- **แยกสาขา**

### ลิงก์ตรง

เริ่มผ่าน URL:

- **ตามชื่อ:** `/#/chat?chars=Socrates,Confucius`
- **ตาม ID:** `/#/chat?chars=socrates,confucius`
- **ตามหมวดหมู่:** `/#/chat?category=philosophy`
- **แชทเดี่ยว:** `/#/chat?chars=socrates`
- **ชื่อกำหนดเอง:** `/#/chat?chars=Ada Lovelace,Linus Torvalds` (ชื่อที่ไม่รู้จักจะสร้างตัวละครอัตโนมัติ)

หมวดหมู่ที่มี: `philosophy`, `strategy`, `business`, `finance`, `history`, `sociology`, `psychology`, `science`, `literature`, `art`, `economics`, `politics`, `technology`, `religion`, `education`

สร้างลิงก์จากอินเทอร์เฟซได้ด้วย

**เส้นทางภาษา:** คำนำหน้าภาษาใน URL 18 ภาษา

## คุณสมบัติเพิ่มเติม

นอกเหนือจากข้างต้น:

- **140+ นักคิด** ใน 15 สาขา
- **ตัวละครกำหนดเอง**
- **ค้นหา** · **รายการโปรด** · **ซิงค์** (AES)
- **ระดับการคิด** · **โมเดลกำหนดเอง** · **LLM กำหนดเอง**
- **หลาย API**: OpenAI, Anthropic, DeepSeek + 5 อื่นๆ
- **18 ภาษา** · **โหมดมืด** · **ตอบสนอง** · **ท้องถิ่นก่อน**

## API ที่รองรับ

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

ทั้งหมดรองรับ ID โมเดลกำหนดเอง ค่าเริ่มต้น: DeepSeek Chat

## เริ่มต้นอย่างรวดเร็ว

```bash
npm install
npm run dev
```

เปิด http://localhost:5173 ไปที่การตั้งค่า ใส่ API key

## CORS Proxy

บางผู้ให้บริการบล็อกคำขอตรง กำหนด CORS proxy ต่อผู้ให้บริการ

สำหรับ proxy ของคุณเอง สร้าง [Cloudflare Worker](https://dash.cloudflare.com):

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

## โครงสร้างโปรเจกต์

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

## เทคโนโลยี

React 19, Vite, Tailwind CSS v4, Zustand, i18next, React Router, TypeScript

## สคริปต์

| คำสั่ง | คำอธิบาย |
|--------|----------|
| `npm run dev` | เซิร์ฟเวอร์พัฒนา |
| `npm run build` | ตรวจสอบ + สร้าง |
| `npm run test` | ทดสอบ |
| `npm run preview` | แสดงตัวอย่าง |

## การ Deploy

สร้างและ deploy โฟลเดอร์ `dist/` ไปยังโฮสติ้งสถิต:

```bash
npm run build
```

ใช้ hash routing (`/#/chat/...`) ไม่ต้องตั้งค่าเซิร์ฟเวอร์

## เกี่ยวกับแผน 365

นี่คือโปรเจกต์ #002 ของ [แผนโอเพนซอร์ส 365](https://github.com/rockbenben/365opensource)

1 คน + AI, 300+ โปรเจกต์โอเพนซอร์สในหนึ่งปี [ส่งไอเดียของคุณ →](https://my.feishu.cn/share/base/form/shrcnI6y7rrmlSjbzkYXh6sjmzb)

## License

MIT
