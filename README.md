<p align="center">
  <img src="public/logo.png" width="84" height="84" alt="Legend Talk logo" />
</p>

<h1 align="center">Legend Talk</h1>

<p align="center">
  Multi-round AI roundtable with history's greatest thinkers
</p>

<p align="center">
  <b><a href="https://talk.newzone.top/">▶ Try it live</a></b> — 18 languages · free · local-first · no sign-up
  <br>
  <a href="LICENSE"><img src="https://img.shields.io/badge/license-MIT-green.svg" alt="License: MIT"></a>
  <a href="https://github.com/rockbenben/365opensource"><img src="https://img.shields.io/badge/365%20Open%20Source%20Plan-%23002-1f6feb" alt="365 Open Source Plan #002"></a>
</p>

<p align="center">
  <b>English</b> ·
  <a href="./README.zh.md">简体中文</a> ·
  <a href="docs/i18n/README.zh-Hant.md">繁體中文</a> ·
  <a href="docs/i18n/README.ja.md">日本語</a> ·
  <a href="docs/i18n/README.ko.md">한국어</a> ·
  <a href="docs/i18n/README.es.md">Español</a> ·
  <a href="docs/i18n/README.fr.md">Français</a> ·
  <a href="docs/i18n/README.de.md">Deutsch</a> ·
  <a href="docs/i18n/README.pt.md">Português</a> ·
  <a href="docs/i18n/README.it.md">Italiano</a> ·
  <a href="docs/i18n/README.ru.md">Русский</a> ·
  <a href="docs/i18n/README.ar.md">العربية</a> ·
  <a href="docs/i18n/README.hi.md">हिन्दी</a> ·
  <a href="docs/i18n/README.vi.md">Tiếng Việt</a> ·
  <a href="docs/i18n/README.th.md">ไทย</a> ·
  <a href="docs/i18n/README.tr.md">Türkçe</a> ·
  <a href="docs/i18n/README.id.md">Indonesia</a> ·
  <a href="docs/i18n/README.bn.md">বাংলা</a>
</p>

|             Home page              |             Chat view              |
| :--------------------------------: | :--------------------------------: |
| ![Home](docs/images/home-chat.png) | ![Chat](docs/images/chat-view.png) |

Legend Talk convenes 2–10 historical or contemporary thinkers into a multi-round debate. Each round, every voice argues from its own framework; a moderator then maps the disagreements and opens the next round. Socrates presses Munger's assumptions while Nietzsche challenges them both.

**Three ways in:**

- **Ask a question** — type a topic and AI assembles a 3–5 thinker panel built for productive tension.
- **Set the table** — hand-pick 2–10 thinkers yourself, or roll 5 at random.
- **Consult one mind** — go 1-on-1 with any of 161 thinkers, each reasoning through their own framework, not generic AI roleplay.

## Start a conversation

**Auto roundtable** — enter a topic in the input bar on the home page. AI picks 3–5 thinkers whose views genuinely conflict and starts the debate immediately, no character picking needed.

**Manual roundtable** — click **+** on 2–10 character cards to build a lineup. A floating bar shows your picks:

- Click an avatar to remove it
- **Start Discussion** to launch
- **Copy lineup link** to share the exact lineup as a URL

Or hit **🎲 Random** (top-right) to start instantly with 5 random thinkers.

**Featured templates** — 6 curated lineups whose perspectives genuinely clash (e.g. _AI & Tech_: Karpathy vs Ilya vs Feynman vs Taleb vs Paul Graham). One click to start, each with 3 suggested topics.

**1-on-1 chat** — click **Chat** on any character card for a private conversation in that thinker's voice and framework.

**Topic suggestions** — before your first message, every mode proposes topics to get you started: 3 curated questions per template (in all 18 languages), or 1 question drawn from each selected thinker in a manual lineup (updates as you add or remove people).

## Steer the discussion

You sit at the head of the table as the **chair** — the debate runs on your terms.

- **Moderator** — after each round, an AI moderator synthesizes it: groups claims by idea, names an angle the round left untouched, and poses an open question for the next one.
- **Refocus mid-debate** — send a message during a roundtable to redirect it. Instead of auto-running, an editable **focus card** appears; it stacks on top of any prior focus so earlier steers aren't lost. Refine it, then **Start** the next rounds anchored on it.
- **Apply & retry** — edit any message and regenerate from that point. Chair steers carry a focus snapshot, so a retry rebuilds from the exact focus state that was active when the message was sent.
- **Set rounds** — choose how many rounds the thinkers debate before pausing, and **Continue** to add more once they finish.
- **Add or remove participants** anytime — turn a 1-on-1 into a roundtable, or the reverse.
- **Stop** — cancel generation mid-stream; whatever was already written is kept.
- **Branch** — fork a new conversation from any message, carrying the prior context with it.

## Save, search & share

- **Summarize** — one-click AI summary extracting the core viewpoints and disagreements.
- **Search** — find anything across all conversations by title, thinker name, or message content.
- **Favorites** — star your most-used thinkers for quick access.
- **Share chat** — generate a URL containing the full conversation.
- **Export / Import** — save as Markdown or JSON and restore from JSON (in Settings), or generate share cards via [json2card](https://github.com/rockbenben/json2card) (set the API endpoint in Settings).
- **Settings sync** — move your setup to another device via URL; API keys are AES-encrypted.

## Run it yourself

```bash
npm install
npm run dev
```

Open http://localhost:5173, go to Settings, enter your API key, and start chatting. If you hit a CORS error, the app offers to enable a public proxy with one click — worth reading [what that means for your key](#cors-proxy) before you accept.

## Thinkers, models & platform

**161 preset thinkers** across 15 domains, sorted by fame — type any name to create a custom character on the fly.

**Models** — set the **thinking level** (off / low / medium / high), enter a **custom model ID**, or connect any **OpenAI-compatible API** as a custom provider. Default: DeepSeek V4 Flash.

**Platform** — 18 languages · dark mode · responsive · **local-first** (IndexedDB + localStorage dual-write, works in WeChat and restricted WebViews) · **zero CDN** (fonts self-hosted and bundled, so it works offline and behind firewalls).

## Deep links

Start a conversation straight from a URL:

- **By name:** `/#/chat?chars=苏格拉底,孔子` or `/#/chat?chars=Socrates,Confucius`
- **By ID:** `/#/chat?chars=socrates,confucius`
- **By category:** `/#/chat?category=philosophy` (roundtable of every thinker in that category, capped at 10)
- **Single chat:** `/#/chat?chars=socrates`
- **Custom names:** `/#/chat?chars=Ada Lovelace,Linus Torvalds` (unrecognized names become custom characters)

Categories: `philosophy`, `strategy`, `business`, `finance`, `history`, `sociology`, `psychology`, `science`, `literature`, `art`, `economics`, `politics`, `technology`, `religion`, `education`.

The **Copy lineup link** (participants bar) and **Copy category link** (category filter) buttons generate these URLs from the UI.

**Language routing** — prefix the URL with a language to set the UI language, e.g. `/#/ja/chat`, `/#/ko/chat?chars=socrates`, or use `?lang=zh`. All 18 languages supported.

## Supported APIs

24 providers out of the box — international, China-based, and aggregators:

| Provider                           | Models                                                                                              |
| ---------------------------------- | --------------------------------------------------------------------------------------------------- |
| OpenAI                             | GPT-5.5, GPT-5.4, GPT-5.4 Mini                                                                      |
| Anthropic                          | Claude Opus 4.7, Claude Sonnet 4.6, Claude Haiku 4.5                                                |
| Google Gemini                      | Gemini 3.1 Pro, Gemini 3.5 Flash                                                                    |
| xAI Grok                           | Grok 4.3, Grok 4.20 series                                                                          |
| Mistral / Cohere                   | Mistral Medium 3.5 / Large 3, Command A series                                                      |
| DeepSeek                           | DeepSeek V4 Flash, V4 Pro                                                                           |
| Moonshot / Kimi                    | Kimi K2.6, K2.5                                                                                     |
| Zhipu GLM                          | GLM-5.1, GLM-5, GLM-4.7 series                                                                      |
| MiniMax / Hunyuan / Qianfan / MiMo | MiniMax M2.7, Hunyuan 2.0, ERNIE 5.1, MiMo V2.5                                                     |
| Volcengine Coding Plan             | Doubao Seed 2.0, Kimi K2.5, GLM-4.7, DeepSeek V4                                                    |
| Alibaba Bailian Coding Plan        | Qwen 3.6 Max/Plus/Flash, Kimi K2.5, GLM-5                                                           |
| Aggregators                        | OpenRouter, SiliconFlow, Groq, Cerebras, Together, Fireworks, Perplexity, NVIDIA NIM, GitHub Models |

Every provider accepts custom model IDs, and the **Custom** option connects any OpenAI-compatible API.

## CORS proxy

Some providers block direct browser requests. The CORS proxy is configured per provider in Settings — toggle it on. A public proxy (`https://cors.api2026.workers.dev`) is used by default.

> **Worth knowing before you turn it on.** Everything else here is local-first, but a proxied request is not: your API key and the full prompt travel through that proxy on the way to the provider. The default one is operated by this project, but the same is true of any proxy — that's what a proxy is. If the key matters to you, deploy your own with the Worker below and point Settings at it; it takes about two minutes.

To run your own, deploy a [Cloudflare Worker](https://dash.cloudflare.com) with this code:

<details>
<summary>Worker code</summary>

```javascript
export default {
  async fetch(request) {
    const url = new URL(request.url);
    const targetUrl = url.pathname.slice(1) + url.search;
    if (!targetUrl || !targetUrl.startsWith("https://")) {
      return new Response("Usage: /https://target-api.com/path", { status: 400 });
    }
    if (request.method === "OPTIONS") {
      return new Response(null, {
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
          "Access-Control-Allow-Headers": "*",
          "Access-Control-Max-Age": "86400",
        },
      });
    }
    const response = await fetch(targetUrl, {
      method: request.method,
      headers: request.headers,
      body: request.body,
    });
    const newResponse = new Response(response.body, response);
    newResponse.headers.set("Access-Control-Allow-Origin", "*");
    return newResponse;
  },
};
```

</details>

## Development

```text
src/
  adapters/       # LLM API adapters (OpenAI-compatible, Anthropic)
  characters/     # Character presets and custom character generation
  components/     # React components
  hooks/          # useChat, useRoundtable
  i18n/           # Internationalization
  stores/         # Zustand state management
  utils/          # Prompt building, export, compression, storage
  types.ts        # Type definitions
```

**Stack:** React 19 · antd 6 (CSS-variables theme, deeply customized) · Vite · Tailwind CSS v4 · Zustand · i18next · React Router · TypeScript

| Command           | Description                         |
| ----------------- | ----------------------------------- |
| `npm run dev`     | Start dev server                    |
| `npm run build`   | Type-check and build for production |
| `npm run test`    | Run tests                           |
| `npm run preview` | Preview production build            |

## Deploy

Build and host the `dist/` folder on any static host (Vercel, Netlify, GitHub Pages, …):

```bash
npm run build
```

Routing is hash-based (`/#/chat/...`, `/#/ja/chat/...`), so no server-side routing config is needed.

## About the 365 Open Source Plan

Project **#002** of the [365 Open Source Plan](https://github.com/rockbenben/365opensource) — one person + AI, 300+ open-source projects in a year. [Submit your idea →](https://365.aishort.top/) · [Discord](https://discord.gg/PZTQfJ4GjX) · [Telegram](https://t.me/aishort_top)
