<h1 align="center">Legend Talk</h1>

<p align="center">
  Plano Open Source 365 #002 · Mesa redonda de IA com os maiores pensadores da história
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

Reúna os maiores pensadores do mundo e deixe-os debater seu problema.

Legend Talk é uma ferramenta de mesa redonda de IA multi-rodada — escolha 2-10 figuras históricas ou contemporâneas e assista ao debate.

Também funciona como ferramenta 1 a 1: consulte mais de 140 pensadores.

**Demo:** [talk.newzone.top](https://talk.newzone.top)

## Capturas

| Início | Chat |
|:-:|:-:|
| ![Início](../docs/images/home-chat.png) | ![Chat](../docs/images/chat-view.png) |

## Uso

### Chat 1 a 1

Clique em **Chat** em qualquer cartão.

### Mesa Redonda

Clique em **+** em 2-10 cartões. Ou **🎲 Aleatório** para 5 pensadores.

### Modelos

6 modelos de mesa redonda com perspectivas que conflitam.

### Durante a Conversa

- **Parar** — cancelar geração
- **Adicionar/remover participantes**
- **Configurar rodadas**
- **Continuar**
- **Reiniciar**
- **Resumir** — resumo IA
- **Compartilhar**
- **Exportar** — Markdown, JSON ou gerar cartões de compartilhamento via [json2card](https://github.com/rockbenben/json2card) (configurar endpoint nas Configurações)
- **Importar** — restaurar de JSON
- **Ramificar**

### Links Diretos

Inicie via URL:

- **Por nome:** `/#/chat?chars=Socrates,Confucius`
- **Por ID:** `/#/chat?chars=socrates,confucius`
- **Por categoria:** `/#/chat?category=philosophy`
- **Chat individual:** `/#/chat?chars=socrates`
- **Nomes personalizados:** `/#/chat?chars=Ada Lovelace,Linus Torvalds` (nomes não reconhecidos criam personagens automaticamente)

Categorias disponíveis: `philosophy`, `strategy`, `business`, `finance`, `history`, `sociology`, `psychology`, `science`, `literature`, `art`, `economics`, `politics`, `technology`, `religion`, `education`

Também gere links pela interface.

**Rota de idioma:** Use prefixo de idioma na URL. 18 idiomas.

## Mais Recursos

Além do acima:

- **140+ pensadores** em 15 domínios
- **Personagens personalizados**
- **Busca** · **Favoritos** · **Sincronização** (AES)
- **Nível de pensamento** · **Modelos personalizados** · **LLM personalizado**
- **Multi-API**: OpenAI, Anthropic, DeepSeek + 5 outros
- **18 idiomas** · **Modo escuro** · **Responsivo** · **Local-first**

## APIs Suportadas

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

Todos suportam IDs personalizados. Padrão: DeepSeek Chat.

## Início Rápido

```bash
npm install
npm run dev
```

Abra http://localhost:5173, vá para Configurações, insira sua chave API.

## Proxy CORS

Alguns provedores bloqueiam requisições diretas. Configure o proxy CORS por provedor.

Para implantar o seu, crie um [Cloudflare Worker](https://dash.cloudflare.com):

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

## Estrutura do Projeto

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

| Comando | Descrição |
|---------|----------|
| `npm run dev` | Servidor de desenvolvimento |
| `npm run build` | Verificar tipos e compilar |
| `npm run test` | Executar testes |
| `npm run preview` | Visualizar build |

## Deploy

Compile e implante `dist/` em qualquer hospedagem estática:

```bash
npm run build
```

Usa roteamento hash (`/#/chat/...`), sem configuração de servidor.

## Sobre o Plano 365

Este é o projeto #002 do [Plano Open Source 365](https://github.com/rockbenben/365opensource).

1 pessoa + IA, 300+ projetos open source em um ano. [Envie sua ideia →](https://my.feishu.cn/share/base/form/shrcnI6y7rrmlSjbzkYXh6sjmzb)

## License

MIT
