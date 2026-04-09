<h1 align="center">Legend Talk</h1>

<p align="center">
  365 オープンソース計画 #002 · 歴史上の偉大な思想家たちによるAI円卓討論
</p>

<p align="center">
  <a href="../README.md">English</a> ·
  <a href="../README.zh.md">中文</a> ·
  <a href="README.zh-Hant.md">繁體中文</a> ·
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

世界最高の思想家たちを一つの部屋に集め、あなたの問題について議論させましょう。

Legend Talk は複数ラウンドのAI円卓討論ツールです。2〜10人の歴史的・現代的人物を選び、質問を投げかけると、互いの意見に応答しながら複数ラウンドにわたって議論します。

1対1の思考ツールとしても使えます：140人以上の思想家から一人を選んで相談できます。

**デモ:** [talk.newzone.top](https://talk.newzone.top)

## スクリーンショット

| ホーム | チャット画面 |
|:-:|:-:|
| ![ホーム](../docs/images/home-chat.png) | ![チャット画面](../docs/images/chat-view.png) |

## 使い方

### 1対1チャット

キャラクターカードの **チャット** ボタンをクリックして1対1の会話を始めます。思想家は独自のフレームワークで応答します。

### 円卓討論

キャラクターカードの **+** ボタンで2〜10人を選択。下部にフローティングバーが表示されます：

- アバターをクリックして削除
- **討論開始** をクリック
- **ラインナップリンクをコピー**

**🎲 ランダム** でランダム5人の円卓も開始できます。

### おすすめテンプレート

ホームページに6つの円卓テンプレート — 視点が本当に対立する思想家の組み合わせ。ワンクリックで開始。

### おすすめトピック

すべてのラウンドテーブルモードで、最初のメッセージを送る前におすすめトピックが表示されます：

- **テンプレート円卓** — 各テンプレートのテーマに合わせた3つの質問（全18言語対応）
- **手動選択円卓** — 選択したキャラクターから1つずつ質問を抽出（最大5つ）。キャラクターの追加・削除に応じてトピックが更新されます。

### 会話中

- **停止** — 生成をキャンセル（生成済み内容は保持）
- **参加者の追加/削除**
- **ラウンド数の設定**
- **続行** — ラウンドを追加
- **リスタート** — 同じキャラクターで新しい会話
- **要約** — AIによる要約
- **共有** — 共有リンク生成
- **エクスポート** — Markdown、JSON、または [json2card](https://github.com/rockbenben/json2card) でシェアカードを生成（設定でAPIエンドポイントを設定）
- **インポート** — JSONから復元（設定ページ）
- **ブランチ** — 任意のメッセージから分岐

### ディープリンク

URLから直接会話を開始：

- **名前で:** `/#/chat?chars=Socrates,Confucius`
- **IDで:** `/#/chat?chars=socrates,confucius`
- **カテゴリで:** `/#/chat?category=philosophy`
- **1対1:** `/#/chat?chars=socrates`
- **カスタム名:** `/#/chat?chars=Ada Lovelace,Linus Torvalds` (認識されない名前は自動的にカスタムキャラクターを作成)

利用可能なカテゴリ: `philosophy`, `strategy`, `business`, `finance`, `history`, `sociology`, `psychology`, `science`, `literature`, `art`, `economics`, `politics`, `technology`, `religion`, `education`

UIからもリンクを生成できます。

**言語ルーティング：** URLに言語プレフィックスを使用（例：`/#/ja/chat`）。`?lang=zh` パラメータも対応。18言語対応。

## その他の機能

上記に加えて：

- **140+のプリセット思想家** — 15分野、知名度順
- **カスタムキャラクター** — 名前・アバター・プロンプトを自由設定
- **会話検索** · **お気に入り** · **設定同期**（AES暗号化）
- **思考レベル** · **カスタムモデル** · **カスタムLLM**
- **マルチAPI対応** — OpenAI、Anthropic、DeepSeek等8社
- **18言語** · **ダークモード** · **レスポンシブ** · **ローカルファースト**

## 対応API

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

全プロバイダーでカスタムモデルIDに対応。デフォルト：DeepSeek Chat。「Custom」オプションで任意のOpenAI互換APIも接続可能。

## クイックスタート

```bash
npm install
npm run dev
```

http://localhost:5173 を開き、設定ページでAPIキーを入力してチャットを開始。CORSエラーが出た場合、ワンクリックでプロキシを有効化できます。

## CORSプロキシ

一部のAPIプロバイダーはブラウザからの直接リクエストをブロックします。設定ページでプロバイダーごとにCORSプロキシを切り替えられます。

独自にデプロイする場合は [Cloudflare Worker](https://dash.cloudflare.com) を作成：

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

## プロジェクト構成

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

## 技術スタック

React 19, Vite, Tailwind CSS v4, Zustand, i18next, React Router, TypeScript

## スクリプト

| コマンド | 説明 |
|---------|------|
| `npm run dev` | 開発サーバー起動 |
| `npm run build` | 型チェック＋本番ビルド |
| `npm run test` | テスト実行 |
| `npm run preview` | 本番ビルドプレビュー |

## デプロイ

`dist/` フォルダを任意の静的ホスティング（Vercel、Netlify、GitHub Pages等）にデプロイ：

```bash
npm run build
```

ハッシュルーティング（`/#/chat/...`）使用のため、サーバー側の設定は不要。

## 365オープンソース計画について

本プロジェクトは [365オープンソース計画](https://github.com/rockbenben/365opensource) の第002号です。

1人 + AI、1年で300以上のオープンソースプロジェクト。[アイデアを提出 →](https://my.feishu.cn/share/base/form/shrcnI6y7rrmlSjbzkYXh6sjmzb)

## License

MIT
