<h1 align="center">Legend Talk</h1>

<p align="center">
  Piano Open Source 365 #002 · Tavola rotonda IA con i più grandi pensatori della storia
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
  <a href="README.ru.md">Русский</a> ·
  <a href="README.ar.md">العربية</a> ·
  <a href="README.hi.md">हिन्दी</a> ·
  <a href="README.vi.md">Tiếng Việt</a> ·
  <a href="README.th.md">ไทย</a> ·
  <a href="README.tr.md">Türkçe</a> ·
  <a href="README.id.md">Indonesia</a> ·
  <a href="README.bn.md">বাংলা</a>
</p>

Riunisci i più grandi pensatori e lascia che discutano il tuo problema.

Legend Talk è uno strumento di tavola rotonda IA multi-round — scegli 2-10 figure e guarda il dibattito.

Funziona anche come strumento 1 a 1: consulta più di 140 pensatori.

**Demo:** [talk.newzone.top](https://talk.newzone.top)

## Screenshot

| Home | Chat |
|:-:|:-:|
| ![Home](../docs/images/home-chat.png) | ![Chat](../docs/images/chat-view.png) |

## Utilizzo

### Chat 1 a 1

Clicca su **Chat** su qualsiasi carta.

### Tavola Rotonda

Clicca su **+** su 2-10 carte. O **🎲 Casuale** per 5 pensatori.

### Modelli

6 modelli con prospettive in conflitto.

### Suggerimenti di argomenti

Tutte le modalità tavola rotonda mostrano argomenti consigliati prima di inviare il primo messaggio:

- **Tavole rotonde con modello** — 3 domande adattate al tema di ogni modello (disponibili in tutte le 18 lingue)
- **Tavole rotonde manuali** — 1 domanda per personaggio selezionato (max. 5). Gli argomenti si aggiornano aggiungendo o rimuovendo personaggi.

### Durante la Conversazione

- **Stop** — annulla
- **Aggiungi/rimuovi partecipanti**
- **Imposta round**
- **Continua**
- **Ricomincia**
- **Riassumi**
- **Condividi**
- **Esporta** — Markdown, JSON o genera schede di condivisione tramite [json2card](https://github.com/rockbenben/json2card) (configura l'endpoint nelle Impostazioni)
- **Importa**
- **Biforca**

### Link Diretti

Avvia via URL:

- **Per nome:** `/#/chat?chars=Socrates,Confucius`
- **Per ID:** `/#/chat?chars=socrates,confucius`
- **Per categoria:** `/#/chat?category=philosophy`
- **Chat singola:** `/#/chat?chars=socrates`
- **Nomi personalizzati:** `/#/chat?chars=Ada Lovelace,Linus Torvalds` (i nomi non riconosciuti creano personaggi automaticamente)

Categorie disponibili: `philosophy`, `strategy`, `business`, `finance`, `history`, `sociology`, `psychology`, `science`, `literature`, `art`, `economics`, `politics`, `technology`, `religion`, `education`

Genera link anche dall'interfaccia.

**Routing linguistico:** Prefisso lingua nell'URL. 18 lingue.

## Altre Funzionalità

Oltre a quanto sopra:

- **140+ pensatori** in 15 domini
- **Personaggi personalizzati**
- **Ricerca** · **Preferiti** · **Sincronizzazione** (AES)
- **Livello pensiero** · **Modelli personalizzati** · **LLM personalizzato**
- **Multi-API**: OpenAI, Anthropic, DeepSeek + 5 altri
- **18 lingue** · **Modalità scura** · **Responsive** · **Local-first**

## API Supportate

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

Tutti supportano ID personalizzati. Default: DeepSeek Chat.

## Avvio Rapido

```bash
npm install
npm run dev
```

Apri http://localhost:5173, vai su Impostazioni, inserisci la chiave API.

## Proxy CORS

Alcuni provider bloccano le richieste dirette. Configura il proxy CORS per provider.

Per il tuo proxy, crea un [Cloudflare Worker](https://dash.cloudflare.com):

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

## Struttura del Progetto

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

## Stack Tecnologico

React 19, Vite, Tailwind CSS v4, Zustand, i18next, React Router, TypeScript

## Script

| Comando | Descrizione |
|---------|------------|
| `npm run dev` | Server di sviluppo |
| `npm run build` | Verifica tipi + build |
| `npm run test` | Esegui test |
| `npm run preview` | Anteprima build |

## Deploy

Compila e deploya `dist/` su hosting statico:

```bash
npm run build
```

Routing hash (`/#/chat/...`), nessuna configurazione server.

## Info sul Piano 365

Progetto #002 del [Piano Open Source 365](https://github.com/rockbenben/365opensource).

1 persona + IA, 300+ progetti open source in un anno. [Invia la tua idea →](https://my.feishu.cn/share/base/form/shrcnI6y7rrmlSjbzkYXh6sjmzb)

## License

MIT
