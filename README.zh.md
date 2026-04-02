<h1 align="center">Legend Talk</h1>

<p align="center">
  365 开源计划 #002 · 让最伟大的思想家围绕你的问题展开多轮 AI 圆桌辩论
</p>

<p align="center">
  <a href="./README.md">English</a> ·
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

把最伟大的思想家们请到一张桌上，让他们围绕你的问题展开辩论。

Legend Talk 是一个多轮 AI 圆桌讨论工具——选 2-10 位历史或当代名人，抛出一个问题，他们会自动展开多轮辩论，每个人回应其他人的观点。苏格拉底追问芒格的假设，尼采同时挑战两人。

也可以一对一：从 140+ 位思想家中选一位，用他们独特的思维框架分析你的问题。

**在线体验：** [talk.newzone.top](https://talk.newzone.top)

## 截图

| 首页 | 对话界面 |
|:-:|:-:|
| ![首页](docs/images/home-chat.png) | ![对话](docs/images/chat-view.png) |

## 用法

### 一对一对话

点击角色卡片上的 **对话** 按钮，直接开始一对一聊天。思想家会用其独特的思维框架回应你。

### 圆桌讨论

点击角色卡片上的 **+** 按钮，将 2-10 位角色加入圆桌候选。底部会浮出选人栏：

- 点击栏中的头像可移除该角色
- 点击 **开始讨论** 发起圆桌辩论
- 点击 **复制阵容链接** 生成该阵容的分享 URL

也可以点击右上角的 **🎲 随机圆桌**，一键随机 5 位思想家开始讨论。

### 推荐圆桌

首页展示 6 个精选圆桌模板——预选观点真正冲突的思想家阵容（如「哲学辩论」：苏格拉底 vs 孔子 vs 尼采 vs 佛陀 vs 马可·奥勒留）。一键开桌。

### 对话中

- **停止生成** — 生成中随时取消，已生成内容保留
- **加人 / 移人** — 随时通过参与者栏调整，一对一和圆桌可自由切换
- **设置轮数** — 配置每次讨论的轮数，讨论完毕后暂停等待你追问
- **继续讨论** — 讨论结束后可追加更多轮
- **同阵容新开** — 以相同角色重新开始一个新对话
- **总结对话** — 一键让 AI 提炼核心观点、分歧和结论
- **分享对话** — 生成包含完整对话内容的分享链接
- **导出** — 对话可导出为 Markdown、JSON，或通过 [json2card](https://github.com/rockbenben/json2card) 生成分享卡片（需在设置中配置 API 端点）
- **导入** — 在设置页从 JSON 文件恢复对话（支持去重合并）
- **分支** — 从任意消息处分叉出新对话，保留之前的上下文

### 链接直达对话

通过 URL 直接发起对话：

- **按名字：** `/#/chat?chars=苏格拉底,孔子` 或 `/#/chat?chars=Socrates,Confucius`
- **按 ID：** `/#/chat?chars=socrates,confucius`
- **按分类：** `/#/chat?category=philosophy`（以该分类下的所有角色开始圆桌讨论，上限 10 人）
- **单人对话：** `/#/chat?chars=苏格拉底`
- **自定义名字：** `/#/chat?chars=张三,李四`（未识别的名字会自动创建自定义角色）

可用分类：`philosophy`、`strategy`、`business`、`finance`、`history`、`sociology`、`psychology`、`science`、`literature`、`art`、`economics`、`politics`、`technology`、`religion`、`education`。

也可以在参与者栏点 **复制阵容链接** 或在分类筛选栏点 **复制分类圆桌链接** 直接从界面生成这些 URL，无需手动拼接。

**语言路由：** URL 中使用语言前缀可切换界面语言，如 `/#/ja/chat`、`/#/ko/chat?chars=socrates`。也支持查询参数 `?lang=zh`。支持全部 18 种语言。

## 更多特性

除上述用法外，还支持：

- **140+ 位预设思想家** — 覆盖 15 大领域，按知名度排序，支持自由输入任意名字
- **对话搜索** — 按标题、角色名或消息内容搜索历史对话
- **角色收藏** — 星标常用角色，置顶显示
- **设置同步** — 通过 URL 将设置同步到其他设备（密钥 AES 加密保护）
- **思考强度** — 配置模型思考深度（关闭/低/中/高）
- **自定义模型** — 手动输入任意模型 ID
- **自定义 LLM** — 接入任意 OpenAI 兼容 API
- **多 API 支持** — OpenAI、Anthropic、DeepSeek、字节方舟、阿里百炼、硅基流动、Groq、OpenRouter
- **18 种语言** · **深色模式** · **响应式布局** · **本地优先**（IndexedDB + localStorage 双写，兼容微信等受限 WebView）

## 支持的 API

| 服务商 | 模型 |
|--------|------|
| OpenAI | GPT-5.4、GPT-5.4 Mini/Nano、o4 Mini、o3、GPT-4.1 系列 |
| Anthropic | Claude Opus 4.6、Claude Sonnet 4.6、Claude Haiku 4.5 |
| DeepSeek | DeepSeek Chat、DeepSeek Reasoner |
| 字节方舟 | Doubao Seed 2.0 Pro、Doubao 1.5 系列、DeepSeek R1/V3 |
| 阿里百炼 | Qwen 3.5 Plus、Kimi K2.5、GLM-5、MiniMax M2.5 等 |
| 硅基流动 | DeepSeek V3/R1、Qwen 2.5 系列 |
| Groq | LLaMA 4 Scout/Maverick、DeepSeek R1 |
| OpenRouter | 通过 OpenRouter 目录接入任意模型 |

所有服务商均支持自定义模型 ID。默认：DeepSeek Chat。也可通过「Custom」选项接入任意 OpenAI 兼容 API。

## 快速开始

```bash
npm install
npm run dev
```

打开 http://localhost:5173，进入设置页面填入 API Key，即可开始对话。遇到 CORS 错误时，应用会提示一键启用公共中转。

## CORS 中转

部分 API 不允许浏览器直接调用。在设置页按服务商开关 CORS 中转，默认使用公共节点（`https://cors.api2026.workers.dev`）。

如需自建中转，创建 [Cloudflare Worker](https://dash.cloudflare.com) 并部署以下代码：

<details>
<summary>Worker 代码</summary>

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


## 项目结构

```
src/
  adapters/       # LLM API 适配器（OpenAI、Anthropic 等）
  characters/     # 角色预设和自定义角色生成
  components/     # React 组件
  hooks/          # useChat、useRoundtable
  i18n/           # 国际化
  stores/         # Zustand 状态管理
  utils/          # prompt 构建、导出、压缩、存储工具
  types.ts        # 类型定义
```

## 技术栈

React 19, Vite, Tailwind CSS v4, Zustand, i18next, React Router, TypeScript

## 脚本

| 命令 | 说明 |
|------|------|
| `npm run dev` | 启动开发服务器 |
| `npm run build` | 类型检查并构建生产版本 |
| `npm run test` | 运行测试 |
| `npm run preview` | 预览生产构建 |

## 部署

构建后将 `dist/` 目录部署到任意静态托管平台（Vercel、Netlify、GitHub Pages 等）：

```bash
npm run build
```

使用 hash 路由（`/#/chat/...`、`/#/ja/chat/...`），无需服务端路由配置。

## 关于 365 开源计划

本项目是 [365 开源计划](https://github.com/rockbenben/365opensource) 的第 002 个项目。

一个人 + AI，一年 300+ 个开源项目。[提交你的需求 →](https://my.feishu.cn/share/base/form/shrcnI6y7rrmlSjbzkYXh6sjmzb)

## License

MIT
