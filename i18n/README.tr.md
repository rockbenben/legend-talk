<h1 align="center">Legend Talk</h1>

<p align="center">
  365 Açık Kaynak Planı #002 · Tarihin en büyük düşünürleriyle AI yuvarlak masa tartışması
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
  <a href="README.hi.md">हिन्दी</a> ·
  <a href="README.vi.md">Tiếng Việt</a> ·
  <a href="README.th.md">ไทย</a> ·
  <a href="README.id.md">Indonesia</a> ·
  <a href="README.bn.md">বাংলা</a>
</p>

Dünyanın en büyük düşünürlerini bir araya getirin ve probleminizi tartışmalarını izleyin.

Legend Talk çok turlu bir AI yuvarlak masa tartışma aracıdır — 2-10 figür seçin ve tartışmayı izleyin.

1'e 1 danışmanlık aracı olarak da çalışır: 140+ düşünüre danışın.

**Demo:** [talk.newzone.top](https://talk.newzone.top)

## Ekran Görüntüleri

| Ana Sayfa | Sohbet |
|:-:|:-:|
| ![Ana Sayfa](../docs/images/home-chat.png) | ![Sohbet](../docs/images/chat-view.png) |

## Kullanım

### 1'e 1 Sohbet

Herhangi bir karakter kartındaki **Sohbet** düğmesine tıklayın.

### Yuvarlak Masa

2-10 kartta **+** düğmesine tıklayın. Veya **🎲 Rastgele** ile 5 düşünür seçin.

### Şablonlar

6 hazır şablon ile gerçekten çatışan görüşler.

### Konu Önerileri

Tüm yuvarlak masa modları, ilk mesajınızı göndermeden önce önerilen konuları gösterir:

- **Şablon yuvarlak masalar** — Her şablonun temasına uygun 3 soru (18 dilde mevcut)
- **Manuel yuvarlak masalar** — Seçilen her karakterden 1 soru (maks. 5). Karakter ekleyip çıkardığınızda konular güncellenir.

### Konuşma Sırasında

- **Durdur** — üretimi iptal et
- **Katılımcı ekle/çıkar**
- **Tur sayısını ayarla**
- **Devam et**
- **Yeniden başlat**
- **Özetle** — AI özeti
- **Paylaş**
- **Dışa aktar** — Markdown, JSON veya [json2card](https://github.com/rockbenben/json2card) ile paylaşım kartı oluştur (Ayarlar'da API uç noktasını yapılandırın)
- **İçe aktar**
- **Dallandır**

### Doğrudan Bağlantılar

URL ile doğrudan başlatın:

- **İsimle:** `/#/chat?chars=Socrates,Confucius`
- **ID ile:** `/#/chat?chars=socrates,confucius`
- **Kategoriyle:** `/#/chat?category=philosophy`
- **Tekli sohbet:** `/#/chat?chars=socrates`
- **Özel isimler:** `/#/chat?chars=Ada Lovelace,Linus Torvalds` (tanınmayan isimler otomatik karakter oluşturur)

Mevcut kategoriler: `philosophy`, `strategy`, `business`, `finance`, `history`, `sociology`, `psychology`, `science`, `literature`, `art`, `economics`, `politics`, `technology`, `religion`, `education`

Arayüzden de bağlantı oluşturulabilir.

**Dil yönlendirme:** URL'de dil öneki. 18 dil.

## Diğer Özellikler

Yukarıdakilere ek olarak:

- **140+ düşünür** 15 alanda
- **Özel karakterler**
- **Arama** · **Favoriler** · **Senkronizasyon** (AES)
- **Düşünme seviyesi** · **Özel modeller** · **Özel LLM**
- **Çoklu API**: OpenAI, Anthropic, DeepSeek + 5 diğer
- **18 dil** · **Karanlık mod** · **Duyarlı** · **Yerel öncelikli**

## Desteklenen API'ler

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

Tümü özel model ID'lerini destekler. Varsayılan: DeepSeek Chat.

## Hızlı Başlangıç

```bash
npm install
npm run dev
```

http://localhost:5173 açın, Ayarlar'a gidin, API anahtarınızı girin.

## CORS Proxy

Bazı sağlayıcılar doğrudan istekleri engeller. Sağlayıcı başına CORS proxy ayarlayın.

Kendinizinkini dağıtmak için [Cloudflare Worker](https://dash.cloudflare.com) oluşturun:

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

## Proje Yapısı

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

## Teknoloji Yığını

React 19, Vite, Tailwind CSS v4, Zustand, i18next, React Router, TypeScript

## Komutlar

| Komut | Açıklama |
|-------|----------|
| `npm run dev` | Geliştirme sunucusu |
| `npm run build` | Tip kontrolü + derleme |
| `npm run test` | Testleri çalıştır |
| `npm run preview` | Derleme önizleme |

## Dağıtım

Derleyin ve `dist/`'i statik hostinge dağıtın:

```bash
npm run build
```

Hash yönlendirme (`/#/chat/...`), sunucu yapılandırması gereksiz.

## 365 Planı Hakkında

[365 Açık Kaynak Planı](https://github.com/rockbenben/365opensource)'nın #002 projesi.

1 kişi + AI, bir yılda 300+ açık kaynak proje. [Fikrinizi gönderin →](https://my.feishu.cn/share/base/form/shrcnI6y7rrmlSjbzkYXh6sjmzb)

## License

MIT
