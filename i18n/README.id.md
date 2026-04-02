<h1 align="center">Legend Talk</h1>

<p align="center">
  Rencana Open Source 365 #002 · Meja bundar AI dengan pemikir terbesar dalam sejarah
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
  <a href="README.th.md">ไทย</a> ·
  <a href="README.tr.md">Türkçe</a> ·
  <a href="README.bn.md">বাংলা</a>
</p>

Kumpulkan pemikir terbesar dunia dan biarkan mereka mendebatkan masalah Anda.

Legend Talk adalah alat diskusi meja bundar AI multi-ronde — pilih 2-10 tokoh dan saksikan perdebatan.

Juga berfungsi sebagai alat 1-1: berkonsultasi dengan 140+ pemikir.

**Demo:** [talk.newzone.top](https://talk.newzone.top)

## Tangkapan Layar

| Beranda | Chat |
|:-:|:-:|
| ![Beranda](../docs/images/home-chat.png) | ![Chat](../docs/images/chat-view.png) |

## Penggunaan

### Chat 1-1

Klik tombol **Chat** pada kartu karakter mana pun.

### Meja Bundar

Klik **+** pada 2-10 kartu. Atau **🎲 Acak** untuk 5 pemikir.

### Template

6 template meja bundar dengan pandangan yang bertentangan.

### Selama Percakapan

- **Berhenti** — batalkan generasi
- **Tambah/hapus peserta**
- **Atur ronde**
- **Lanjutkan**
- **Mulai ulang**
- **Ringkasan** — ringkasan AI
- **Bagikan**
- **Ekspor** — Markdown, JSON atau buat kartu berbagi via [json2card](https://github.com/rockbenben/json2card) (atur endpoint API di Pengaturan)
- **Impor**
- **Cabang**

### Tautan Langsung

Mulai melalui URL:

- **Berdasarkan nama:** `/#/chat?chars=Socrates,Confucius`
- **Berdasarkan ID:** `/#/chat?chars=socrates,confucius`
- **Berdasarkan kategori:** `/#/chat?category=philosophy`
- **Chat tunggal:** `/#/chat?chars=socrates`
- **Nama kustom:** `/#/chat?chars=Ada Lovelace,Linus Torvalds` (nama yang tidak dikenal otomatis membuat karakter)

Kategori yang tersedia: `philosophy`, `strategy`, `business`, `finance`, `history`, `sociology`, `psychology`, `science`, `literature`, `art`, `economics`, `politics`, `technology`, `religion`, `education`

Anda juga bisa membuat tautan dari antarmuka.

**Rute bahasa:** Awalan bahasa di URL. 18 bahasa.

## Fitur Lainnya

Selain di atas:

- **140+ pemikir** dalam 15 domain
- **Karakter kustom**
- **Pencarian** · **Favorit** · **Sinkronisasi** (AES)
- **Level berpikir** · **Model kustom** · **LLM kustom**
- **Multi-API**: OpenAI, Anthropic, DeepSeek + 5 lainnya
- **18 bahasa** · **Mode gelap** · **Responsif** · **Lokal-pertama**

## API yang Didukung

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

Semua mendukung ID model kustom. Default: DeepSeek Chat.

## Mulai Cepat

```bash
npm install
npm run dev
```

Buka http://localhost:5173, ke Pengaturan, masukkan kunci API.

## Proxy CORS

Beberapa penyedia memblokir permintaan langsung. Konfigurasikan proxy CORS per penyedia.

Untuk deploy sendiri, buat [Cloudflare Worker](https://dash.cloudflare.com):

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

## Struktur Proyek

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

## Stack Teknologi

React 19, Vite, Tailwind CSS v4, Zustand, i18next, React Router, TypeScript

## Skrip

| Perintah | Deskripsi |
|----------|----------|
| `npm run dev` | Server pengembangan |
| `npm run build` | Cek tipe + build |
| `npm run test` | Jalankan tes |
| `npm run preview` | Pratinjau build |

## Deploy

Build dan deploy folder `dist/` ke hosting statis mana pun:

```bash
npm run build
```

Menggunakan hash routing (`/#/chat/...`), tidak perlu konfigurasi server.

## Tentang Rencana 365

Ini adalah proyek #002 dari [Rencana Open Source 365](https://github.com/rockbenben/365opensource).

1 orang + AI, 300+ proyek open source dalam setahun. [Kirim ide Anda →](https://my.feishu.cn/share/base/form/shrcnI6y7rrmlSjbzkYXh6sjmzb)

## License

MIT
