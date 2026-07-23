<p align="center">
  <img src="../../public/logo.png" width="84" height="84" alt="Legend Talk logo" />
</p>

<h1 align="center">Legend Talk</h1>

<p align="center">
  Plan Open Source 365 #002 · Table ronde IA avec les plus grands penseurs de l'histoire
</p>

<p align="center">
  <a href="../../README.md">English</a> ·
  <a href="../../README.zh.md">简体中文</a> ·
  <a href="README.zh-Hant.md">繁體中文</a> ·
  <a href="README.ja.md">日本語</a> ·
  <a href="README.ko.md">한국어</a> ·
  <a href="README.es.md">Español</a> ·
  <b>Français</b> ·
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

> **Réunissez les plus grands esprits de l'histoire autour d'une même table et laissez-les débattre de votre question.**

Legend Talk réunit 2 à 10 penseurs historiques ou contemporains dans un débat multi-tours. À chaque tour, chaque voix argumente selon son propre cadre de pensée ; un modérateur cartographie ensuite les désaccords et ouvre le tour suivant. Socrate met à l'épreuve les présupposés de Munger pendant que Nietzsche les conteste tous les deux.

**Trois façons de commencer :**

- **Poser une question** — saisissez un sujet et l'IA assemble un panel de 3 à 5 penseurs conçu pour une tension productive.
- **Dresser la table** — choisissez vous-même 2 à 10 penseurs, ou tirez-en 5 au hasard.
- **Consulter un seul esprit** — un échange en tête-à-tête avec l'un des 161 penseurs, chacun raisonnant selon son propre cadre, et non un jeu de rôle IA générique.

**Démo :** [talk.newzone.top](https://talk.newzone.top) — 18 langues · gratuit · local-first · sans inscription.

|                 Accueil                  |                 Chat                  |
| :--------------------------------------: | :-----------------------------------: |
| ![Accueil](../../docs/images/home-chat.png) | ![Chat](../../docs/images/chat-view.png) |

## Démarrer une conversation

**Table ronde automatique** — saisissez un sujet dans la barre de saisie de la page d'accueil. L'IA choisit 3 à 5 penseurs dont les points de vue s'opposent réellement et lance le débat immédiatement, sans avoir à choisir de personnages.

**Table ronde manuelle** — cliquez sur **+** sur 2 à 10 cartes de personnages pour composer votre équipe. Une barre flottante affiche vos choix :

- Cliquez sur un avatar pour le retirer
- **Démarrer la discussion** pour lancer
- **Copier le lien de l'équipe** pour partager la composition exacte sous forme d'URL

Ou cliquez sur **🎲 Aléatoire** (en haut à droite) pour démarrer instantanément avec 5 penseurs au hasard.

**Modèles en vedette** — 6 compositions soigneusement sélectionnées dont les perspectives s'affrontent réellement (par ex. _IA & Tech_ : Karpathy vs Ilya vs Feynman vs Taleb vs Paul Graham). Un clic pour démarrer, chacune avec 3 sujets suggérés.

**Chat 1 à 1** — cliquez sur **Chat** sur n'importe quelle carte de personnage pour une conversation privée dans la voix et le cadre de pensée de ce penseur.

**Suggestions de sujets** — avant votre premier message, chaque mode propose des sujets pour vous lancer : 3 questions sélectionnées par modèle (dans les 18 langues), ou 1 question tirée de chaque penseur choisi dans une composition manuelle (mise à jour à mesure que vous ajoutez ou retirez des personnes).

## Orienter la discussion

Vous siégez en bout de table en tant que **président** — le débat se déroule selon vos règles.

- **Modérateur** — après chaque tour, un modérateur IA en fait la synthèse : il regroupe les arguments par idée, nomme un angle que le tour a laissé inexploré et pose une question ouverte pour le suivant.
- **Recentrer en cours de débat** — envoyez un message pendant une table ronde pour la réorienter. Au lieu de s'exécuter automatiquement, une **carte de focus** modifiable apparaît ; elle s'empile sur tout focus antérieur afin que les orientations précédentes ne soient pas perdues. Affinez-la, puis **Démarrez** les tours suivants en l'ancrant dessus.
- **Appliquer et recommencer** — modifiez n'importe quel message et régénérez à partir de ce point. Les orientations du président portent un instantané du focus, de sorte qu'un nouvel essai se reconstruit à partir de l'état exact du focus actif au moment de l'envoi du message.
- **Configurer les tours** — choisissez combien de tours les penseurs débattent avant de marquer une pause, et **Continuez** pour en ajouter d'autres une fois qu'ils ont terminé.
- **Ajouter ou retirer des participants** à tout moment — transformez un tête-à-tête en table ronde, ou l'inverse.
- **Arrêter** — annulez la génération en cours ; tout ce qui a déjà été écrit est conservé.
- **Bifurquer** — créez une nouvelle conversation à partir de n'importe quel message, en emportant le contexte antérieur avec elle.

## Enregistrer, rechercher et partager

- **Résumer** — un résumé IA en un clic qui extrait les points de vue essentiels et les désaccords.
- **Recherche** — retrouvez n'importe quoi dans toutes les conversations par titre, nom de penseur ou contenu de message.
- **Favoris** — épinglez vos penseurs les plus utilisés pour un accès rapide.
- **Partager une conversation** — générez une URL contenant la conversation complète.
- **Exporter / Importer** — enregistrez en Markdown ou JSON et restaurez depuis JSON (dans les Paramètres), ou générez des cartes de partage via [json2card](https://github.com/rockbenben/json2card) (configurez le point d'accès API dans les Paramètres).
- **Synchronisation des paramètres** — transférez votre configuration vers un autre appareil via une URL ; les clés API sont chiffrées en AES.

## Démarrage Rapide

```bash
npm install
npm run dev
```

Ouvrez http://localhost:5173, allez dans Paramètres, entrez votre clé API et commencez à discuter. Si vous rencontrez une erreur CORS, l'application propose d'activer un proxy public en un clic.

## Penseurs, modèles et plateforme

**161 penseurs prédéfinis** répartis dans 15 domaines, classés par notoriété — saisissez n'importe quel nom pour créer un personnage personnalisé à la volée.

**Modèles** — réglez le **niveau de réflexion** (désactivé / faible / moyen / élevé), saisissez un **ID de modèle personnalisé**, ou connectez n'importe quelle **API compatible OpenAI** en tant que fournisseur personnalisé. Par défaut : DeepSeek V4 Flash.

**Plateforme** — 18 langues · mode sombre · responsive · **local-first** (double écriture IndexedDB + localStorage, fonctionne dans WeChat et les WebViews restreintes) · **zéro CDN** (polices auto-hébergées et intégrées, donc fonctionne hors ligne et derrière des pare-feu).

## Liens directs

Démarrez une conversation directement depuis une URL :

- **Par nom :** `/#/chat?chars=苏格拉底,孔子` ou `/#/chat?chars=Socrates,Confucius`
- **Par ID :** `/#/chat?chars=socrates,confucius`
- **Par catégorie :** `/#/chat?category=philosophy` (table ronde de tous les penseurs de cette catégorie, plafonnée à 10)
- **Chat individuel :** `/#/chat?chars=socrates`
- **Noms personnalisés :** `/#/chat?chars=Ada Lovelace,Linus Torvalds` (les noms non reconnus deviennent des personnages personnalisés)

Catégories : `philosophy`, `strategy`, `business`, `finance`, `history`, `sociology`, `psychology`, `science`, `literature`, `art`, `economics`, `politics`, `technology`, `religion`, `education`.

Les boutons **Copier le lien de l'équipe** (barre des participants) et **Copier le lien de catégorie** (filtre de catégorie) génèrent ces URL depuis l'interface.

**Routage linguistique** — préfixez l'URL avec une langue pour définir la langue de l'interface, par ex. `/#/ja/chat`, `/#/ko/chat?chars=socrates`, ou utilisez `?lang=zh`. Les 18 langues sont prises en charge.

## APIs Supportées

24 fournisseurs prêts à l'emploi — internationaux, basés en Chine et agrégateurs :

| Provider                           | Models                                                                                              |
| ---------------------------------- | --------------------------------------------------------------------------------------------------- |
| OpenAI                             | GPT-5.5, GPT-5.4, GPT-5.4 Mini                                                                      |
| Anthropic                          | Claude Opus 4.7, Claude Sonnet 4.6, Claude Haiku 4.5                                                |
| Google Gemini                      | Gemini 3.1 Pro, Gemini 3.5 Flash                                                                    |
| xAI Grok                           | Grok 4.3, Grok 4.20 series                                                                          |
| Mistral / Cohere                   | Mistral Medium 3.5 / Large 3, Command A series                                                      |
| DeepSeek                           | DeepSeek V4 Flash, V4 Pro                                                                           |
| Moonshot / Kimi                    | Kimi K2.6, K2.5                                                                                     |
| Zhipu GLM                          | GLM-5.1, GLM-5, GLM-4.7 series                                                                      |
| MiniMax / Hunyuan / Qianfan / MiMo | MiniMax M2.7, Hunyuan 2.0, ERNIE 5.1, MiMo V2.5                                                     |
| Volcengine Coding Plan             | Doubao Seed 2.0, Kimi K2.5, GLM-4.7, DeepSeek V4                                                    |
| Alibaba Bailian Coding Plan        | Qwen 3.6 Max/Plus/Flash, Kimi K2.5, GLM-5                                                           |
| Aggregators                        | OpenRouter, SiliconFlow, Groq, Cerebras, Together, Fireworks, Perplexity, NVIDIA NIM, GitHub Models |

Chaque fournisseur accepte des IDs de modèle personnalisés, et l'option **Custom** connecte n'importe quelle API compatible OpenAI.

## Proxy CORS

Certains fournisseurs bloquent les requêtes directes depuis le navigateur. Le proxy CORS se configure par fournisseur dans les Paramètres — activez-le. Un proxy public (`https://cors.api2026.workers.dev`) est utilisé par défaut.

> **À savoir avant de l'activer.** Tout le reste ici est local-first, mais une requête passée par un proxy ne l'est pas : votre clé d'API et l'intégralité du prompt transitent par ce proxy avant d'atteindre le fournisseur. Le proxy par défaut est opéré par ce projet, mais c'est vrai de n'importe quel proxy — c'est ce qu'est un proxy. Si la clé compte pour vous, déployez le vôtre avec le Worker ci-dessous et pointez les réglages dessus ; deux minutes suffisent.

Pour exécuter le vôtre, déployez un [Cloudflare Worker](https://dash.cloudflare.com) avec ce code :

<details>
<summary>Worker code</summary>

```javascript
export default {
  async fetch(request) {
    const url = new URL(request.url);
    const targetUrl = url.pathname.slice(1) + url.search;
    if (!targetUrl || !targetUrl.startsWith("https://")) {
      return new Response("Usage: /https://target-api.com/path", { status: 400 });
    }
    if (request.method === "OPTIONS") {
      return new Response(null, {
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
          "Access-Control-Allow-Headers": "*",
          "Access-Control-Max-Age": "86400",
        },
      });
    }
    const response = await fetch(targetUrl, {
      method: request.method,
      headers: request.headers,
      body: request.body,
    });
    const newResponse = new Response(response.body, response);
    newResponse.headers.set("Access-Control-Allow-Origin", "*");
    return newResponse;
  },
};
```

</details>

## Développement

```text
src/
  adapters/       # LLM API adapters (OpenAI-compatible, Anthropic)
  characters/     # Character presets and custom character generation
  components/     # React components
  hooks/          # useChat, useRoundtable
  i18n/           # Internationalization
  stores/         # Zustand state management
  utils/          # Prompt building, export, compression, storage
  types.ts        # Type definitions
```

**Stack :** React 19 · antd 6 (thème en variables CSS, profondément personnalisé) · Vite · Tailwind CSS v4 · Zustand · i18next · React Router · TypeScript

| Commande          | Description                                             |
| ----------------- | ------------------------------------------------------- |
| `npm run dev`     | Serveur de développement                                |
| `npm run build`   | Vérification de types et compilation pour la production |
| `npm run test`    | Exécuter les tests                                      |
| `npm run preview` | Aperçu de la version de production                      |

## Déploiement

Compilez et hébergez le dossier `dist/` sur n'importe quel hébergement statique (Vercel, Netlify, GitHub Pages, …) :

```bash
npm run build
```

Le routage est basé sur le hash (`/#/chat/...`, `/#/ja/chat/...`), aucune configuration de routage côté serveur n'est donc nécessaire.

## À propos du 365 Open Source Plan

Projet **#002** du [365 Open Source Plan](https://github.com/rockbenben/365opensource) — une personne + l'IA, plus de 300 projets open source en un an. [Proposez votre idée →](https://365.aishort.top/) · [Discord](https://discord.gg/PZTQfJ4GjX) · [Telegram](https://t.me/aishort_top)