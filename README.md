<h1 align="center">Legend Talk</h1>

<p align="center">
  365 Open Source Plan #002 · Multi-round AI roundtable with history's greatest thinkers
</p>

<p align="center">
  <a href="./README.zh.md">中文</a> ·
  <a href="./i18n/README.zh-Hant.md">繁體中文</a> ·
  <a href="./i18n/README.ja.md">日本語</a> ·
  <a href="./i18n/README.ko.md">한국어</a> ·
  <a href="./i18n/README.es.md">Español</a> ·
  <a href="./i18n/README.fr.md">Français</a> ·
  <a href="./i18n/README.de.md">Deutsch</a> ·
  <a href="./i18n/README.pt.md">Português</a> ·
  <a href="./i18n/README.it.md">Italiano</a> ·
  <a href="./i18n/README.ru.md">Русский</a> ·
  <a href="./i18n/README.ar.md">العربية</a> ·
  <a href="./i18n/README.hi.md">हिन्दी</a> ·
  <a href="./i18n/README.vi.md">Tiếng Việt</a> ·
  <a href="./i18n/README.th.md">ไทย</a> ·
  <a href="./i18n/README.tr.md">Türkçe</a> ·
  <a href="./i18n/README.id.md">Indonesia</a> ·
  <a href="./i18n/README.bn.md">বাংলা</a>
</p>

Put the world's greatest thinkers in a room and let them debate your problem.

Legend Talk is a multi-round AI roundtable — pick 2-10 historical or contemporary figures, throw in a question, and watch them argue across multiple rounds with a moderator synthesizing each round's key disagreements. Socrates questions Munger's assumptions while Nietzsche challenges them both.

Or just enter a topic and let AI assemble the panel — it picks 3-5 thinkers whose perspectives create productive tension.

Also works as a 1-on-1 thinking tool: consult any of 157 thinkers through their unique frameworks, not generic AI roleplay.

**Demo:** [talk.newzone.top](https://talk.newzone.top)

## Screenshots

| Home page | Chat view |
|:-:|:-:|
| ![Home](docs/images/home-chat.png) | ![Chat](docs/images/chat-view.png) |

## Usage

### 1-on-1 Chat

Click the **Chat** button on any character card to start a private conversation. The thinker responds using their unique framework and perspective.

### Auto Roundtable

Enter a topic in the input bar at the top of the home page — AI selects 3-5 thinkers whose perspectives create productive tension and starts the discussion immediately. No character picking needed.

### Manual Roundtable

Click the **+** button on 2-10 character cards to add them to your lineup. A floating bar appears at the bottom showing your selections:

- Click a character's avatar in the bar to remove them
- Click **Start Discussion** to launch the roundtable
- Click **Copy lineup link** to share this exact lineup as a URL

You can also click **🎲 Random** in the top-right to instantly start a roundtable with 5 random thinkers.

### Featured Templates

The home page shows 6 curated roundtable templates — pre-built lineups with thinkers whose perspectives genuinely conflict (e.g., "AI & Tech": Karpathy vs Ilya vs Feynman vs Taleb vs Paul Graham). One click to start.

### During a Conversation

- **Moderator** — after each round, an AI moderator synthesizes the discussion: identifies the core disagreement, tracks what shifted, and poses a targeted question for the next round
- **Stop** — cancel generation mid-stream (preserves content already generated)
- **Add/remove participants** anytime via the participants bar — turning a 1-on-1 into a roundtable or vice versa
- **Set rounds** — configure how many rounds the thinkers should debate before pausing
- **Continue** — add more rounds after a discussion completes
- **Same characters, new chat** — start a fresh conversation with the same characters
- **Summarize** — one-click AI summary extracting core viewpoints and disagreements
- **Share chat** — generate a shareable URL containing the full conversation
- **Export** — save as Markdown or JSON, or generate share cards via [json2card](https://github.com/rockbenben/json2card) (configure API endpoint in Settings)
- **Import** — restore conversations from a previously exported JSON file (in Settings)
- **Branch** — fork a new conversation from any message, preserving prior context

### Deep Links

Start a conversation directly via URL:

- **By name:** `/#/chat?chars=苏格拉底,孔子` or `/#/chat?chars=Socrates,Confucius`
- **By ID:** `/#/chat?chars=socrates,confucius`
- **By category:** `/#/chat?category=philosophy` (starts a roundtable with all thinkers in that category, capped at 10)
- **Single chat:** `/#/chat?chars=socrates`
- **Custom names:** `/#/chat?chars=Ada Lovelace,Linus Torvalds` (unrecognized names auto-create custom characters)

Available categories: `philosophy`, `strategy`, `business`, `finance`, `history`, `sociology`, `psychology`, `science`, `literature`, `art`, `economics`, `politics`, `technology`, `religion`, `education`.

You can also use the **Copy lineup link** button in the participants bar or the **Copy category link** button in the category filter to generate these URLs from the UI.

**Language routing:** Use a language prefix in the URL to set the UI language, e.g. `/#/ja/chat`, `/#/ko/chat?chars=socrates`. You can also use `?lang=zh` as a query parameter. Supports all 18 languages.

## More Features

Beyond the usage above:

- **157 preset thinkers** across 15 domains, sorted by fame, with free input for any name
- **Conversation search** — search across all conversations by title, character name, or message content
- **Favorite characters** — star your most-used thinkers for quick access
- **Settings sync** — share settings to another device via URL (API keys AES-encrypted)
- **Thinking level** — configure model thinking depth (off/low/medium/high)
- **Custom models** — manually enter any model ID
- **Custom LLM** — connect any OpenAI-compatible API
- **Multi-API support** — OpenAI, Anthropic, DeepSeek, Volcengine, Alibaba Bailian, SiliconFlow, Groq, OpenRouter
- **18 languages** · **Dark mode** · **Responsive** · **Local-first** (IndexedDB + localStorage dual-write, compatible with WeChat and restricted WebViews)

## Supported APIs

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

All providers support custom model IDs. Default: DeepSeek Chat. You can also add any OpenAI-compatible API via the "Custom" provider option.

## Quick Start

```bash
npm install
npm run dev
```

Open http://localhost:5173, go to Settings, enter your API key, then start chatting. If you hit a CORS error, the app will prompt you to enable a public proxy with one click.

## CORS Proxy

Some API providers block direct browser requests. CORS proxy is configured per provider in Settings — toggle the switch to enable it. A public proxy (`https://cors.api2026.workers.dev`) is used by default.

To deploy your own, create a [Cloudflare Worker](https://dash.cloudflare.com) with this code:

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

## Project Structure

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

## Tech Stack

React 19, Vite, Tailwind CSS v4, Zustand, i18next, React Router, TypeScript

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start dev server |
| `npm run build` | Type-check and build for production |
| `npm run test` | Run tests |
| `npm run preview` | Preview production build |

## Deploy

Build and deploy the `dist/` folder to any static hosting (Vercel, Netlify, GitHub Pages, etc.):

```bash
npm run build
```

Uses hash-based routing (`/#/chat/...`, `/#/ja/chat/...`) so no server-side routing config needed.

## About 365 Open Source Plan

This is project #002 of the [365 Open Source Plan](https://github.com/rockbenben/365opensource).

One person + AI, 300+ open source projects in a year. [Submit your idea →](https://my.feishu.cn/share/base/form/shrcnI6y7rrmlSjbzkYXh6sjmzb)

## License

MIT
