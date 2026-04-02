<h1 align="center">Legend Talk</h1>

<p align="center">
  365 ओपन सोर्स योजना #002 · इतिहास के महानतम विचारकों के साथ AI गोलमेज चर्चा
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
  <a href="README.vi.md">Tiếng Việt</a> ·
  <a href="README.th.md">ไทย</a> ·
  <a href="README.tr.md">Türkçe</a> ·
  <a href="README.id.md">Indonesia</a> ·
  <a href="README.bn.md">বাংলা</a>
</p>

दुनिया के महानतम विचारकों को इकट्ठा करें और उन्हें अपनी समस्या पर बहस करने दें।

Legend Talk एक बहु-दौर AI गोलमेज चर्चा उपकरण है — 2-10 विचारकों को चुनें और बहस देखें।

1-1 उपकरण के रूप में भी: 140+ विचारकों से परामर्श करें।

**डेमो:** [talk.newzone.top](https://talk.newzone.top)

## स्क्रीनशॉट

| होम | चैट |
|:-:|:-:|
| ![होम](../docs/images/home-chat.png) | ![चैट](../docs/images/chat-view.png) |

## उपयोग

### 1-1 चैट

किसी भी कार्ड पर **चैट** बटन क्लिक करें।

### गोलमेज

2-10 कार्ड पर **+** क्लिक करें। या **🎲 यादृच्छिक** से 5 विचारक।

### टेम्पलेट

6 तैयार गोलमेज टेम्पलेट जिनमें दृष्टिकोण टकराते हैं।

### बातचीत के दौरान

- **रोकें** — उत्पादन रद्द
- **प्रतिभागी जोड़ें/हटाएं**
- **दौर सेट करें**
- **जारी रखें**
- **पुनरारंभ**
- **सारांश** — AI सारांश
- **साझा करें**
- **निर्यात** — Markdown, JSON या [json2card](https://github.com/rockbenben/json2card) से शेयर कार्ड बनाएं (सेटिंग्स में API एंडपॉइंट कॉन्फ़िगर करें)
- **आयात**
- **शाखा**

### डीप लिंक

URL से सीधे शुरू करें:

- **नाम से:** `/#/chat?chars=Socrates,Confucius`
- **ID से:** `/#/chat?chars=socrates,confucius`
- **श्रेणी से:** `/#/chat?category=philosophy`
- **एकल चैट:** `/#/chat?chars=socrates`
- **कस्टम नाम:** `/#/chat?chars=Ada Lovelace,Linus Torvalds` (अज्ञात नाम स्वचालित चरित्र बनाते हैं)

उपलब्ध श्रेणियाँ: `philosophy`, `strategy`, `business`, `finance`, `history`, `sociology`, `psychology`, `science`, `literature`, `art`, `economics`, `politics`, `technology`, `religion`, `education`

UI से भी लिंक बना सकते हैं।

**भाषा रूटिंग:** URL में भाषा उपसर्ग। 18 भाषाएँ।

## अधिक सुविधाएँ

ऊपर के अलावा:

- **140+ विचारक** 15 क्षेत्रों में
- **कस्टम चरित्र**
- **खोज** · **पसंदीदा** · **सिंक** (AES)
- **सोच का स्तर** · **कस्टम मॉडल** · **कस्टम LLM**
- **मल्टी-API**: OpenAI, Anthropic, DeepSeek + 5 अन्य
- **18 भाषाएँ** · **डार्क मोड** · **रेस्पॉन्सिव** · **लोकल-फर्स्ट**

## समर्थित API

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

सभी कस्टम मॉडल ID सपोर्ट करते हैं। डिफ़ॉल्ट: DeepSeek Chat।

## त्वरित शुरुआत

```bash
npm install
npm run dev
```

http://localhost:5173 खोलें, सेटिंग्स में API कुंजी दर्ज करें।

## CORS प्रॉक्सी

कुछ प्रदाता सीधे अनुरोधों को ब्लॉक करते हैं। प्रदाता अनुसार CORS प्रॉक्सी कॉन्फ़िगर करें।

अपना प्रॉक्सी बनाने के लिए [Cloudflare Worker](https://dash.cloudflare.com) बनाएं:

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

## प्रोजेक्ट संरचना

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

## तकनीकी स्टैक

React 19, Vite, Tailwind CSS v4, Zustand, i18next, React Router, TypeScript

## स्क्रिप्ट

| कमांड | विवरण |
|-------|--------|
| `npm run dev` | डेव सर्वर |
| `npm run build` | टाइप चेक + बिल्ड |
| `npm run test` | टेस्ट |
| `npm run preview` | बिल्ड प्रीव्यू |

## डिप्लॉय

बिल्ड करें और `dist/` को स्टैटिक होस्टिंग पर डिप्लॉय करें:

```bash
npm run build
```

हैश रूटिंग (`/#/chat/...`), सर्वर कॉन्फ़िगरेशन अनावश्यक।

## 365 योजना के बारे में

यह [365 ओपन सोर्स योजना](https://github.com/rockbenben/365opensource) का #002 प्रोजेक्ट है।

1 व्यक्ति + AI, एक साल में 300+ ओपन सोर्स प्रोजेक्ट। [अपना आइडिया भेजें →](https://my.feishu.cn/share/base/form/shrcnI6y7rrmlSjbzkYXh6sjmzb)

## License

MIT
