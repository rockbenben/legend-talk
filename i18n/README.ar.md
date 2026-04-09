<h1 align="center">Legend Talk</h1>

<p align="center">
  خطة المصادر المفتوحة 365 #002 · طاولة مستديرة بالذكاء الاصطناعي مع أعظم مفكري التاريخ
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
  <a href="README.hi.md">हिन्दी</a> ·
  <a href="README.vi.md">Tiếng Việt</a> ·
  <a href="README.th.md">ไทย</a> ·
  <a href="README.tr.md">Türkçe</a> ·
  <a href="README.id.md">Indonesia</a> ·
  <a href="README.bn.md">বাংলা</a>
</p>

اجمع أعظم المفكرين في العالم ودعهم يناقشون مشكلتك.

Legend Talk أداة نقاش طاولة مستديرة بالذكاء الاصطناعي متعددة الجولات — اختر 2-10 شخصيات وشاهد النقاش.

تعمل أيضاً كأداة استشارة فردية: استشر أكثر من 140 مفكراً.

**عرض تجريبي:** [talk.newzone.top](https://talk.newzone.top)

## لقطات الشاشة

| الرئيسية | المحادثة |
|:-:|:-:|
| ![الرئيسية](../docs/images/home-chat.png) | ![المحادثة](../docs/images/chat-view.png) |

## الاستخدام

### محادثة فردية

انقر على **محادثة** في أي بطاقة شخصية.

### طاولة مستديرة

انقر على **+** في 2-10 بطاقات. أو **🎲 عشوائي** لـ 5 مفكرين.

### قوالب مميزة

6 قوالب طاولة مستديرة مع وجهات نظر متعارضة.

### اقتراحات المواضيع

تعرض جميع أوضاع الطاولة المستديرة مواضيع مقترحة قبل إرسال الرسالة الأولى:

- **طاولات مستديرة بقالب** — 3 أسئلة مصممة لموضوع كل قالب (متوفرة بجميع اللغات الـ 18)
- **طاولات مستديرة يدوية** — سؤال واحد من كل شخصية مختارة (بحد أقصى 5). تتحدث المواضيع تلقائياً عند إضافة أو إزالة شخصيات.

### أثناء المحادثة

- **إيقاف** — إلغاء التوليد
- **إضافة/إزالة المشاركين**
- **تعيين الجولات**
- **متابعة**
- **إعادة البدء**
- **تلخيص** — ملخص بالذكاء الاصطناعي
- **مشاركة**
- **تصدير** — Markdown أو JSON أو إنشاء بطاقات مشاركة عبر [json2card](https://github.com/rockbenben/json2card) (قم بتهيئة نقطة نهاية API في الإعدادات)
- **استيراد**
- **تفريع**

### روابط مباشرة

ابدأ محادثة عبر URL:

- **بالاسم:** `/#/chat?chars=Socrates,Confucius`
- **بالمعرف:** `/#/chat?chars=socrates,confucius`
- **بالفئة:** `/#/chat?category=philosophy`
- **محادثة فردية:** `/#/chat?chars=socrates`
- **أسماء مخصصة:** `/#/chat?chars=Ada Lovelace,Linus Torvalds` (الأسماء غير المعروفة تنشئ شخصيات تلقائياً)

الفئات المتاحة: `philosophy`, `strategy`, `business`, `finance`, `history`, `sociology`, `psychology`, `science`, `literature`, `art`, `economics`, `politics`, `technology`, `religion`, `education`

يمكنك أيضاً إنشاء الروابط من الواجهة.

**توجيه اللغة:** بادئة لغة في URL. 18 لغة.

## المزيد من الميزات

بالإضافة إلى ما سبق:

- **140+ مفكر** في 15 مجالاً
- **شخصيات مخصصة**
- **بحث** · **مفضلة** · **مزامنة** (AES)
- **مستوى التفكير** · **نماذج مخصصة** · **LLM مخصص**
- **متعدد API**: OpenAI، Anthropic، DeepSeek + 5 آخرين
- **18 لغة** · **وضع داكن** · **متجاوب** · **محلي أولاً**

## واجهات API المدعومة

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

جميعها تدعم معرفات مخصصة. الافتراضي: DeepSeek Chat.

## بداية سريعة

```bash
npm install
npm run dev
```

افتح http://localhost:5173، اذهب إلى الإعدادات، أدخل مفتاح API.

## وكيل CORS

بعض مقدمي الخدمة يحظرون الطلبات المباشرة. قم بتكوين وكيل CORS لكل مزود.

لنشر وكيلك الخاص، أنشئ [Cloudflare Worker](https://dash.cloudflare.com):

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

## هيكل المشروع

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

## المجموعة التقنية

React 19, Vite, Tailwind CSS v4, Zustand, i18next, React Router, TypeScript

## الأوامر

| الأمر | الوصف |
|-------|-------|
| `npm run dev` | خادم التطوير |
| `npm run build` | فحص الأنواع + البناء |
| `npm run test` | تشغيل الاختبارات |
| `npm run preview` | معاينة البناء |

## النشر

ابنِ وانشر مجلد `dist/` على أي استضافة ثابتة:

```bash
npm run build
```

يستخدم توجيه Hash (`/#/chat/...`)، لا حاجة لتكوين الخادم.

## حول خطة 365

هذا المشروع #002 من [خطة المصادر المفتوحة 365](https://github.com/rockbenben/365opensource).

شخص واحد + ذكاء اصطناعي، 300+ مشروع مفتوح المصدر في عام. [أرسل فكرتك →](https://my.feishu.cn/share/base/form/shrcnI6y7rrmlSjbzkYXh6sjmzb)

## License

MIT
