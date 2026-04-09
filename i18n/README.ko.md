<h1 align="center">Legend Talk</h1>

<p align="center">
  365 오픈소스 계획 #002 · 위대한 사상가들의 AI 원탁 토론
</p>

<p align="center">
  <a href="../README.md">English</a> ·
  <a href="../README.zh.md">中文</a> ·
  <a href="README.zh-Hant.md">繁體中文</a> ·
  <a href="README.ja.md">日本語</a> ·
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

세계 최고의 사상가들을 한 방에 모아 당신의 문제를 토론하게 하세요.

Legend Talk은 다중 라운드 AI 원탁 토론 도구입니다. 2-10명의 역사적·현대적 인물을 선택하고 질문을 던지면 여러 라운드에 걸쳐 서로의 의견에 응답하며 토론합니다.

1대1 도구로도 사용 가능: 140명 이상의 사상가 중 한 명을 선택하여 상담할 수 있습니다.

**데모:** [talk.newzone.top](https://talk.newzone.top)

## 스크린샷

| 홈 | 채팅 화면 |
|:-:|:-:|
| ![홈](../docs/images/home-chat.png) | ![채팅 화면](../docs/images/chat-view.png) |

## 사용법

### 1대1 채팅

캐릭터 카드의 **채팅** 버튼을 클릭하여 1대1 대화를 시작합니다.

### 원탁 토론

캐릭터 카드의 **+** 버튼으로 2-10명을 선택합니다. 하단에 플로팅 바가 나타납니다.

**🎲 랜덤**으로 5명 랜덤 원탁도 가능합니다.

### 추천 템플릿

홈 페이지에 6개의 원탁 템플릿 — 관점이 진정으로 충돌하는 사상가 라인업.

### 추천 토픽

모든 원탁 모드에서 첫 메시지를 보내기 전에 추천 토픽이 표시됩니다:

- **템플릿 원탁** — 각 템플릿 테마에 맞는 3개의 질문 (18개 언어 지원)
- **수동 선택 원탁** — 선택한 캐릭터마다 1개의 질문 추출 (최대 5개). 캐릭터를 추가하거나 제거하면 토픽이 업데이트됩니다.

### 대화 중

- **중지** — 생성 취소
- **참가자 추가/제거**
- **라운드 설정**
- **계속** — 라운드 추가
- **재시작** — 같은 캐릭터로 새 대화
- **요약** — AI 요약
- **공유** — 공유 링크
- **내보내기** — Markdown, JSON 또는 [json2card](https://github.com/rockbenben/json2card)로 공유 카드 생성 (설정에서 API 엔드포인트 구성)
- **가져오기** — JSON에서 복원
- **브랜치** — 모든 메시지에서 새 대화

### 딥 링크

URL로 직접 대화 시작:

- **이름으로:** `/#/chat?chars=Socrates,Confucius`
- **ID로:** `/#/chat?chars=socrates,confucius`
- **카테고리로:** `/#/chat?category=philosophy`
- **단일 채팅:** `/#/chat?chars=socrates`
- **커스텀 이름:** `/#/chat?chars=Ada Lovelace,Linus Torvalds` (인식되지 않는 이름은 자동으로 커스텀 캐릭터 생성)

사용 가능한 카테고리: `philosophy`, `strategy`, `business`, `finance`, `history`, `sociology`, `psychology`, `science`, `literature`, `art`, `economics`, `politics`, `technology`, `religion`, `education`

UI에서도 링크를 생성할 수 있습니다.

**언어 라우팅:** URL에 언어 접두사 사용 (예: `/#/ja/chat`). `?lang=zh` 파라미터도 지원. 18개 언어 지원.

## 더 많은 기능

위의 사용법 외에도:

- **140+ 프리셋 사상가** — 15개 분야
- **커스텀 캐릭터**
- **대화 검색** · **즐겨찾기** · **설정 동기화** (AES)
- **사고 수준** · **커스텀 모델** · **커스텀 LLM**
- **다중 API**: OpenAI, Anthropic, DeepSeek 등 8개
- **18개 언어** · **다크 모드** · **반응형** · **로컬 우선**

## 지원 API

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

모든 제공업체에서 커스텀 모델 ID 지원. 기본값: DeepSeek Chat.

## 빠른 시작

```bash
npm install
npm run dev
```

http://localhost:5173을 열고 설정에서 API 키를 입력하세요.

## CORS 프록시

일부 API 제공업체는 브라우저 직접 요청을 차단합니다. 설정에서 제공업체별로 CORS 프록시를 켤 수 있습니다.

직접 배포하려면 [Cloudflare Worker](https://dash.cloudflare.com)를 만드세요:

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

## 프로젝트 구조

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

## 기술 스택

React 19, Vite, Tailwind CSS v4, Zustand, i18next, React Router, TypeScript

## 스크립트

| 명령 | 설명 |
|------|------|
| `npm run dev` | 개발 서버 시작 |
| `npm run build` | 타입 체크 + 프로덕션 빌드 |
| `npm run test` | 테스트 실행 |
| `npm run preview` | 프로덕션 빌드 미리보기 |

## 배포

`dist/` 폴더를 정적 호스팅(Vercel, Netlify, GitHub Pages 등)에 배포:

```bash
npm run build
```

해시 라우팅(`/#/chat/...`)을 사용하므로 서버 측 라우팅 설정이 필요 없습니다.

## 365 오픈소스 계획에 대해

본 프로젝트는 [365 오픈소스 계획](https://github.com/rockbenben/365opensource)의 #002 프로젝트입니다.

1인 + AI, 1년에 300+ 오픈소스 프로젝트. [아이디어 제출 →](https://my.feishu.cn/share/base/form/shrcnI6y7rrmlSjbzkYXh6sjmzb)

## License

MIT
