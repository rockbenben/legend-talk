<p align="center">
  <img src="../../public/logo.png" width="84" height="84" alt="Legend Talk logo" />
</p>

<h1 align="center">Legend Talk</h1>

<p align="center">
  讓最偉大的思想家圍繞你的問題展開多輪 AI 圓桌辯論

[![365 開源計畫 #002](https://img.shields.io/badge/365%20%E9%96%8B%E6%BA%90%E8%A8%88%E7%95%AB-%23002-1f6feb)](https://github.com/rockbenben/365opensource)
</p>

<p align="center">
  <a href="../../README.md">English</a> ·
  <a href="../../README.zh.md">简体中文</a> ·
  <b>繁體中文</b> ·
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

> **把歷史上最偉大的頭腦請到同一張桌前，讓他們圍繞你的問題展開辯論。**

Legend Talk 是一個多輪 AI 圓桌討論工具——選 2–10 位歷史或當代名人，拋出一個問題，他們會展開多輪辯論：每輪裡每個人都從自己的思維框架出發，主持人隨後梳理分歧、開啟下一輪。蘇格拉底追問芒格的假設，尼采同時挑戰兩人。

**三種開場方式：**

- **拋出問題** — 輸入一個話題，AI 自動組一桌 3–5 位觀點形成張力的思想家。
- **自訂陣容** — 自己挑 2–10 位，或隨機來 5 位。
- **單獨請教** — 與 161 位思想家中的任意一位一對一，用他們獨有的思維框架分析，而非泛泛的 AI 扮演。

**在線體驗：** [talk.newzone.top](https://talk.newzone.top) —— 18 種語言 · 免費 · 本地優先 · 無需註冊。

|                 首頁                  |                 對話介面                  |
| :-----------------------------------: | :---------------------------------------: |
| ![首頁](../../docs/images/home-chat.png) | ![對話介面](../../docs/images/chat-view.png) |

## 發起對話

**自動圓桌** — 在首頁頂部輸入框輸入話題，AI 自動匹配 3–5 位觀點真正衝突的思想家，立即開始辯論，無需手動選人。

**手動圓桌** — 點擊角色卡片上的加人圖示，組建 2–10 人陣容。底部浮出選人欄：

- 點擊頭像即可移除該角色
- **開始討論** 發起圓桌
- **複製陣容連結** 把該陣容生成分享 URL

也可以點右上角 **🎲 隨機圓桌**，一鍵隨機 5 位思想家開場。

**推薦圓桌** — 首頁提供 6 個精選模板，陣容觀點真正衝突（如「AI 與科技」：Karpathy vs Ilya vs 費曼 vs 塔勒布 vs Paul Graham）。一鍵開桌，每個模板附 3 個推薦話題。

**一對一對話** — 點擊任意角色卡片上的 **對話** 按鈕，即可與該思想家用其語氣與框架私聊。

**推薦話題** — 發送第一條訊息前，每種模式都會給出話題：模板圓桌每個 3 個定制問題（支援全部 18 種語言）；手動圓桌則從每位所選角色各取 1 個問題（加減角色時自動更新）。

## 引導討論

你坐在桌子的主位，是這場辯論的 **主席**，討論按你的節奏走。

- **主持人** — 每輪結束後，AI 主持人綜合本輪：按議題歸類發言、指出本輪未觸及的角度、拋出下一輪的開放問題。
- **中途改向** — 討論途中發條訊息即可調整方向。它不會立刻跑輪次，而是彈出一張可編輯的 **討論焦點卡**；新焦點會疊加在上一次之上，先前的精修不丟。改好後點 **開始討論**，下一輪在新焦點上展開。
- **應用並重試** — 編輯任意訊息後從該處重新生成。主席的改向會帶上焦點快照，重試時會還原訊息發送當時的焦點狀態。
- **設定輪數** — 配置每次辯論的輪數，結束後暫停；**繼續討論** 可再追加幾輪。
- **加人 / 移人** — 隨時通過參與者欄調整，一對一與圓桌自由互換。
- **停止生成** — 生成中隨時取消，已寫出的內容保留。
- **分支** — 從任意訊息處分叉出新對話，並帶上之前的上下文。

## 保存、搜尋與分享

- **總結對話** — 一鍵讓 AI 提煉核心觀點與分歧。
- **搜尋** — 按標題、角色名或訊息內容檢索全部歷史對話。
- **收藏** — 星標常用思想家，快速取用。
- **分享對話** — 生成包含完整對話內容的連結。
- **匯出 / 匯入** — 匯出為 Markdown 或 JSON、從 JSON 恢復（設定頁），或透過 [json2card](https://github.com/rockbenben/json2card) 生成分享卡片（需在設定中配置 API 端點）。
- **設定同步** — 透過 URL 把配置同步到其他裝置，密鑰經 AES 加密。

## 快速開始

```bash
npm install
npm run dev
```

開啟 http://localhost:5173，進入設定頁填入 API Key，即可開始對話。遇到 CORS 錯誤時，應用會提示一鍵啟用公共中轉。

## 思想家、模型與平台

**161 位預設思想家**，覆蓋 15 大領域、按知名度排序——直接輸入任意名字即可即時建立自訂角色。

**模型** — 可設 **思考強度**（關閉 / 低 / 中 / 高）、手動填入 **自訂模型 ID**，或以自訂服務商接入任意 **OpenAI 相容 API**。預設：DeepSeek V4 Flash。

**平台** — 18 種語言 · 深色模式 · 響應式 · **本地優先**（IndexedDB + localStorage 雙寫，相容微信等受限 WebView）· **零 CDN**（字體全部自託管打包，離線與內網環境開箱即用）。

## 連結直達對話

透過 URL 直接發起對話：

- **按名字：** `/#/chat?chars=苏格拉底,孔子` 或 `/#/chat?chars=Socrates,Confucius`
- **按 ID：** `/#/chat?chars=socrates,confucius`
- **按分類：** `/#/chat?category=philosophy`（以該分類下所有角色開圓桌，上限 10 人）
- **單人對話：** `/#/chat?chars=苏格拉底`
- **自訂名字：** `/#/chat?chars=张三,李四`（未識別的名字會自動建立自訂角色）

可用分類：`philosophy`、`strategy`、`business`、`finance`、`history`、`sociology`、`psychology`、`science`、`literature`、`art`、`economics`、`politics`、`technology`、`religion`、`education`。

參與者欄的 **複製陣容連結** 與分類篩選欄的 **複製分類圓桌連結** 可直接從介面生成這些 URL。

**語言路由** — URL 加語言前綴即可切換介面語言，如 `/#/ja/chat`、`/#/ko/chat?chars=socrates`，也支援 `?lang=zh`。支援全部 18 種語言。

## 支援的 API

開箱即用 24 家服務商——國際、國內與聚合平台：

| 服務商                            | 模型                                                                                             |
| --------------------------------- | ------------------------------------------------------------------------------------------------ |
| OpenAI                            | GPT-5.5、GPT-5.4、GPT-5.4 Mini                                                                   |
| Anthropic                         | Claude Opus 4.7、Claude Sonnet 4.6、Claude Haiku 4.5                                             |
| Google Gemini                     | Gemini 3.1 Pro、Gemini 3.5 Flash                                                                 |
| xAI Grok                          | Grok 4.3、Grok 4.20 系列                                                                         |
| Mistral / Cohere                  | Mistral Medium 3.5 / Large 3、Command A 系列                                                     |
| DeepSeek                          | DeepSeek V4 Flash、V4 Pro                                                                        |
| 月之暗面 Kimi                     | Kimi K2.6、K2.5                                                                                  |
| 智譜 GLM                          | GLM-5.1、GLM-5、GLM-4.7 系列                                                                     |
| MiniMax / 混元 / 千帆 / 小米 MiMo | MiniMax M2.7、混元 2.0、文心 5.1、MiMo V2.5                                                      |
| 字節方舟 Coding Plan              | Doubao Seed 2.0、Kimi K2.5、GLM-4.7、DeepSeek V4                                                 |
| 阿里百煉 Coding Plan              | Qwen 3.6 Max/Plus/Flash、Kimi K2.5、GLM-5                                                        |
| 聚合平台                          | OpenRouter、矽基流動、Groq、Cerebras、Together、Fireworks、Perplexity、NVIDIA NIM、GitHub Models |

所有服務商均支援自訂模型 ID，「Custom」選項可接入任意 OpenAI 相容 API。

## CORS 中轉

部分服務商不允許瀏覽器直接呼叫。在設定頁按服務商開關 CORS 中轉即可，預設使用公共節點（`https://cors.api2026.workers.dev`）。

> **開之前值得知道**：其餘部分都是本地優先，但走中轉的請求不是——你的 API key 和完整 prompt 會經過該節點再轉發給服務商。預設節點由本專案維護，但換成任何中轉都一樣，這是中轉的本質。若你在意這個 key，用下面的 Worker 自建一個、在設定裡指過去即可，大約兩分鐘。

如需自建，部署一個 [Cloudflare Worker](https://dash.cloudflare.com) 並填入以下程式碼：

<details>
<summary>Worker 代碼</summary>

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

## 開發

```text
src/
  adapters/       # LLM API 適配器（OpenAI 相容、Anthropic）
  characters/     # 角色預設和自訂角色生成
  components/     # React 組件
  hooks/          # useChat、useRoundtable
  i18n/           # 國際化
  stores/         # Zustand 狀態管理
  utils/          # prompt 構建、匯出、壓縮、儲存工具
  types.ts        # 類型定義
```

**技術棧：** React 19 · antd 6（CSS 變數主題深度定制）· Vite · Tailwind CSS v4 · Zustand · i18next · React Router · TypeScript

| 命令              | 說明                   |
| ----------------- | ---------------------- |
| `npm run dev`     | 啟動開發伺服器         |
| `npm run build`   | 類型檢查並建構生產版本 |
| `npm run test`    | 執行測試               |
| `npm run preview` | 預覽生產建構           |

## 部署

建構後將 `dist/` 部署到任意靜態託管（Vercel、Netlify、GitHub Pages 等）：

```bash
npm run build
```

使用 hash 路由（`/#/chat/...`、`/#/ja/chat/...`），無需伺服端路由配置。

## 關於 365 開源計劃

[365 開源計劃](https://github.com/rockbenben/365opensource) 的第 **#002** 個專案——一人 + AI，一年 300+ 個開源專案。[提交你的點子 →](https://365.aishort.top/) · [Discord](https://discord.gg/PZTQfJ4GjX) · [Telegram](https://t.me/aishort_top)