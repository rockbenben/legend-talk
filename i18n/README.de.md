<h1 align="center">Legend Talk</h1>

<p align="center">
  365 Open-Source-Plan #002 · KI-Rundtisch mit den größten Denkern der Geschichte
</p>

<p align="center">
  <a href="../README.md">English</a> ·
  <a href="../README.zh.md">中文</a> ·
  <a href="README.zh-Hant.md">繁體中文</a> ·
  <a href="README.ja.md">日本語</a> ·
  <a href="README.ko.md">한국어</a> ·
  <a href="README.es.md">Español</a> ·
  <a href="README.fr.md">Français</a> ·
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

Versammeln Sie die größten Denker der Welt und lassen Sie sie Ihr Problem diskutieren.

Legend Talk ist ein KI-Rundtisch-Tool mit mehreren Runden — wählen Sie 2-10 Persönlichkeiten und beobachten Sie die Debatte.

Funktioniert auch als 1-zu-1-Tool: Über 140 Denker zur Auswahl.

**Demo:** [talk.newzone.top](https://talk.newzone.top)

## Screenshots

| Startseite | Chat |
|:-:|:-:|
| ![Startseite](../docs/images/home-chat.png) | ![Chat](../docs/images/chat-view.png) |

## Nutzung

### 1-zu-1 Chat

Klicken Sie auf **Chat** auf einer Karte.

### Rundtisch

Klicken Sie auf **+** bei 2-10 Karten. Oder **🎲 Zufällig** für 5 Denker.

### Vorlagen

6 Rundtisch-Vorlagen mit widersprüchlichen Perspektiven.

### Während des Gesprächs

- **Stopp** — Generierung abbrechen
- **Teilnehmer hinzufügen/entfernen**
- **Runden einstellen**
- **Fortsetzen**
- **Neustart**
- **Zusammenfassen** — KI-Zusammenfassung
- **Teilen**
- **Exportieren** — Markdown oder JSON
- **Importieren** — aus JSON wiederherstellen
- **Verzweigen**

### Deep Links

Starten Sie über URL:

- **Nach Name:** `/#/chat?chars=Socrates,Confucius`
- **Nach ID:** `/#/chat?chars=socrates,confucius`
- **Nach Kategorie:** `/#/chat?category=philosophy`
- **Einzelchat:** `/#/chat?chars=socrates`
- **Eigene Namen:** `/#/chat?chars=Ada Lovelace,Linus Torvalds` (nicht erkannte Namen erstellen automatisch Charaktere)

Verfügbare Kategorien: `philosophy`, `strategy`, `business`, `finance`, `history`, `sociology`, `psychology`, `science`, `literature`, `art`, `economics`, `politics`, `technology`, `religion`, `education`

Links auch über die Oberfläche generierbar.

**Sprachrouting:** Sprachpräfix in der URL. 18 Sprachen.

## Weitere Funktionen

Zusätzlich:

- **140+ Denker** in 15 Bereichen
- **Eigene Charaktere**
- **Suche** · **Favoriten** · **Synchronisierung** (AES)
- **Denktiefe** · **Eigene Modelle** · **Eigenes LLM**
- **Multi-API**: OpenAI, Anthropic, DeepSeek + 5 weitere
- **18 Sprachen** · **Dunkler Modus** · **Responsive** · **Local-first**

## Unterstützte APIs

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

Alle unterstützen eigene Modell-IDs. Standard: DeepSeek Chat.

## Schnellstart

```bash
npm install
npm run dev
```

Öffnen Sie http://localhost:5173, gehen Sie zu Einstellungen, geben Sie Ihren API-Schlüssel ein.

## CORS-Proxy

Einige Anbieter blockieren direkte Browseranfragen. Konfigurieren Sie den CORS-Proxy pro Anbieter.

Für eigenen Proxy einen [Cloudflare Worker](https://dash.cloudflare.com) erstellen:

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

## Projektstruktur

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

## Technologie-Stack

React 19, Vite, Tailwind CSS v4, Zustand, i18next, React Router, TypeScript

## Skripte

| Befehl | Beschreibung |
|--------|-------------|
| `npm run dev` | Entwicklungsserver |
| `npm run build` | Typprüfung + Build |
| `npm run test` | Tests ausführen |
| `npm run preview` | Build-Vorschau |

## Deployment

Kompilieren und `dist/` auf statischem Hosting deployen:

```bash
npm run build
```

Hash-Routing (`/#/chat/...`), keine Serverkonfiguration nötig.

## Über den 365 Plan

Projekt #002 des [365 Open-Source-Plans](https://github.com/rockbenben/365opensource).

1 Person + KI, 300+ Open-Source-Projekte in einem Jahr. [Idee einreichen →](https://my.feishu.cn/share/base/form/shrcnI6y7rrmlSjbzkYXh6sjmzb)

## License

MIT
