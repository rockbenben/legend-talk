<p align="center">
  <img src="../../public/logo.png" width="84" height="84" alt="Legend Talk logo" />
</p>

<h1 align="center">Legend Talk</h1>

<p align="center">
  Plan de Código Abierto 365 #002 · Mesa redonda de IA con los más grandes pensadores de la historia
</p>

<p align="center">
  <a href="../../README.md">English</a> ·
  <a href="../../README.zh.md">简体中文</a> ·
  <a href="README.zh-Hant.md">繁體中文</a> ·
  <a href="README.ja.md">日本語</a> ·
  <a href="README.ko.md">한국어</a> ·
  <b>Español</b> ·
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

> **Sienta a las mentes más grandes de la historia en una misma mesa y déjalas debatir tu pregunta.**

Legend Talk reúne a 2-10 pensadores históricos o contemporáneos en un debate multi-ronda. En cada ronda, cada voz argumenta desde su propio marco; luego un moderador mapea los desacuerdos y abre la siguiente ronda. Sócrates pone a prueba las suposiciones de Munger mientras Nietzsche los desafía a ambos.

**Tres formas de empezar:**

- **Haz una pregunta** — escribe un tema y la IA reúne un panel de 3-5 pensadores diseñado para una tensión productiva.
- **Prepara la mesa** — elige a mano de 2 a 10 pensadores, o saca 5 al azar.
- **Consulta a una sola mente** — habla 1 a 1 con cualquiera de los 161 pensadores, cada uno razonando a través de su propio marco, no un juego de roles genérico de IA.

**Demo:** [talk.newzone.top](https://talk.newzone.top) — 18 idiomas · gratis · local-first · sin registro.

|                 Inicio                  |                 Chat                  |
| :-------------------------------------: | :-----------------------------------: |
| ![Inicio](../../docs/images/home-chat.png) | ![Chat](../../docs/images/chat-view.png) |

## Iniciar una conversación

**Mesa redonda automática** — escribe un tema en la barra de entrada de la página de inicio. La IA elige de 3 a 5 pensadores cuyas opiniones realmente chocan e inicia el debate de inmediato, sin necesidad de elegir personajes.

**Mesa redonda manual** — haz clic en **+** en 2-10 tarjetas de personaje para construir tu alineación. Una barra flotante muestra tus elecciones:

- Haz clic en un avatar para quitarlo
- **Iniciar Discusión** para lanzar
- **Copiar enlace de alineación** para compartir la alineación exacta como una URL

O pulsa **🎲 Aleatorio** (arriba a la derecha) para empezar al instante con 5 pensadores al azar.

**Plantillas destacadas** — 6 alineaciones curadas cuyas perspectivas realmente chocan (ej. _IA y Tecnología_: Karpathy vs Ilya vs Feynman vs Taleb vs Paul Graham). Un clic para empezar, cada una con 3 temas sugeridos.

**Chat 1 a 1** — haz clic en **Chat** en cualquier tarjeta de personaje para una conversación privada con la voz y el marco de ese pensador.

**Sugerencias de temas** — antes de tu primer mensaje, cada modo propone temas para que empieces: 3 preguntas curadas por plantilla (en los 18 idiomas), o 1 pregunta extraída de cada pensador seleccionado en una alineación manual (se actualiza al agregar o quitar personas).

## Dirige la discusión

Te sientas a la cabecera de la mesa como el **presidente** — el debate se desarrolla según tus condiciones.

- **Moderador** — después de cada ronda, un moderador de IA la sintetiza: agrupa las afirmaciones por idea, nombra un ángulo que la ronda dejó sin tocar y plantea una pregunta abierta para la siguiente.
- **Reenfocar a mitad del debate** — envía un mensaje durante una mesa redonda para redirigirla. En lugar de ejecutarse automáticamente, aparece una **tarjeta de enfoque** editable; se apila sobre cualquier enfoque previo para no perder los rumbos anteriores. Refínala y luego pulsa **Iniciar** las siguientes rondas ancladas en ella.
- **Aplicar y reintentar** — edita cualquier mensaje y regenera desde ese punto. Los rumbos del presidente llevan una instantánea de enfoque, así que un reintento reconstruye desde el estado de enfoque exacto que estaba activo cuando se envió el mensaje.
- **Configurar rondas** — elige cuántas rondas debaten los pensadores antes de pausar, y **Continuar** para añadir más cuando terminen.
- **Añadir o quitar participantes** en cualquier momento — convierte un 1 a 1 en una mesa redonda, o al revés.
- **Detener** — cancela la generación a mitad del flujo; lo que ya se haya escrito se conserva.
- **Bifurcar** — crea una nueva conversación a partir de cualquier mensaje, llevando consigo el contexto previo.

## Guardar, buscar y compartir

- **Resumir** — resumen de IA con un clic que extrae los puntos de vista centrales y los desacuerdos.
- **Búsqueda** — encuentra cualquier cosa en todas las conversaciones por título, nombre del pensador o contenido del mensaje.
- **Favoritos** — marca con estrella tus pensadores más usados para acceder rápidamente.
- **Compartir chat** — genera una URL que contiene la conversación completa.
- **Exportar / Importar** — guarda como Markdown o JSON y restaura desde JSON (en Ajustes), o genera tarjetas compartibles con [json2card](https://github.com/rockbenben/json2card) (configura el endpoint de la API en Ajustes).
- **Sincronización de ajustes** — traslada tu configuración a otro dispositivo via URL; las claves API se cifran con AES.

## Inicio Rápido

```bash
npm install
npm run dev
```

Abre http://localhost:5173, ve a Ajustes, introduce tu clave API y empieza a chatear. Si encuentras un error de CORS, la aplicación te ofrece habilitar un proxy público con un clic.

## Pensadores, modelos y plataforma

**161 pensadores predefinidos** en 15 dominios, ordenados por fama — escribe cualquier nombre para crear un personaje personalizado al vuelo.

**Modelos** — establece el **nivel de pensamiento** (off / bajo / medio / alto), introduce un **ID de modelo personalizado** o conecta cualquier **API compatible con OpenAI** como proveedor personalizado. Predeterminado: DeepSeek V4 Flash. El control de pensamiento solo aparece para modelos que realmente lo admiten, y los proveedores sin interruptor de apagado (Gemini, Grok, Groq, Cerebras, Moonshot) etiquetan su nivel más bajo como **Min** en lugar de «off»: sigue razonando y sigue facturando, así que decir «off» sería mentir.

**Plataforma** — 18 idiomas · modo oscuro · responsivo · **local-first** (escritura dual en IndexedDB + localStorage, funciona en WeChat y WebViews restringidos) · **cero CDN** (fuentes autoalojadas e incluidas en el paquete, así que funciona sin conexión y detrás de cortafuegos).

## Enlaces Directos

Inicia una conversación directamente desde una URL:

- **Por nombre:** `/#/chat?chars=苏格拉底,孔子` o `/#/chat?chars=Socrates,Confucius`
- **Por ID:** `/#/chat?chars=socrates,confucius`
- **Por categoría:** `/#/chat?category=philosophy` (mesa redonda de todos los pensadores de esa categoría, con un límite de 10)
- **Chat individual:** `/#/chat?chars=socrates`
- **Nombres personalizados:** `/#/chat?chars=Ada Lovelace,Linus Torvalds` (los nombres no reconocidos crean personajes personalizados)

Categorías: `philosophy`, `strategy`, `business`, `finance`, `history`, `sociology`, `psychology`, `science`, `literature`, `art`, `economics`, `politics`, `technology`, `religion`, `education`.

Los botones **Copiar enlace de alineación** (barra de participantes) y **Copiar enlace de categoría** (filtro de categoría) generan estas URLs desde la interfaz.

**Ruta de idioma** — añade un prefijo de idioma a la URL para establecer el idioma de la interfaz, ej. `/#/ja/chat`, `/#/ko/chat?chars=socrates`. Soporta los 18 idiomas.

## APIs Soportadas

25 proveedores listos para usar — internacionales, con base en China y agregadores:

- **Internacional** — OpenAI · Anthropic · Google Gemini · xAI Grok · Mistral · Cohere
- **China** — DeepSeek · Qwen · Moonshot Kimi · Doubao · Xiaomi MiMo · Zhipu GLM · MiniMax · StepFun · Baidu Qianfan · Tencent TokenHub · Volcengine Coding Plan · Alibaba Bailian Coding Plan
- **Agregadores y hosting** — OpenRouter · OpenCode Zen · Groq · Cerebras · SiliconFlow · AtlasCloud · NVIDIA NIM

La lista de modelos vigente de cada proveedor está en Ajustes: los IDs cambian demasiado rápido para duplicarlos aquí.

Qwen, MiMo, Moonshot, Zhipu, MiniMax y TokenHub ofrecen sus hosts regionales con un clic. Además, **todos** los proveedores —incluidos Anthropic y Gemini— tienen un campo de endpoint de texto libre, porque no se puede predecir qué upstream bloqueará un navegador. El endpoint y el proxy CORS son independientes: puedes apuntar a tu propia pasarela y seguir conectando directamente, o usar el host oficial a través del proxy.

Todos los proveedores aceptan IDs de modelo personalizados. **Ejecutar un modelo en local**: la opción **Custom** admite cualquier dirección compatible con OpenAI, con puntos de partida de un clic para LM Studio, Ollama, llama.cpp, LiteLLM, Together AI y Fireworks AI (cada uno con enlace a su documentación). Los servidores locales no necesitan clave: ahí la dirección _es_ la credencial, así que el campo de clave queda opcional.

## Proxy CORS

Algunos proveedores no envían cabeceras CORS, así que un navegador no puede alcanzarlos directamente. El proxy es un interruptor por proveedor en Ajustes, y por defecto se usa uno público (`https://cors.api2026.workers.dev`).

**Ya está activado para los proveedores que lo necesitan** — OpenCode Zen, Tencent TokenHub, NVIDIA NIM y las dos entradas de Coding Plan — porque sin él simplemente no funcionan. Todo lo demás usa conexión directa por defecto.

> **Conviene saberlo, tanto si lo activaste tú como si lo encontraste activado.** Todo lo demás aquí es local-first; una petición vía proxy no lo es. Tu clave de API y el prompt completo pasan por ese proxy camino del proveedor. Lo que importa es qué hace el proxy con ellos, así que concretamente: solo reenvía y nada más — todo el camino de la petición es un único `fetch` de paso, sin registros ni almacenamiento de ningún tipo ([léelo](../../scripts/cors-proxy-worker.js), es corto). Además solo reenvía a los hosts declarados en ese archivo, así que no es un proxy abierto que otro pueda dirigir a destinos arbitrarios.
>
> Nada de eso cambia que la petición pasa por una máquina que opera este proyecto. Si eso importa para tu clave, monta la tuya — son unos dos minutos.

Para usar la tuya, despliega un [Cloudflare Worker](https://dash.cloudflare.com) con este código y apunta Ajustes hacia él:

[`scripts/cors-proxy-worker.js`](../../scripts/cors-proxy-worker.js)

## Desarrollo

```text
src/
  adapters/       # LLM API adapters (OpenAI-compatible, plus native Anthropic and Gemini)
  characters/     # Character presets and custom character generation
  components/     # React components
  hooks/          # useChat, useRoundtable
  i18n/           # Internationalization
  pages/          # componentes de ruta: ChatPage, SettingsView, SharedView
  stores/         # Zustand state management
  utils/          # Prompt building, export, compression, storage
  types.ts        # Type definitions
```

**Stack:** React 19 · antd 6 (tema con variables CSS, profundamente personalizado) · Vite · Tailwind CSS v4 · Zustand · i18next · React Router · TypeScript

| Comando           | Descripción                                  |
| ----------------- | -------------------------------------------- |
| `npm run dev`     | Iniciar servidor de desarrollo               |
| `npm run build`   | Verificar tipos y compilar para producción   |
| `npm run test`    | Ejecutar tests                               |
| `npm run preview` | Vista previa de la compilación de producción |

## Despliegue

Compila y aloja la carpeta `dist/` en cualquier hosting estático (Vercel, Netlify, GitHub Pages, …):

```bash
npm run build
```

El enrutamiento es basado en hash (`/#/chat/...`, `/#/ja/chat/...`), así que no se necesita configuración de enrutamiento del lado del servidor.

## Sobre el Plan 365 de código abierto

Proyecto **#002** del [Plan 365 de código abierto](https://github.com/rockbenben/365opensource) — una persona + IA, más de 300 proyectos de código abierto en un año. [Envía tu idea →](https://365.aishort.top/) · [Discord](https://discord.gg/PZTQfJ4GjX) · [Telegram](https://t.me/aishort_top)