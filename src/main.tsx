import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import i18n, { ensureLanguageLoaded } from './i18n';
import { useSettingsStore } from './stores/settings';
import App from './App';
import './index.css';

// Sync i18n with persisted user preference on startup
const savedLang = useSettingsStore.getState().language;
if (savedLang && i18n.language !== savedLang) {
  ensureLanguageLoaded(savedLang).then(() => i18n.changeLanguage(savedLang));
}

// Handle async hydration from IndexedDB (when localStorage is unavailable)
useSettingsStore.persist.onFinishHydration((state) => {
  if (state.language && i18n.language !== state.language) {
    ensureLanguageLoaded(state.language).then(() => i18n.changeLanguage(state.language));
  }
});

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
