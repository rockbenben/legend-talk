<p align="center">
  <img src="../../public/logo.png" width="84" height="84" alt="Legend Talk logo" />
</p>

<h1 align="center">Legend Talk</h1>

<p align="center">
  Piano Open Source 365 #002 · Tavola rotonda IA con i più grandi pensatori della storia
</p>

<p align="center">
  <a href="../../README.md">English</a> ·
  <a href="../../README.zh.md">简体中文</a> ·
  <a href="README.zh-Hant.md">繁體中文</a> ·
  <a href="README.ja.md">日本語</a> ·
  <a href="README.ko.md">한국어</a> ·
  <a href="README.es.md">Español</a> ·
  <a href="README.fr.md">Français</a> ·
  <a href="README.de.md">Deutsch</a> ·
  <a href="README.pt.md">Português</a> ·
  <b>Italiano</b> ·
  <a href="README.ru.md">Русский</a> ·
  <a href="README.ar.md">العربية</a> ·
  <a href="README.hi.md">हिन्दी</a> ·
  <a href="README.vi.md">Tiếng Việt</a> ·
  <a href="README.th.md">ไทย</a> ·
  <a href="README.tr.md">Türkçe</a> ·
  <a href="README.id.md">Indonesia</a> ·
  <a href="README.bn.md">বাংলা</a>
</p>

> **Riunisci i più grandi pensatori della storia a un'unica tavola e lascia che discutano il tuo problema.**

Legend Talk convoca da 2 a 10 pensatori storici o contemporanei in un dibattito multi-round. A ogni round, ogni voce argomenta dal proprio quadro di pensiero; un moderatore mappa poi i disaccordi e apre il round successivo. Socrate incalza le ipotesi di Munger mentre Nietzsche sfida entrambi.

**Tre modi per iniziare:**

- **Poni una domanda** — scrivi un argomento e l'IA assembla un panel di 3-5 pensatori costruito per generare una tensione produttiva.
- **Apparecchia la tavola** — scegli a mano da 2 a 10 pensatori, oppure tirane 5 a caso.
- **Consulta una sola mente** — vai 1 a 1 con uno qualsiasi dei 161 pensatori, ciascuno dei quali ragiona attraverso il proprio quadro di pensiero, non un generico role-play IA.

**Demo:** [talk.newzone.top](https://talk.newzone.top) — 18 lingue · gratis · local-first · senza registrazione.

|                 Home                  |                 Chat                  |
| :-----------------------------------: | :-----------------------------------: |
| ![Home](../../docs/images/home-chat.png) | ![Chat](../../docs/images/chat-view.png) |

## Avvia una conversazione

**Tavola rotonda automatica** — inserisci un argomento nella barra di input della home page. L'IA sceglie 3-5 pensatori le cui visioni sono realmente in conflitto e avvia subito il dibattito, senza bisogno di selezionare personaggi.

**Tavola rotonda manuale** — clicca su **+** su 2-10 carte personaggio per comporre una formazione. Una barra fluttuante mostra le tue scelte:

- Clicca su un avatar per rimuoverlo
- **Avvia discussione** per lanciare
- **Copia link formazione** per condividere la formazione esatta come URL

Oppure premi **🎲 Casuale** (in alto a destra) per iniziare all'istante con 5 pensatori casuali.

**Modelli in evidenza** — 6 formazioni curate le cui prospettive sono realmente in conflitto (es. _IA & Tech_: Karpathy vs Ilya vs Feynman vs Taleb vs Paul Graham). Un clic per iniziare, ciascuna con 3 argomenti suggeriti.

**Chat 1 a 1** — clicca su **Chat** su qualsiasi carta personaggio per una conversazione privata con la voce e il quadro di pensiero di quel pensatore.

**Suggerimenti di argomenti** — prima del tuo primo messaggio, ogni modalità propone argomenti per iniziare: 3 domande curate per modello (in tutte le 18 lingue), oppure 1 domanda tratta da ciascun pensatore selezionato in una formazione manuale (si aggiornano man mano che aggiungi o rimuovi persone).

## Guida la discussione

Siedi a capotavola come **presidente** (chair) — il dibattito procede alle tue condizioni.

- **Moderatore** — dopo ogni round, un moderatore IA lo sintetizza: raggruppa le affermazioni per idea, nomina un angolo che il round ha lasciato intatto e pone una domanda aperta per quello successivo.
- **Rifocalizza a metà dibattito** — invia un messaggio durante una tavola rotonda per reindirizzarla. Invece di avviarsi automaticamente, compare una **scheda di focus** modificabile; si impila sopra qualsiasi focus precedente, così i reindirizzamenti anteriori non vanno persi. Affinala, poi premi **Avvia** per ancorare i round successivi su di essa.
- **Applica e riprova** — modifica qualsiasi messaggio e rigenera da quel punto. I reindirizzamenti del presidente portano con sé uno snapshot del focus, così una nuova generazione ricostruisce dall'esatto stato di focus attivo quando il messaggio è stato inviato.
- **Imposta i round** — scegli quanti round i pensatori dibattono prima di una pausa, e **Continua** per aggiungerne altri al termine.
- **Aggiungi o rimuovi partecipanti** in qualsiasi momento — trasforma una chat 1 a 1 in una tavola rotonda, o viceversa.
- **Stop** — annulla la generazione a metà stream; tutto ciò che è già stato scritto viene conservato.
- **Biforca** — crea una nuova conversazione a partire da qualsiasi messaggio, portando con sé il contesto precedente.

## Salva, cerca e condividi

- **Riassumi** — riassunto IA con un clic che estrae i punti di vista e i disaccordi fondamentali.
- **Ricerca** — trova qualsiasi cosa in tutte le conversazioni per titolo, nome del pensatore o contenuto del messaggio.
- **Preferiti** — metti tra i preferiti i pensatori che usi di più per un accesso rapido.
- **Condividi chat** — genera un URL che contiene l'intera conversazione.
- **Esporta / Importa** — salva come Markdown o JSON e ripristina da JSON (nelle Impostazioni), oppure genera schede di condivisione tramite [json2card](https://github.com/rockbenben/json2card) (imposta l'endpoint API nelle Impostazioni).
- **Sincronizzazione impostazioni** — sposta la tua configurazione su un altro dispositivo tramite URL; le chiavi API sono cifrate con AES.

## Avvio rapido

```bash
npm install
npm run dev
```

Apri http://localhost:5173, vai su Impostazioni, inserisci la tua chiave API e inizia a chattare. Se incontri un errore CORS, l'app propone di abilitare un proxy pubblico con un clic.

## Pensatori, modelli e piattaforma

**161 pensatori preimpostati** in 15 domini, ordinati per notorietà — scrivi un nome qualsiasi per creare al volo un personaggio personalizzato.

**Modelli** — imposta il **livello di pensiero** (off / basso / medio / alto), inserisci un **ID modello personalizzato** o connetti qualsiasi **API compatibile con OpenAI** come provider personalizzato. Default: DeepSeek V4 Flash. Il controllo del pensiero compare solo per i modelli che lo supportano davvero, e i provider senza interruttore di spegnimento (Gemini, Grok, Groq, Cerebras, Moonshot) chiamano il livello più basso **Min** anziché «off»: continua a ragionare e a essere fatturato, quindi scrivere «off» sarebbe una bugia.

**Piattaforma** — 18 lingue · modalità scura · responsive · **local-first** (doppia scrittura IndexedDB + localStorage, funziona in WeChat e nei WebView ristretti) · **zero CDN** (font self-hosted e inclusi nel bundle, così funziona offline e dietro i firewall).

## Link diretti

Avvia una conversazione direttamente da un URL:

- **Per nome:** `/#/chat?chars=苏格拉底,孔子` o `/#/chat?chars=Socrates,Confucius`
- **Per ID:** `/#/chat?chars=socrates,confucius`
- **Per categoria:** `/#/chat?category=philosophy` (tavola rotonda con ogni pensatore di quella categoria, fino a un massimo di 10)
- **Chat singola:** `/#/chat?chars=socrates`
- **Nomi personalizzati:** `/#/chat?chars=Ada Lovelace,Linus Torvalds` (i nomi non riconosciuti diventano personaggi personalizzati)

Categorie: `philosophy`, `strategy`, `business`, `finance`, `history`, `sociology`, `psychology`, `science`, `literature`, `art`, `economics`, `politics`, `technology`, `religion`, `education`.

I pulsanti **Copia link formazione** (barra dei partecipanti) e **Copia link categoria** (filtro categoria) generano questi URL dall'interfaccia.

**Routing linguistico** — anteponi all'URL una lingua per impostare la lingua dell'interfaccia, es. `/#/ja/chat`, `/#/ko/chat?chars=socrates`. Tutte le 18 lingue sono supportate.

## API supportate

25 provider pronti all'uso — internazionali, con sede in Cina e aggregatori:

- **Internazionale** — OpenAI · Anthropic · Google Gemini · xAI Grok · Mistral · Cohere
- **Cina** — DeepSeek · Qwen · Moonshot Kimi · Doubao · Xiaomi MiMo · Zhipu GLM · MiniMax · StepFun · Baidu Qianfan · Tencent TokenHub · Volcengine Coding Plan · Alibaba Bailian Coding Plan
- **Aggregatori e hosting** — OpenRouter · OpenCode Zen · Groq · Cerebras · SiliconFlow · AtlasCloud · NVIDIA NIM

L'elenco aggiornato dei modelli di ogni provider è nelle Impostazioni: gli ID cambiano troppo in fretta per essere ricopiati qui.

Qwen, MiMo, Moonshot, Zhipu, MiniMax e TokenHub offrono i loro host regionali con un clic. Oltre a questo, **ogni** provider — Anthropic e Gemini inclusi — ha un campo endpoint a testo libero, perché non si può prevedere quale upstream bloccherà un browser. Endpoint e proxy CORS sono indipendenti: puoi puntare al tuo gateway restando in connessione diretta, oppure usare l'host ufficiale passando dal proxy.

Tutti i provider accettano ID di modello personalizzati. **Eseguire un modello in locale**: l'opzione **Custom** accetta qualsiasi indirizzo compatibile con OpenAI, con punti di partenza in un clic per LM Studio, Ollama, llama.cpp, LiteLLM, Together AI e Fireworks AI (ognuno con il link alla propria documentazione). I server locali non richiedono una chiave: lì l'indirizzo _è_ la credenziale, quindi il campo chiave resta facoltativo.

## Proxy CORS

Alcuni provider non inviano header CORS, quindi un browser non può raggiungerli direttamente. Il proxy è un interruttore per provider nelle Impostazioni, e per impostazione predefinita si usa uno pubblico (`https://cors.api2026.workers.dev`).

**È già attivo per i provider che ne hanno bisogno** — OpenCode Zen, Tencent TokenHub, NVIDIA NIM e le due voci Coding Plan — perché senza non funzionano affatto. Tutto il resto usa la connessione diretta per impostazione predefinita.

> **Da sapere, sia che l'abbia attivato tu sia che l'abbia trovato attivo.** Tutto il resto qui è local-first; una richiesta via proxy no. La tua chiave API e il prompt completo passano da quel proxy prima di arrivare al provider. Ciò che conta è cosa ne fa il proxy, quindi concretamente: inoltra e nient'altro — l'intero percorso della richiesta è un singolo `fetch` di passaggio, senza log e senza alcuna memorizzazione ([leggilo](../../scripts/cors-proxy-worker.js), è breve). Inoltre inoltra solo agli host dichiarati in quel file, quindi non è un proxy aperto che qualcuno possa puntare verso destinazioni arbitrarie.
>
> Niente di tutto ciò cambia il fatto che la richiesta passa da una macchina gestita da questo progetto. Se per la tua chiave conta, gestisci il tuo — bastano circa due minuti.

Per il tuo, distribuisci un [Cloudflare Worker](https://dash.cloudflare.com) con questo codice e punta le Impostazioni su di esso:

[`scripts/cors-proxy-worker.js`](../../scripts/cors-proxy-worker.js)

## Sviluppo

```text
src/
  adapters/       # LLM API adapters (OpenAI-compatible, plus native Anthropic and Gemini)
  characters/     # Character presets and custom character generation
  components/     # React components
  hooks/          # useChat, useRoundtable
  i18n/           # Internationalization
  pages/          # componenti di rotta: ChatPage, SettingsView, SharedView
  stores/         # Zustand state management
  utils/          # Prompt building, export, compression, storage
  types.ts        # Type definitions
```

**Stack:** React 19 · antd 6 (tema a variabili CSS, profondamente personalizzato) · Vite · Tailwind CSS v4 · Zustand · i18next · React Router · TypeScript

| Comando           | Descrizione                          |
| ----------------- | ------------------------------------ |
| `npm run dev`     | Avvia il server di sviluppo          |
| `npm run build`   | Verifica tipi e build per produzione |
| `npm run test`    | Esegui i test                        |
| `npm run preview` | Anteprima della build di produzione  |

## Deploy

Compila e ospita la cartella `dist/` su qualsiasi hosting statico (Vercel, Netlify, GitHub Pages, …):

```bash
npm run build
```

Il routing è basato su hash (`/#/chat/...`, `/#/ja/chat/...`), quindi non serve alcuna configurazione di routing lato server.

## Informazioni sul 365 Open Source Plan

Progetto **#002** del [365 Open Source Plan](https://github.com/rockbenben/365opensource) — una persona + l'IA, oltre 300 progetti open source in un anno. [Proponi la tua idea →](https://365.aishort.top/) · [Discord](https://discord.gg/PZTQfJ4GjX) · [Telegram](https://t.me/aishort_top)