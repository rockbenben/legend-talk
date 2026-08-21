<p align="center">
  <img src="../../public/logo.png" width="84" height="84" alt="Legend Talk logo" />
</p>

<h1 align="center">Legend Talk</h1>

<p align="center">
  Plano Open Source 365 #002 · Mesa redonda de IA com os maiores pensadores da história
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
  <b>Português</b> ·
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

> **Reúna as maiores mentes da história em uma mesa e deixe-as debater seu problema.**

O Legend Talk reúne 2 a 10 pensadores históricos ou contemporâneos em um debate de múltiplas rodadas. A cada rodada, cada voz argumenta a partir de seu próprio referencial; em seguida, um mediador mapeia as divergências e abre a rodada seguinte. Sócrates questiona as premissas de Munger enquanto Nietzsche desafia os dois.

**Três formas de começar:**

- **Faça uma pergunta** — digite um tema e a IA monta um painel de 3 a 5 pensadores construído para gerar tensão produtiva.
- **Prepare a mesa** — escolha você mesmo 2 a 10 pensadores, ou sorteie 5 ao acaso.
- **Consulte uma única mente** — converse 1 a 1 com qualquer um dos 161 pensadores, cada um raciocinando por seu próprio referencial, não um roleplay genérico de IA.

**Demo:** [talk.newzone.top](https://talk.newzone.top) — 18 idiomas · gratuito · local-first · sem cadastro.

|                 Início                  |                 Chat                  |
| :-------------------------------------: | :-----------------------------------: |
| ![Início](../../docs/images/home-chat.png) | ![Chat](../../docs/images/chat-view.png) |

## Iniciar uma conversa

**Mesa redonda automática** — digite um tema na barra de entrada da página inicial. A IA escolhe de 3 a 5 pensadores cujas visões realmente conflitam e inicia o debate imediatamente, sem necessidade de escolher personagens.

**Mesa redonda manual** — clique em **+** em 2 a 10 cartões de personagem para montar a formação. Uma barra flutuante mostra suas escolhas:

- Clique em um avatar para removê-lo
- **Iniciar Discussão** para começar
- **Copiar link da formação** para compartilhar a formação exata como URL

Ou clique em **🎲 Aleatório** (canto superior direito) para começar na hora com 5 pensadores aleatórios.

**Modelos em destaque** — 6 formações curadas cujas perspectivas realmente colidem (ex.: _IA & Tecnologia_: Karpathy vs Ilya vs Feynman vs Taleb vs Paul Graham). Um clique para começar, cada uma com 3 temas sugeridos.

**Chat 1 a 1** — clique em **Chat** em qualquer cartão de personagem para uma conversa privada com a voz e o referencial daquele pensador.

**Sugestões de temas** — antes da sua primeira mensagem, todos os modos propõem temas para você começar: 3 perguntas curadas por modelo (em todos os 18 idiomas), ou 1 pergunta extraída de cada pensador selecionado em uma formação manual (atualiza conforme você adiciona ou remove pessoas).

## Conduza a discussão

Você se senta à cabeceira da mesa como o **presidente** — o debate corre nos seus termos.

- **Mediador** — após cada rodada, um mediador de IA a sintetiza: agrupa as afirmações por ideia, aponta um ângulo que a rodada deixou de explorar e propõe uma pergunta aberta para a próxima.
- **Reorientar no meio do debate** — envie uma mensagem durante uma mesa redonda para redirecioná-la. Em vez de executar automaticamente, surge um **cartão de foco** editável; ele se empilha sobre qualquer foco anterior, para que as orientações anteriores não se percam. Refine-o e então **Inicie** as próximas rodadas ancoradas nele.
- **Aplicar e repetir** — edite qualquer mensagem e regenere a partir daquele ponto. As orientações do presidente carregam um instantâneo do foco, então uma repetição reconstrói a partir do estado exato de foco que estava ativo quando a mensagem foi enviada.
- **Definir rodadas** — escolha quantas rodadas os pensadores debatem antes de pausar e **Continue** para adicionar mais quando terminarem.
- **Adicionar ou remover participantes** a qualquer momento — transforme um 1 a 1 em mesa redonda, ou o contrário.
- **Parar** — cancele a geração no meio do fluxo; o que já foi escrito é mantido.
- **Ramificar** — bifurque uma nova conversa a partir de qualquer mensagem, levando o contexto anterior com ela.

## Salvar, buscar e compartilhar

- **Resumir** — resumo de IA em um clique, extraindo os pontos de vista centrais e as divergências.
- **Buscar** — encontre qualquer coisa em todas as conversas por título, nome do pensador ou conteúdo da mensagem.
- **Favoritos** — marque com estrela seus pensadores mais usados para acesso rápido.
- **Compartilhar chat** — gere uma URL contendo a conversa completa.
- **Exportar / Importar** — salve como Markdown ou JSON e restaure de JSON (nas Configurações), ou gere cartões de compartilhamento via [json2card](https://github.com/rockbenben/json2card) (defina o endpoint da API nas Configurações).
- **Sincronização de configurações** — leve sua configuração para outro dispositivo via URL; as chaves de API são criptografadas com AES.

## Início Rápido

```bash
npm install
npm run dev
```

Abra http://localhost:5173, vá para Configurações, insira sua chave de API e comece a conversar. Se encontrar um erro de CORS, o aplicativo oferece ativar um proxy público com um clique.

## Pensadores, modelos e plataforma

**161 pensadores predefinidos** em 15 domínios, ordenados por fama — digite qualquer nome para criar um personagem personalizado na hora.

**Modelos** — defina o **nível de pensamento** (desligado / baixo / médio / alto), insira um **ID de modelo personalizado** ou conecte qualquer **API compatível com OpenAI** como provedor personalizado. Padrão: DeepSeek V4 Flash. O controle de pensamento só aparece para modelos que realmente o suportam, e provedores sem opção de desligar (Gemini, Grok, Groq, Cerebras, Moonshot) rotulam o nível mais baixo como **Min** em vez de «desligado»: ele continua raciocinando e sendo cobrado, então dizer «desligado» seria mentira.

**Plataforma** — 18 idiomas · modo escuro · responsivo · **local-first** (escrita dupla em IndexedDB + localStorage, funciona no WeChat e em WebViews restritos) · **zero CDN** (fontes auto-hospedadas e empacotadas, então funciona offline e atrás de firewalls).

## Links Diretos

Inicie uma conversa diretamente por uma URL:

- **Por nome:** `/#/chat?chars=苏格拉底,孔子` ou `/#/chat?chars=Socrates,Confucius`
- **Por ID:** `/#/chat?chars=socrates,confucius`
- **Por categoria:** `/#/chat?category=philosophy` (mesa redonda com todos os pensadores dessa categoria, limitada a 10)
- **Chat individual:** `/#/chat?chars=socrates`
- **Nomes personalizados:** `/#/chat?chars=Ada Lovelace,Linus Torvalds` (nomes não reconhecidos viram personagens personalizados)

Categorias: `philosophy`, `strategy`, `business`, `finance`, `history`, `sociology`, `psychology`, `science`, `literature`, `art`, `economics`, `politics`, `technology`, `religion`, `education`.

Os botões **Copiar link da formação** (barra de participantes) e **Copiar link da categoria** (filtro de categoria) geram essas URLs a partir da interface.

**Rota de idioma** — prefixe a URL com um idioma para definir o idioma da interface, ex.: `/#/ja/chat`, `/#/ko/chat?chars=socrates`. Todos os 18 idiomas suportados.

## APIs Suportadas

25 provedores prontos para uso — internacionais, sediados na China e agregadores:

- **Internacional** — OpenAI · Anthropic · Google Gemini · xAI Grok · Mistral · Cohere
- **China** — DeepSeek · Qwen · Moonshot Kimi · Doubao · Xiaomi MiMo · Zhipu GLM · MiniMax · StepFun · Baidu Qianfan · Tencent TokenHub · Volcengine Coding Plan · Alibaba Bailian Coding Plan
- **Agregadores e hospedagem** — OpenRouter · OpenCode Zen · Groq · Cerebras · SiliconFlow · AtlasCloud · NVIDIA NIM

A lista de modelos atual de cada provedor está em Configurações — os IDs mudam rápido demais para serem espelhados aqui.

Qwen, MiMo, Moonshot, Zhipu, MiniMax e TokenHub oferecem seus hosts regionais em um clique. Além disso, **todos** os provedores — incluindo Anthropic e Gemini — têm um campo de endpoint em texto livre, porque não dá para prever qual upstream vai bloquear um navegador. Endpoint e proxy CORS são independentes: você pode apontar para o seu próprio gateway e ainda assim conectar direto, ou usar o host oficial através do proxy.

Todos os provedores aceitam IDs de modelo personalizados. **Rodar um modelo localmente**: a opção **Custom** aceita qualquer endereço compatível com OpenAI, com pontos de partida em um clique para LM Studio, Ollama, llama.cpp, LiteLLM, Together AI e Fireworks AI (cada um com link para sua documentação). Servidores locais não precisam de chave: ali o endereço _é_ a credencial, então o campo de chave fica opcional.

## Proxy CORS

Alguns provedores não enviam cabeçalhos CORS, então um navegador não consegue alcançá-los diretamente. O proxy é um botão por provedor nas Configurações, e por padrão usa-se um público (`https://cors.api2026.workers.dev`).

**Já está ligado para os provedores que precisam** — OpenCode Zen, Tencent TokenHub, NVIDIA NIM e as duas entradas de Coding Plan — porque sem ele simplesmente não funcionam. Todo o resto usa conexão direta por padrão.

> **Vale saber, quer você tenha ligado, quer o tenha encontrado ligado.** Todo o resto aqui é local-first; uma requisição via proxy não é. Sua chave de API e o prompt completo passam por esse proxy a caminho do provedor. O que importa é o que o proxy faz com eles, então concretamente: ele encaminha e nada mais — todo o caminho da requisição é um único `fetch` de passagem, sem logs e sem armazenamento de qualquer tipo ([leia](../../scripts/cors-proxy-worker.js), é curto). Além disso só encaminha para hosts declarados nesse arquivo, então não é um proxy aberto que alguém possa apontar para destinos arbitrários.
>
> Nada disso muda o fato de que a requisição passa por uma máquina operada por este projeto. Se isso importa para a sua chave, rode o seu — leva cerca de dois minutos.

Para rodar o seu, publique um [Cloudflare Worker](https://dash.cloudflare.com) com este código e aponte as Configurações para ele:

[`scripts/cors-proxy-worker.js`](../../scripts/cors-proxy-worker.js)

## Desenvolvimento

```text
src/
  adapters/       # LLM API adapters (OpenAI-compatible, plus native Anthropic and Gemini)
  characters/     # Character presets and custom character generation
  components/     # React components
  hooks/          # useChat, useRoundtable
  i18n/           # Internationalization
  pages/          # componentes de rota: ChatPage, SettingsView, SharedView
  stores/         # Zustand state management
  utils/          # Prompt building, export, compression, storage
  types.ts        # Type definitions
```

**Stack:** React 19 · antd 6 (tema com variáveis CSS, profundamente personalizado) · Vite · Tailwind CSS v4 · Zustand · i18next · React Router · TypeScript

| Comando           | Descrição                                |
| ----------------- | ---------------------------------------- |
| `npm run dev`     | Iniciar servidor de desenvolvimento      |
| `npm run build`   | Verificar tipos e compilar para produção |
| `npm run test`    | Executar testes                          |
| `npm run preview` | Visualizar build de produção             |

## Deploy

Compile e hospede a pasta `dist/` em qualquer hospedagem estática (Vercel, Netlify, GitHub Pages, …):

```bash
npm run build
```

O roteamento é baseado em hash (`/#/chat/...`, `/#/ja/chat/...`), então nenhuma configuração de roteamento no servidor é necessária.

## Sobre o Plano 365 Open Source

Projeto **#002** do [Plano 365 Open Source](https://github.com/rockbenben/365opensource) — uma pessoa + IA, mais de 300 projetos open-source em um ano. [Envie sua ideia →](https://365.aishort.top/) · [Discord](https://discord.gg/PZTQfJ4GjX) · [Telegram](https://t.me/aishort_top)