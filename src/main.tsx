import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import i18n, { ensureLanguageLoaded, resolveSupported } from './i18n';
import { useSettingsStore } from './stores/settings';
import { presetCharacters } from './characters/presets';
import App from './App';
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
        characters: { [c.id]: { name: c.displayName, era: i18n.t('common.unknown', { lng }), questions: [] } },
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
    <App />
  </StrictMode>,
);
