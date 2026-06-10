import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
// Self-hosted fonts (bundled into dist/ — works offline, no CDN).
// Cormorant: display serif (titles, speaker names). Spectral: body serif.
// Noto Serif SC: CJK serif, unicode-range sliced so only used glyph ranges load.
// Fraunces: brand wordmark only.
import '@fontsource/fraunces/700.css';
import '@fontsource/fraunces/600-italic.css';
import '@fontsource/cormorant/500.css';
import '@fontsource/cormorant/600.css';
import '@fontsource/cormorant/700.css';
import '@fontsource/cormorant/500-italic.css';
import '@fontsource/cormorant/600-italic.css';
import '@fontsource/spectral/400.css';
import '@fontsource/spectral/500.css';
import '@fontsource/spectral/600.css';
import '@fontsource/spectral/400-italic.css';
import '@fontsource/spectral/500-italic.css';
import '@fontsource/noto-serif-sc/400.css';
import '@fontsource/noto-serif-sc/600.css';
import '@fontsource/noto-serif-sc/700.css';
import i18n, { ensureLanguageLoaded, resolveSupported } from './i18n';
import { useSettingsStore } from './stores/settings';
import { presetCharacters } from './characters/presets';
import App from './App';
import { ThemeProvider } from './components/ThemeProvider';
import './index.css';

// Inject saved custom characters into runtime
function injectCustomCharacters() {
  const customs = useSettingsStore.getState().customCharacters || [];
  for (const c of customs) {
    if (!presetCharacters.find((p) => p.id === c.id)) {
      presetCharacters.push({ id: c.id, domain: c.domain, avatar: c.avatar, color: c.color, systemPrompt: c.systemPrompt });
    }
    for (const lng of Object.keys(i18n.store.data)) {
      i18n.addResourceBundle(lng, 'translation', {
        characters: { [c.id]: { name: c.displayName, era: c.era || i18n.t('common.unknown', { lng }), questions: [] } },
      }, true, true);
    }
  }
}
injectCustomCharacters();

// Sync i18n with persisted user preference on startup
const savedLang = resolveSupported(useSettingsStore.getState().language);
if (savedLang && i18n.language !== savedLang) {
  ensureLanguageLoaded(savedLang).then(() => i18n.changeLanguage(savedLang));
}

// Handle async hydration from IndexedDB (when localStorage is unavailable)
useSettingsStore.persist.onFinishHydration((state) => {
  const lng = resolveSupported(state.language);
  if (lng && i18n.language !== lng) {
    ensureLanguageLoaded(lng).then(() => i18n.changeLanguage(lng));
  }
  injectCustomCharacters();
});

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ThemeProvider>
      <App />
    </ThemeProvider>
  </StrictMode>,
);
