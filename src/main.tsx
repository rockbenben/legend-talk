import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import i18n from './i18n';
import { useSettingsStore } from './stores/settings';
import App from './App';
import './index.css';

// Sync i18n with persisted user preference on startup
const savedLang = useSettingsStore.getState().language;
if (savedLang && i18n.language !== savedLang) {
  i18n.changeLanguage(savedLang);
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
