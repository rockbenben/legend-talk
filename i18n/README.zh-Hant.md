<h1 align="center">Legend Talk</h1>

<p align="center">
  365 開源計畫 #002 · 讓最偉大的思想家圍繞你的問題展開多輪 AI 圓桌辯論
</p>

<p align="center">
  <a href="../README.md">English</a> ·
  <a href="../README.zh.md">中文</a> ·
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
  <a href="README.id.md">Indonesia</a> ·
  <a href="README.bn.md">বাংলা</a>
</p>

把最偉大的思想家們請到一張桌上，讓他們圍繞你的問題展開辯論。

Legend Talk 是一個多輪 AI 圓桌討論工具——選 2-10 位歷史或當代名人，拋出一個問題，他們會自動展開多輪辯論，每個人回應其他人的觀點。蘇格拉底追問芒格的假設，尼采同時挑戰兩人。

也可以一對一：從 140+ 位思想家中選一位，用他們獨特的思維框架分析你的問題。

**在線體驗:** [talk.newzone.top](https://talk.newzone.top)

## 截圖

| 首頁 | 對話介面 |
|:-:|:-:|
| ![首頁](../docs/images/home-chat.png) | ![對話介面](../docs/images/chat-view.png) |

## 用法

### 一對一對話

點擊角色卡片上的 **對話** 按鈕，直接開始一對一聊天。思想家會用其獨特的思維框架回應你。

### 圓桌討論

點擊角色卡片上的 **+** 按鈕，將 2-10 位角色加入圓桌候選。底部會浮出選人欄：

- 點擊欄中的頭像可移除該角色
- 點擊 **開始討論** 發起圓桌辯論
- 點擊 **複製陣容連結** 生成分享 URL

也可以點擊 **🎲 隨機圓桌** 一鍵開始。

### 推薦圓桌

首頁展示 6 個精選圓桌模板——預選觀點真正衝突的思想家陣容。一鍵開桌。

### 對話中

- **停止生成** — 生成中隨時取消，已生成內容保留
- **加人 / 移人** — 隨時通過參與者欄調整
- **設置輪數** — 配置每次討論的輪數
- **繼續討論** — 追加更多輪
- **同陣容新開** — 以相同角色重新開始
- **總結對話** — AI 提煉核心觀點和分歧
- **分享對話** — 生成分享連結
- **匯出** — Markdown、JSON，或透過 [json2card](https://github.com/rockbenben/json2card) 生成分享卡片（需在設定中配置 API 端點）
- **匯入** — 從 JSON 恢復（設定頁）
- **分支** — 從任意訊息分叉新對話

### 連結直達對話

透過 URL 直接發起對話：

- **按名字:** `/#/chat?chars=Socrates,Confucius`
- **按 ID:** `/#/chat?chars=socrates,confucius`
- **按分類:** `/#/chat?category=philosophy`
- **單人對話:** `/#/chat?chars=socrates`
- **自訂名字:** `/#/chat?chars=Ada Lovelace,Linus Torvalds` (未識別的名字會自動建立自訂角色)

可用分類: `philosophy`, `strategy`, `business`, `finance`, `history`, `sociology`, `psychology`, `science`, `literature`, `art`, `economics`, `politics`, `technology`, `religion`, `education`

也可以在參與者欄點 **複製陣容連結** 或在分類篩選欄點複製連結從介面生成這些 URL。

**語言路由：** URL 中使用語言前綴可切換介面語言，如 `/#/ja/chat`。也支援查詢參數 `?lang=zh`。支援全部 18 種語言。

## 更多特性

除上述用法外，還支援：

- **140+ 位預設思想家** — 覆蓋 15 大領域，按知名度排序，支援自由輸入任意名字
- **自建角色** — 自訂名稱、頭像、系統提示詞
- **對話搜尋** — 按標題、角色名或訊息內容搜尋
- **角色收藏** — 星標常用角色
- **設定同步** — 通過 URL 同步到其他裝置（密鑰 AES 加密）
- **思考強度** — 配置模型思考深度
- **自訂模型** — 手動輸入任意模型 ID
- **自訂 LLM** — 接入任意 OpenAI 相容 API
- **多 API 支援** — OpenAI、Anthropic、DeepSeek、字節方舟、阿里百煉、矽基流動、Groq、OpenRouter
- **18 種語言** · **深色模式** · **響應式布局** · **本地優先**

## 支援的 API

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

所有服務商均支援自訂模型 ID。預設：DeepSeek Chat。也可通過「Custom」選項接入任意 OpenAI 相容 API。

## 快速開始

```bash
npm install
npm run dev
```

開啟 http://localhost:5173，進入設定頁面填入 API Key，即可開始對話。遇到 CORS 錯誤時，應用會提示一鍵啟用公共中轉。

## CORS 中轉

部分 API 不允許瀏覽器直接呼叫。在設定頁按服務商開關 CORS 中轉，預設使用公共節點。

如需自建中轉，建立 [Cloudflare Worker](https://dash.cloudflare.com) 並部署以下程式碼：

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

## 項目結構

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

## 技術棧

React 19, Vite, Tailwind CSS v4, Zustand, i18next, React Router, TypeScript

## 腳本

| 命令 | 說明 |
|------|------|
| `npm run dev` | 啟動開發伺服器 |
| `npm run build` | 類型檢查並建構生產版本 |
| `npm run test` | 執行測試 |
| `npm run preview` | 預覽生產建構 |

## 部署

建構後將 `dist/` 目錄部署到任意靜態託管平台（Vercel、Netlify、GitHub Pages 等）：

```bash
npm run build
```

使用 hash 路由（`/#/chat/...`），無需伺服端路由配置。

## 關於 365 開源計畫

本項目是 [365 開源計畫](https://github.com/rockbenben/365opensource) 的第 002 個項目。

一個人 + AI，一年 300+ 個開源項目。[提交你的需求 →](https://my.feishu.cn/share/base/form/shrcnI6y7rrmlSjbzkYXh6sjmzb)

## License

MIT
