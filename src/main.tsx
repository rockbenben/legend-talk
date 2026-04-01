import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import i18n, { ensureLanguageLoaded, resolveSupported } from './i18n';
import { useSettingsStore } from './stores/settings';
import App from './App';
import './index.css';

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
});

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
