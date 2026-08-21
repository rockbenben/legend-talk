<p align="center">
  <img src="public/logo.png" width="84" height="84" alt="Legend Talk logo" />
</p>

<h1 align="center">Legend Talk</h1>

<p align="center">
  让最伟大的思想家围绕你的问题展开多轮 AI 圆桌辩论
</p>

<p align="center">
  <b><a href="https://talk.newzone.top/">▶ 在线试用</a></b> —— 18 种语言 · 免费 · 本地优先 · 无需注册
  <br>
  <a href="LICENSE"><img src="https://img.shields.io/badge/license-MIT-green.svg" alt="License: MIT"></a>
  <a href="https://github.com/rockbenben/365opensource"><img src="https://img.shields.io/badge/365%20%E5%BC%80%E6%BA%90%E8%AE%A1%E5%88%92-%23002-1f6feb" alt="365 开源计划 #002"></a>
</p>

<p align="center">
  <a href="README.md">English</a> ·
  <b>简体中文</b> ·
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

|                首页                |              对话界面              |
| :--------------------------------: | :--------------------------------: |
| ![首页](docs/images/home-chat.png) | ![对话](docs/images/chat-view.png) |

Legend Talk 是一个多轮 AI 圆桌讨论工具——选 2–10 位历史或当代名人，抛出一个问题，他们会展开多轮辩论：每轮里每个人都从自己的思维框架出发，主持人随后梳理分歧、开启下一轮。苏格拉底追问芒格的假设，尼采同时挑战两人。

**三种开场方式：**

- **抛出问题** — 输入一个话题，AI 自动组一桌 3–5 位观点有冲突的思想家。
- **自定阵容** — 自己挑 2–10 位，或随机来 5 位。
- **单独请教** — 与 161 位思想家中的任意一位一对一，用他们独有的思维框架分析，而非泛泛的 AI 扮演。

## 发起对话

**自动圆桌** — 在首页顶部输入框输入话题，AI 自动匹配 3–5 位观点真正冲突的思想家，立即开始辩论，无需手动选人。

**手动圆桌** — 点击角色卡片上的加人图标，组建 2–10 人阵容。底部浮出选人栏：

- 点击头像即可移除该角色
- **开始讨论** 发起圆桌
- **复制阵容链接** 把该阵容生成分享 URL

也可以点右上角 **🎲 随机圆桌**，一键随机 5 位思想家开场。

**推荐圆桌** — 首页提供 6 个精选模板，阵容观点真正冲突（如「AI 与科技」：Karpathy vs Ilya vs 费曼 vs 塔勒布 vs Paul Graham）。一键开桌，每个模板附 3 个推荐话题。

**一对一对话** — 点击任意角色卡片上的 **对话** 按钮，即可与该思想家用其语气与框架私聊。

**推荐话题** — 发送第一条消息前，每种模式都会给出话题：模板圆桌每个 3 个定制问题（支持全部 18 种语言）；手动圆桌则从每位所选角色各取 1 个问题（加减角色时自动更新）。

## 引导讨论

你坐在桌子的主位，是这场辩论的 **主席**，讨论按你的节奏走。

- **主持人** — 每轮结束后，AI 主持人综合本轮：按议题归类发言、指出本轮未触及的角度、抛出下一轮的开放问题。
- **中途改向** — 讨论途中发条消息即可调整方向。它不会立刻跑轮次，而是弹出一张可编辑的 **讨论焦点卡**；新焦点会叠加在上一次之上，先前的精修不丢。改好后点 **开始讨论**，下一轮在新焦点上展开。
- **应用并重试** — 编辑任意消息后从该处重新生成。主席的改向会带上焦点快照，重试时会还原消息发送当时的焦点状态。
- **设置轮数** — 配置每次辩论的轮数，结束后暂停；**继续讨论** 可再追加几轮。
- **加人 / 移人** — 随时通过参与者栏调整，一对一与圆桌自由互换。
- **停止生成** — 生成中随时取消，已写出的内容保留。
- **分支** — 从任意消息处分叉出新对话，并带上之前的上下文。

## 保存、搜索与分享

- **总结对话** — 一键让 AI 提炼核心观点与分歧。
- **搜索** — 按标题、角色名或消息内容检索全部历史对话。
- **收藏** — 星标常用思想家，快速取用。
- **分享对话** — 生成包含完整对话内容的链接。
- **导出 / 导入** — 导出为 Markdown 或 JSON、从 JSON 恢复（设置页），或通过 [json2card](https://github.com/rockbenben/json2card) 生成分享卡片（需在设置中配置 API 端点）。
- **设置同步** — 通过 URL 把配置同步到其他设备，密钥经 AES 加密。

## 自己跑起来

```bash
npm install
npm run dev
```

打开 http://localhost:5173，进入设置页填入 API Key，即可开始对话。遇到 CORS 错误时，应用会提示一键启用公共中转——同意之前建议先看一眼[这对你的 key 意味着什么](#cors-中转)。

## 思想家、模型与平台

**161 位预设思想家**，覆盖 15 大领域、按知名度排序——直接输入任意名字即可即时创建自定义角色。

**模型** — 可设 **思考强度**（关闭 / 低 / 中 / 高）、手动填入 **自定义模型 ID**，或以自定义服务商接入任意 **OpenAI 兼容 API**。默认：DeepSeek V4 Flash。思考控件只对真正支持思考的模型出现；没有关闭档的服务商（Gemini、Grok、Groq、Cerebras、Moonshot）最低一档标为 **Min** 而不是「关闭」——它仍在推理、仍在计费，写「关闭」就是撒谎。

**平台** — 18 种语言 · 深色模式 · 响应式 · **本地优先**（IndexedDB + localStorage 双写，兼容微信等受限 WebView）· **零 CDN**（字体全部自托管打包，离线与内网环境开箱即用）。

## 链接直达对话

通过 URL 直接发起对话：

- **按名字：** `/#/chat?chars=苏格拉底,孔子` 或 `/#/chat?chars=Socrates,Confucius`
- **按 ID：** `/#/chat?chars=socrates,confucius`
- **按分类：** `/#/chat?category=philosophy`（以该分类下所有角色开圆桌，上限 10 人）
- **单人对话：** `/#/chat?chars=苏格拉底`
- **自定义名字：** `/#/chat?chars=张三,李四`（未识别的名字会自动创建自定义角色）

可用分类：`philosophy`、`strategy`、`business`、`finance`、`history`、`sociology`、`psychology`、`science`、`literature`、`art`、`economics`、`politics`、`technology`、`religion`、`education`。

参与者栏的 **复制阵容链接** 与分类筛选栏的 **复制分类圆桌链接** 可直接从界面生成这些 URL。

**语言路由** — URL 加语言前缀即可切换界面语言，如 `/#/ja/chat`、`/#/ko/chat?chars=socrates`。支持全部 18 种语言。

## 支持的 API

开箱即用 25 家服务商——国际、国内与聚合平台：

- **海外** — OpenAI · Anthropic · Google Gemini · xAI Grok · Mistral · Cohere
- **国内** — DeepSeek · 通义千问 · 月之暗面 Kimi · 豆包 · 小米 MiMo · 智谱 GLM · MiniMax · 阶跃星辰 · 百度千帆 · 腾讯 TokenHub · 字节方舟 Coding Plan · 阿里百炼 Coding Plan
- **聚合与托管** — OpenRouter · OpenCode Zen · Groq · Cerebras · SiliconFlow · AtlasCloud · NVIDIA NIM

各服务商的模型列表在「设置」里实时可见——模型 ID 变动太快，此处不再镜像。

通义千问、小米 MiMo、月之暗面、智谱、MiniMax、腾讯 TokenHub 的地域节点可一键切换。除此之外，**每一家**（含 Anthropic 与 Gemini）都有一个自由填写的端点框——哪家上游会拦浏览器无法预判。端点与 CORS 中转是两件独立的事：可以指向自建网关而仍然直连，也可以走官方地址而经中转。

所有服务商均支持自定义模型 ID。**本地跑模型**：「Custom」接入任意 OpenAI 兼容地址，并为 LM Studio、Ollama、llama.cpp、LiteLLM、Together AI、Fireworks AI 各准备了一键起步地址与各自的文档链接。本地服务无需 API key——对它们而言地址就是凭据，key 一栏可以留空。

## CORS 中转

部分服务商不发 CORS 响应头，浏览器直连不到。中转在设置里按服务商开关，默认使用公共节点（`https://cors.api2026.workers.dev`）。

**需要它的那几家已经默认开着** —— OpenCode Zen、腾讯 TokenHub、NVIDIA NIM 与两个 Coding Plan —— 因为关着它们根本不工作。其余一律默认直连。

> **无论是你打开的，还是你发现它已经开着。** 其余部分都是本地优先，走中转的请求不是：你的 API key 与完整 prompt 会经过它再到服务商。它拿这些做什么才是关键，所以说具体点：只转发，此外什么都不做 —— 整条请求路径是一次透传 `fetch`，没有日志、不写任何存储（[自己看](scripts/cors-proxy-worker.js)，很短）。而且只转发该文件里声明过的 host，不是可以被别人指向任意目标的开放代理。
>
> 这些都不改变一个事实：请求确实经过了一台本项目运营的机器。若你在意这个 key，自建一个 —— 大约两分钟。

如需自建，部署一个 [Cloudflare Worker](https://dash.cloudflare.com) 并填入以下代码，然后在设置里指过去：

[`scripts/cors-proxy-worker.js`](scripts/cors-proxy-worker.js)

## 开发

```text
src/
  adapters/       # LLM API 适配器（OpenAI 兼容，另有原生 Anthropic 与 Gemini）
  characters/     # 角色预设和自定义角色生成
  components/     # React 组件
  hooks/          # useChat、useRoundtable
  i18n/           # 国际化
  pages/          # 路由页面：ChatPage、SettingsView、SharedView
  stores/         # Zustand 状态管理
  utils/          # prompt 构建、导出、压缩、存储工具
  types.ts        # 类型定义
```

**技术栈：** React 19 · antd 6（CSS 变量主题深度定制）· Vite · Tailwind CSS v4 · Zustand · i18next · React Router · TypeScript

| 命令              | 说明                   |
| ----------------- | ---------------------- |
| `npm run dev`     | 启动开发服务器         |
| `npm run build`   | 类型检查并构建生产版本 |
| `npm run test`    | 运行测试               |
| `npm run preview` | 预览生产构建           |

## 部署

构建后将 `dist/` 部署到任意静态托管（Vercel、Netlify、GitHub Pages 等）：

```bash
npm run build
```

使用 hash 路由（`/#/chat/...`、`/#/ja/chat/...`），无需服务端路由配置。

## 关于 365 开源计划

[365 开源计划](https://github.com/rockbenben/365opensource) 的第 **#002** 个项目——一个人 + AI，一年 300+ 个开源项目。[提交你的需求 →](https://365.aishort.top/) · [Discord](https://discord.gg/PZTQfJ4GjX) · [Telegram](https://t.me/aishort_top)
