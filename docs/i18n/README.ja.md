<p align="center">
  <img src="../../public/logo.png" width="84" height="84" alt="Legend Talk logo" />
</p>

<h1 align="center">Legend Talk</h1>

<p align="center">
  歴史上の偉大な思想家たちによるAI円卓討論

[![365 开源计划 #002](https://img.shields.io/badge/365%20%E5%BC%80%E6%BA%90%E8%AE%A1%E5%88%92-%23002-1f6feb)](https://github.com/rockbenben/365opensource)
</p>

<p align="center">
  <a href="../../README.md">English</a> ·
  <a href="../../README.zh.md">简体中文</a> ·
  <a href="README.zh-Hant.md">繁體中文</a> ·
  <b>日本語</b> ·
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

> **歴史上の偉大な頭脳を一つのテーブルに集め、あなたの問題について議論させましょう。**

Legend Talk は2〜10人の歴史的・現代的思想家を集めて、複数ラウンドの討論を行います。各ラウンドでは、すべての声が自らのフレームワークから主張を展開し、その後モデレーターが意見の対立を整理して次のラウンドを開きます。ソクラテスがマンガーの前提を問い詰め、ニーチェがその両者に挑む——そんな議論が生まれます。

**3つの入り口:**

- **質問する** — トピックを入力すると、AIが生産的な緊張を生む3〜5人の思想家パネルを編成します。
- **テーブルを整える** — 2〜10人の思想家を自分で選ぶか、ランダムで5人を呼び出します。
- **一人の知性に相談する** — 161人の思想家の誰とでも1対1で対話。それぞれが汎用的なAIのロールプレイではなく、自身のフレームワークで思考します。

**デモ:** [talk.newzone.top](https://talk.newzone.top) — 18言語 · 無料 · ローカルファースト · 登録不要。

|                 ホーム                  |                 チャット画面                  |
| :-------------------------------------: | :-------------------------------------------: |
| ![ホーム](../../docs/images/home-chat.png) | ![チャット画面](../../docs/images/chat-view.png) |

## 会話を始める

**自動円卓** — ホームページの入力バーにトピックを入力します。AIが視点が本当に対立する3〜5人の思想家を選び、キャラクター選択なしで即座に討論を開始します。

**手動円卓** — 2〜10人のキャラクターカードの **+** をクリックしてラインナップを構成します。フローティングバーに選択中の思想家が表示されます：

- アバターをクリックして削除
- **討論開始** で開始
- **ラインナップリンクをコピー** で、その編成をURLとして共有

または右上の **🎲 ランダム** で、ランダムな5人の思想家と即座に開始できます。

**おすすめテンプレート** — 視点が本当に衝突する6つの厳選ラインナップ（例：_AI & テック_：Karpathy 対 Ilya 対 Feynman 対 Taleb 対 Paul Graham）。ワンクリックで開始でき、それぞれに3つのおすすめトピックが付属します。

**1対1チャット** — 任意のキャラクターカードの **チャット** をクリックすると、その思想家の声とフレームワークでプライベートな会話ができます。

**おすすめトピック** — 最初のメッセージを送る前に、すべてのモードで始めるためのトピックが提案されます：各テンプレートに3つの厳選質問（全18言語対応）、または手動ラインナップでは選択した各思想家から1つずつ抽出した質問（人物の追加・削除に応じて更新）。

## 議論を導く

あなたはテーブルの上座に座る **主席** として、討論を自らの裁量で進めます。

- **モデレーター** — 各ラウンド後、AIモデレーターがそれを統合します：主張をアイデアごとに分類し、そのラウンドが触れなかった視点を指摘し、次のラウンドに向けて開かれた問いを投げかけます。
- **討論中のリフォーカス** — 円卓の途中でメッセージを送って方向を変えられます。自動で進む代わりに、編集可能な **フォーカスカード** が現れます。これは以前のフォーカスの上に積み重なるため、過去の舵取りが失われません。内容を練り上げてから、それを軸に **開始** で次のラウンドを進めます。
- **適用してリトライ** — 任意のメッセージを編集し、その時点から再生成します。主席の舵取りはフォーカスのスナップショットを保持するため、リトライはそのメッセージが送られた時点で有効だった正確なフォーカス状態から再構築します。
- **ラウンド数の設定** — 思想家が一時停止するまでに討論するラウンド数を選択し、終了後に **続行** でさらに追加します。
- **参加者の追加・削除** — いつでも可能。1対1を円卓に変えたり、その逆も。
- **停止** — 生成を途中でキャンセル。すでに書かれた内容は保持されます。
- **ブランチ** — 任意のメッセージから新しい会話を分岐させ、それまでの文脈を引き継ぎます。

## 保存・検索・共有

- **要約** — ワンクリックのAI要約で、核心となる視点と意見の対立を抽出します。
- **検索** — タイトル、思想家名、メッセージ内容で、すべての会話を横断して検索します。
- **お気に入り** — よく使う思想家にスターを付けて素早くアクセス。
- **チャットを共有** — 会話全体を含むURLを生成します。
- **エクスポート / インポート** — Markdown または JSON として保存し、JSON から復元（設定ページ）、または [json2card](https://github.com/rockbenben/json2card) でシェアカードを生成（設定でAPIエンドポイントを設定）。
- **設定同期** — URLで別のデバイスへセットアップを移行。APIキーはAES暗号化されます。

## クイックスタート

```bash
npm install
npm run dev
```

http://localhost:5173 を開き、設定ページでAPIキーを入力してチャットを開始します。CORSエラーが出た場合、アプリがワンクリックで公開プロキシを有効化する選択肢を提示します。

## 思想家・モデル・プラットフォーム

**161人のプリセット思想家** — 15分野にわたり、知名度順。任意の名前を入力すれば、その場でカスタムキャラクターを作成できます。

**モデル** — **思考レベル**（オフ／低／中／高）を設定し、**カスタムモデルID** を入力するか、任意の **OpenAI互換API** をカスタムプロバイダーとして接続します。デフォルト：DeepSeek V4 Flash。

**プラットフォーム** — 18言語 · ダークモード · レスポンシブ · **ローカルファースト**（IndexedDB + localStorage の二重書き込み、WeChat や制限付きWebViewでも動作）· **CDNゼロ**（フォントは自己ホスト＆バンドル済みで、オフラインやファイアウォール内でも動作）。

## ディープリンク

URLから直接会話を開始：

- **名前で:** `/#/chat?chars=苏格拉底,孔子` または `/#/chat?chars=Socrates,Confucius`
- **IDで:** `/#/chat?chars=socrates,confucius`
- **カテゴリで:** `/#/chat?category=philosophy`（そのカテゴリのすべての思想家による円卓、最大10人）
- **1対1:** `/#/chat?chars=socrates`
- **カスタム名:** `/#/chat?chars=Ada Lovelace,Linus Torvalds`（認識されない名前は自動的にカスタムキャラクターになります）

カテゴリ: `philosophy`, `strategy`, `business`, `finance`, `history`, `sociology`, `psychology`, `science`, `literature`, `art`, `economics`, `politics`, `technology`, `religion`, `education`

**ラインナップリンクをコピー**（参加者バー）と **カテゴリリンクをコピー**（カテゴリフィルター）ボタンで、UIからこれらのURLを生成できます。

**言語ルーティング** — URLに言語プレフィックスを付けてUI言語を設定します。例：`/#/ja/chat`、`/#/ko/chat?chars=socrates`、または `?lang=zh` を使用。18言語すべてに対応。

## 対応API

24プロバイダーを標準搭載 — 海外、中国、アグリゲーター：

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

全プロバイダーでカスタムモデルIDに対応し、**Custom** オプションで任意のOpenAI互換APIを接続できます。

## CORSプロキシ

一部のプロバイダーはブラウザからの直接リクエストをブロックします。CORSプロキシは設定ページでプロバイダーごとに構成し、オンに切り替えます。デフォルトでは公開プロキシ（`https://cors.api2026.workers.dev`）が使用されます。

> **オンにする前に知っておくこと。** 他はすべてローカル優先ですが、プロキシ経由のリクエストはそうではありません——あなたの API キーとプロンプト全文が、プロバイダーに届く前にそのプロキシを通過します。既定のプロキシは本プロジェクトが運用していますが、どのプロキシでも事情は同じです。キーが重要なら、下の Worker で自分用を立てて設定でそちらを指してください。2 分ほどで済みます。

独自に運用する場合は、次のコードで [Cloudflare Worker](https://dash.cloudflare.com) をデプロイします：

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

## 開発

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

**技術スタック:** React 19 · antd 6（CSS変数テーマ、深くカスタマイズ）· Vite · Tailwind CSS v4 · Zustand · i18next · React Router · TypeScript

| コマンド          | 説明                   |
| ----------------- | ---------------------- |
| `npm run dev`     | 開発サーバー起動       |
| `npm run build`   | 型チェック＋本番ビルド |
| `npm run test`    | テスト実行             |
| `npm run preview` | 本番ビルドプレビュー   |

## デプロイ

`dist/` フォルダをビルドして、任意の静的ホスティング（Vercel、Netlify、GitHub Pages など）でホストします：

```bash
npm run build
```

ルーティングはハッシュベース（`/#/chat/...`、`/#/ja/chat/...`）のため、サーバー側のルーティング設定は不要です。

## 365オープンソース計画について

[365オープンソース計画](https://github.com/rockbenben/365opensource) の **#002** 番目のプロジェクト——一人 + AIで、1年に300以上のオープンソースプロジェクトを。[あなたのアイデアを投稿する →](https://365.aishort.top/) · [Discord](https://discord.gg/PZTQfJ4GjX) · [Telegram](https://t.me/aishort_top)