<h1 align="center">Legend Talk</h1>

<p align="center">
  Plan Open Source 365 #002 · Table ronde IA avec les plus grands penseurs de l'histoire
</p>

<p align="center">
  <a href="../README.md">English</a> ·
  <a href="../README.zh.md">中文</a> ·
  <a href="README.zh-Hant.md">繁體中文</a> ·
  <a href="README.ja.md">日本語</a> ·
  <a href="README.ko.md">한국어</a> ·
  <a href="README.es.md">Español</a> ·
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

Réunissez les plus grands penseurs du monde et laissez-les débattre de votre problème.

Legend Talk est un outil de table ronde IA multi-tours — choisissez 2 à 10 figures et regardez-les débattre.

Fonctionne aussi en 1 à 1 : consultez plus de 140 penseurs.

**Démo:** [talk.newzone.top](https://talk.newzone.top)

## Captures

| Accueil | Chat |
|:-:|:-:|
| ![Accueil](../docs/images/home-chat.png) | ![Chat](../docs/images/chat-view.png) |

## Utilisation

### Chat 1 à 1

Cliquez sur **Chat** sur n'importe quelle carte.

### Table Ronde

Cliquez sur **+** sur 2-10 cartes. Ou **🎲 Aléatoire** pour 5 penseurs.

### Modèles

6 modèles de table ronde avec des perspectives opposées.

### Suggestions de sujets

Tous les modes table ronde affichent des sujets recommandés avant l'envoi du premier message :

- **Tables rondes modèles** — 3 questions adaptées au thème de chaque modèle (disponibles dans les 18 langues)
- **Tables rondes manuelles** — 1 question par personnage sélectionné (max. 5). Les sujets se mettent à jour lors de l'ajout ou du retrait de personnages.

### Pendant la Conversation

- **Arrêter** — annuler la génération
- **Ajouter/supprimer des participants**
- **Configurer les tours**
- **Continuer**
- **Recommencer**
- **Résumer** — résumé IA
- **Partager**
- **Exporter** — Markdown, JSON ou générer des cartes de partage via [json2card](https://github.com/rockbenben/json2card) (configurer le point d'accès dans les Paramètres)
- **Importer** — restaurer depuis JSON
- **Bifurquer**

### Liens Directs

Démarrez via URL :

- **Par nom:** `/#/chat?chars=Socrates,Confucius`
- **Par ID:** `/#/chat?chars=socrates,confucius`
- **Par catégorie:** `/#/chat?category=philosophy`
- **Chat individuel:** `/#/chat?chars=socrates`
- **Noms personnalisés:** `/#/chat?chars=Ada Lovelace,Linus Torvalds` (les noms non reconnus créent des personnages automatiquement)

Catégories disponibles: `philosophy`, `strategy`, `business`, `finance`, `history`, `sociology`, `psychology`, `science`, `literature`, `art`, `economics`, `politics`, `technology`, `religion`, `education`

Générez aussi des liens depuis l'interface.

**Routage linguistique :** Préfixe de langue dans l'URL. 18 langues.

## Plus de Fonctionnalités

En plus de ce qui précède :

- **140+ penseurs** dans 15 domaines
- **Personnages personnalisés**
- **Recherche** · **Favoris** · **Synchronisation** (AES)
- **Niveau de réflexion** · **Modèles personnalisés** · **LLM personnalisé**
- **Multi-API** : OpenAI, Anthropic, DeepSeek + 5 autres
- **18 langues** · **Mode sombre** · **Responsive** · **Local-first**

## APIs Supportées

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

Tous supportent les IDs personnalisés. Par défaut : DeepSeek Chat.

## Démarrage Rapide

```bash
npm install
npm run dev
```

Ouvrez http://localhost:5173, allez dans Paramètres, entrez votre clé API.

## Proxy CORS

Certains fournisseurs bloquent les requêtes directes. Configurez le proxy CORS par fournisseur.

Pour déployer le vôtre, créez un [Cloudflare Worker](https://dash.cloudflare.com) :

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

## Structure du Projet

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

## Stack Technique

React 19, Vite, Tailwind CSS v4, Zustand, i18next, React Router, TypeScript

## Scripts

| Commande | Description |
|----------|-------------|
| `npm run dev` | Serveur de développement |
| `npm run build` | Vérification + compilation |
| `npm run test` | Exécuter les tests |
| `npm run preview` | Aperçu production |

## Déploiement

Compilez et déployez `dist/` sur n'importe quel hébergement statique :

```bash
npm run build
```

Routage hash (`/#/chat/...`), aucune configuration serveur nécessaire.

## À propos du Plan 365

Projet #002 du [Plan Open Source 365](https://github.com/rockbenben/365opensource).

1 personne + IA, 300+ projets open source en un an. [Soumettez votre idée →](https://my.feishu.cn/share/base/form/shrcnI6y7rrmlSjbzkYXh6sjmzb)

## License

MIT
