<h1 align="center">Legend Talk</h1>

<p align="center">
  План открытого кода 365 #002 · AI-круглый стол с величайшими мыслителями истории
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
  <a href="README.ar.md">العربية</a> ·
  <a href="README.hi.md">हिन्दी</a> ·
  <a href="README.vi.md">Tiếng Việt</a> ·
  <a href="README.th.md">ไทย</a> ·
  <a href="README.tr.md">Türkçe</a> ·
  <a href="README.id.md">Indonesia</a> ·
  <a href="README.bn.md">বাংলা</a>
</p>

Соберите величайших мыслителей мира и позвольте им обсудить вашу проблему.

Legend Talk — инструмент для многораундовых AI-дискуссий — выберите 2-10 мыслителей и наблюдайте за дебатами.

Также работает как инструмент 1 на 1: обратитесь к более чем 140 мыслителям.

**Демо:** [talk.newzone.top](https://talk.newzone.top)

## Скриншоты

| Главная | Чат |
|:-:|:-:|
| ![Главная](../docs/images/home-chat.png) | ![Чат](../docs/images/chat-view.png) |

## Использование

### Чат 1 на 1

Нажмите **Чат** на карточке персонажа.

### Круглый стол

Нажмите **+** на 2-10 карточках. Или **🎲 Случайный** для 5 мыслителей.

### Шаблоны

6 шаблонов круглого стола с противоречащими взглядами.

### Рекомендуемые темы

Во всех режимах круглого стола перед отправкой первого сообщения отображаются рекомендуемые темы:

- **Шаблонные круглые столы** — 3 вопроса, подобранных под тему каждого шаблона (доступны на всех 18 языках)
- **Ручные круглые столы** — 1 вопрос от каждого выбранного персонажа (макс. 5). Темы обновляются при добавлении или удалении персонажей.

### Во время беседы

- **Стоп** — остановить
- **Добавить/удалить участников**
- **Настроить раунды**
- **Продолжить**
- **Перезапустить**
- **Итоги** — AI-резюме
- **Поделиться**
- **Экспорт** — Markdown, JSON или создание карточек через [json2card](https://github.com/rockbenben/json2card) (настройте адрес API в Настройках)
- **Импорт**
- **Ветвление**

### Прямые ссылки

Начните беседу через URL:

- **По имени:** `/#/chat?chars=Socrates,Confucius`
- **По ID:** `/#/chat?chars=socrates,confucius`
- **По категории:** `/#/chat?category=philosophy`
- **Одиночный чат:** `/#/chat?chars=socrates`
- **Свои имена:** `/#/chat?chars=Ada Lovelace,Linus Torvalds` (нераспознанные имена создают персонажей автоматически)

Доступные категории: `philosophy`, `strategy`, `business`, `finance`, `history`, `sociology`, `psychology`, `science`, `literature`, `art`, `economics`, `politics`, `technology`, `religion`, `education`

Ссылки можно генерировать и через интерфейс.

**Языковая маршрутизация:** Префикс языка в URL. 18 языков.

## Возможности

Помимо вышеперечисленного:

- **140+ мыслителей** в 15 областях
- **Свои персонажи**
- **Поиск** · **Избранное** · **Синхронизация** (AES)
- **Глубина размышлений** · **Свои модели** · **Свой LLM**
- **Мульти-API**: OpenAI, Anthropic, DeepSeek + 5 других
- **18 языков** · **Тёмная тема** · **Адаптивный** · **Локальный**

## Поддерживаемые API

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

Все поддерживают свои ID моделей. По умолчанию: DeepSeek Chat.

## Быстрый старт

```bash
npm install
npm run dev
```

Откройте http://localhost:5173, введите API-ключ в Настройках.

## CORS-прокси

Некоторые провайдеры блокируют прямые запросы. Настройте CORS-прокси по провайдерам.

Для своего прокси создайте [Cloudflare Worker](https://dash.cloudflare.com):

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

## Структура проекта

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

## Технологический стек

React 19, Vite, Tailwind CSS v4, Zustand, i18next, React Router, TypeScript

## Скрипты

| Команда | Описание |
|---------|----------|
| `npm run dev` | Сервер разработки |
| `npm run build` | Проверка типов + сборка |
| `npm run test` | Тесты |
| `npm run preview` | Предпросмотр сборки |

## Развёртывание

Соберите и разверните `dist/` на любом статическом хостинге:

```bash
npm run build
```

Хэш-маршрутизация (`/#/chat/...`), серверная настройка не нужна.

## О плане 365

Проект #002 [Плана открытого кода 365](https://github.com/rockbenben/365opensource).

1 человек + ИИ, 300+ open-source проектов за год. [Предложите идею →](https://my.feishu.cn/share/base/form/shrcnI6y7rrmlSjbzkYXh6sjmzb)

## License

MIT
