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

**Modèles** — réglez le **niveau de réflexion** (désactivé / faible / moyen / élevé), saisissez un **ID de modèle personnalisé**, ou connectez n'importe quelle **API compatible OpenAI** en tant que fournisseur personnalisé. Par défaut : DeepSeek V4 Flash. Le contrôle de réflexion n'apparaît que pour les modèles qui le prennent réellement en charge, et les fournisseurs sans interrupteur d'arrêt (Gemini, Grok, Groq, Cerebras, Moonshot) nomment leur niveau le plus bas **Min** plutôt que « désactivé » : il raisonne encore et facture encore, donc écrire « désactivé » serait mensonger.

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

**Routage linguistique** — préfixez l'URL avec une langue pour définir la langue de l'interface, par ex. `/#/ja/chat`, `/#/ko/chat?chars=socrates`. Les 18 langues sont prises en charge.

## APIs Supportées

25 fournisseurs prêts à l'emploi — internationaux, basés en Chine et agrégateurs :

- **International** — OpenAI · Anthropic · Google Gemini · xAI Grok · Mistral · Cohere
- **Chine** — DeepSeek · Qwen · Moonshot Kimi · Doubao · Xiaomi MiMo · Zhipu GLM · MiniMax · StepFun · Baidu Qianfan · Tencent TokenHub · Volcengine Coding Plan · Alibaba Bailian Coding Plan
- **Agrégateurs & hébergement** — OpenRouter · OpenCode Zen · Groq · Cerebras · SiliconFlow · AtlasCloud · NVIDIA NIM

La liste des modèles à jour de chaque fournisseur se trouve dans les Paramètres : les identifiants changent trop vite pour être recopiés ici.

Qwen, MiMo, Moonshot, Zhipu, MiniMax et TokenHub proposent leurs hôtes régionaux en un clic. Au-delà, **chaque** fournisseur — Anthropic et Gemini compris — dispose d'un champ d'endpoint libre, car on ne peut pas prévoir quel upstream bloquera un navigateur. L'endpoint et le proxy CORS sont indépendants : vous pouvez viser votre propre passerelle tout en restant en connexion directe, ou passer par le proxy vers l'hôte officiel.

Tous les fournisseurs acceptent des IDs de modèle personnalisés. **Exécuter un modèle en local** : l'option **Custom** accepte n'importe quelle adresse compatible OpenAI, avec des points de départ en un clic pour LM Studio, Ollama, llama.cpp, LiteLLM, Together AI et Fireworks AI (chacun avec un lien vers sa doc). Les serveurs locaux n'ont pas besoin de clé : l'adresse _est_ l'identifiant, le champ clé reste donc facultatif.

## Proxy CORS

Certains fournisseurs n'envoient pas d'en-têtes CORS : un navigateur ne peut donc pas les joindre directement. Le proxy est une bascule par fournisseur dans les Réglages, et un proxy public (`https://cors.api2026.workers.dev`) est utilisé par défaut.

**Il est déjà actif pour les fournisseurs qui en ont besoin** — OpenCode Zen, Tencent TokenHub, NVIDIA NIM et les deux entrées Coding Plan — car sans lui ils ne fonctionnent tout simplement pas. Tout le reste se connecte directement par défaut.

> **À savoir, que vous l'ayez activé ou que vous l'ayez trouvé activé.** Tout le reste ici est local-first ; une requête relayée ne l'est pas. Votre clé API et le prompt complet transitent par ce proxy avant d'atteindre le fournisseur. Ce qui compte, c'est ce que le proxy en fait, alors concrètement : il relaie, rien de plus — tout le trajet de la requête est un unique `fetch` de passage, sans journalisation ni stockage d'aucune sorte ([lisez-le](../../scripts/cors-proxy-worker.js), c'est court). Il ne relaie qu'aux hôtes déclarés dans ce fichier : ce n'est donc pas un proxy ouvert que quelqu'un pourrait pointer vers n'importe quelle cible.
>
> Rien de tout cela ne change le fait que la requête passe par une machine exploitée par ce projet. Si cela compte pour votre clé, déployez le vôtre — environ deux minutes.

Pour le vôtre, déployez un [Cloudflare Worker](https://dash.cloudflare.com) avec ce code, puis pointez les Réglages dessus :

[`scripts/cors-proxy-worker.js`](../../scripts/cors-proxy-worker.js)

## Développement

```text
src/
  adapters/       # LLM API adapters (OpenAI-compatible, plus native Anthropic and Gemini)
  characters/     # Character presets and custom character generation
  components/     # React components
  hooks/          # useChat, useRoundtable
  i18n/           # Internationalization
  pages/          # composants de route : ChatPage, SettingsView, SharedView
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