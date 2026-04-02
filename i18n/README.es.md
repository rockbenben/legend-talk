<h1 align="center">Legend Talk</h1>

<p align="center">
  Plan de Código Abierto 365 #002 · Mesa redonda de IA con los más grandes pensadores de la historia
</p>

<p align="center">
  <a href="../README.md">English</a> ·
  <a href="../README.zh.md">中文</a> ·
  <a href="README.zh-Hant.md">繁體中文</a> ·
  <a href="README.ja.md">日本語</a> ·
  <a href="README.ko.md">한국어</a> ·
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

Reúne a los más grandes pensadores del mundo en una sala y déjalos debatir tu problema.

Legend Talk es una herramienta de mesa redonda de IA multi-ronda — elige 2-10 figuras históricas o contemporáneas, lanza una pregunta y obsérvalos debatir durante varias rondas.

También funciona como herramienta 1 a 1: consulta con más de 140 pensadores.

**Demo:** [talk.newzone.top](https://talk.newzone.top)

## Capturas

| Inicio | Chat |
|:-:|:-:|
| ![Inicio](../docs/images/home-chat.png) | ![Chat](../docs/images/chat-view.png) |

## Uso

### Chat 1 a 1

Haz clic en **Chat** en cualquier tarjeta de personaje.

### Mesa Redonda

Haz clic en **+** en 2-10 tarjetas. O **🎲 Aleatorio** para 5 pensadores al azar.

### Plantillas

6 plantillas de mesa redonda con pensadores cuyos puntos de vista chocan.

### Durante una Conversación

- **Detener** — cancelar generación
- **Añadir/eliminar participantes**
- **Configurar rondas**
- **Continuar** — añadir rondas
- **Reiniciar** — nueva conversación, mismos personajes
- **Resumir** — resumen IA
- **Compartir** — enlace compartible
- **Exportar** — Markdown, JSON o generar tarjetas compartibles con [json2card](https://github.com/rockbenben/json2card) (configurar endpoint en Ajustes)
- **Importar** — restaurar desde JSON
- **Bifurcar** — nueva conversación desde cualquier mensaje

### Enlaces Directos

Inicia una conversación directamente via URL:

- **Por nombre:** `/#/chat?chars=Socrates,Confucius`
- **Por ID:** `/#/chat?chars=socrates,confucius`
- **Por categoría:** `/#/chat?category=philosophy`
- **Chat individual:** `/#/chat?chars=socrates`
- **Nombres personalizados:** `/#/chat?chars=Ada Lovelace,Linus Torvalds` (los nombres no reconocidos crean personajes automáticamente)

Categorías disponibles: `philosophy`, `strategy`, `business`, `finance`, `history`, `sociology`, `psychology`, `science`, `literature`, `art`, `economics`, `politics`, `technology`, `religion`, `education`

También puedes generar estos enlaces desde la interfaz.

**Ruta de idioma:** Usa un prefijo de idioma en la URL, ej. `/#/ja/chat`. Soporta 18 idiomas.

## Más Características

Además de lo anterior:

- **140+ pensadores** en 15 dominios
- **Personajes personalizados**
- **Búsqueda** · **Favoritos** · **Sincronización** (AES)
- **Nivel de pensamiento** · **Modelos personalizados** · **LLM personalizado**
- **Multi-API**: OpenAI, Anthropic, DeepSeek + 5 más
- **18 idiomas** · **Modo oscuro** · **Responsivo** · **Local-first**

## APIs Soportadas

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

Todos soportan IDs de modelo personalizados. Predeterminado: DeepSeek Chat.

## Inicio Rápido

```bash
npm install
npm run dev
```

Abre http://localhost:5173, ve a Ajustes, introduce tu clave API.

## Proxy CORS

Algunos proveedores bloquean solicitudes directas del navegador. Configura el proxy CORS por proveedor en Ajustes.

Para desplegar el tuyo, crea un [Cloudflare Worker](https://dash.cloudflare.com):

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

## Estructura del Proyecto

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

## Stack Tecnológico

React 19, Vite, Tailwind CSS v4, Zustand, i18next, React Router, TypeScript

## Scripts

| Comando | Descripción |
|---------|-------------|
| `npm run dev` | Servidor de desarrollo |
| `npm run build` | Verificar tipos y compilar |
| `npm run test` | Ejecutar tests |
| `npm run preview` | Vista previa de producción |

## Despliegue

Compila y despliega `dist/` en cualquier hosting estático:

```bash
npm run build
```

Usa enrutamiento hash (`/#/chat/...`), no necesita configuración del servidor.

## Acerca del Plan 365

Este es el proyecto #002 del [Plan de Código Abierto 365](https://github.com/rockbenben/365opensource).

Una persona + IA, 300+ proyectos open source en un año. [Envía tu idea →](https://my.feishu.cn/share/base/form/shrcnI6y7rrmlSjbzkYXh6sjmzb)

## License

MIT
