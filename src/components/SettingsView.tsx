import { useState, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useSettingsStore } from '../stores/settings';
import { getAllAdapters, getAdapter } from '../adapters/registry';
import { getStorageUsage } from '../utils/storage';
import { downloadFile } from '../utils/export';
import { compressToBase64, decompressFromBase64 } from '../utils/compress';
import { useConversationStore } from '../stores/conversations';
import { clearAllStorage } from '../utils/persistStorage';
import { ensureLanguageLoaded } from '../i18n';
import { useLangPath } from '../hooks/useLangPath';
import { CharacterEditor } from './CharacterEditor';
import { Avatar } from './Avatar';
import { presetCharacters } from '../characters/presets';
import type { CustomCharacter } from '../stores/settings';

export function SettingsView() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const lp = useLangPath();
  const [searchParams, setSearchParams] = useSearchParams();
  const settings = useSettingsStore();
  const conversations = useConversationStore((s) => s.conversations);
  const importConversations = useConversationStore((s) => s.importConversations);
  const adapters = getAllAdapters();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [importStatus, setImportStatus] = useState<string | null>(null);
  const [shareStatus, setShareStatus] = useState<string | null>(null);

  const currentAdapter = getAdapter(settings.defaultProvider);

  // AES-GCM encrypt/decrypt via Web Crypto API
  async function deriveKey(password: string, salt: Uint8Array) {
    const keyMaterial = await crypto.subtle.importKey('raw', new TextEncoder().encode(password), 'PBKDF2', false, ['deriveKey']);
    return crypto.subtle.deriveKey({ name: 'PBKDF2', salt: salt as BufferSource, iterations: 50000, hash: 'SHA-256' }, keyMaterial, { name: 'AES-GCM', length: 256 }, false, ['encrypt', 'decrypt']);
  }

  async function encrypt(text: string, password: string): Promise<string> {
    const salt = crypto.getRandomValues(new Uint8Array(16));
    const iv = crypto.getRandomValues(new Uint8Array(12));
    const key = await deriveKey(password, salt);
    const ct = new Uint8Array(await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, new TextEncoder().encode(text)));
    const buf = new Uint8Array(16 + 12 + ct.length);
    buf.set(salt); buf.set(iv, 16); buf.set(ct, 28);
    let binary = '';
    for (let i = 0; i < buf.length; i++) binary += String.fromCharCode(buf[i]);
    return btoa(binary);
  }

  async function decrypt(encoded: string, password: string): Promise<string> {
    const buf = Uint8Array.from(atob(encoded), c => c.charCodeAt(0));
    const key = await deriveKey(password, buf.slice(0, 16));
    const plain = await crypto.subtle.decrypt({ name: 'AES-GCM', iv: buf.slice(16, 28) }, key, buf.slice(28));
    return new TextDecoder().decode(plain);
  }

  function applyConfig(config: Record<string, unknown>) {
    const s = useSettingsStore.getState();
    if (typeof config.defaultProvider === 'string') s.setDefaultProvider(config.defaultProvider);
    if (typeof config.defaultModel === 'string') s.setDefaultModel(config.defaultModel);
    if (typeof config.language === 'string') { const lng = config.language; s.setLanguage(lng); ensureLanguageLoaded(lng).then(() => i18n.changeLanguage(lng)); }
    if (config.theme === 'light' || config.theme === 'dark') s.setTheme(config.theme);
    if (['off', 'low', 'medium', 'high'].includes(config.thinkingLevel as string)) s.setThinkingLevel(config.thinkingLevel as 'off' | 'low' | 'medium' | 'high');
    if (typeof config.corsProxy === 'string') s.setCorsProxy(config.corsProxy);
    if (typeof config.customBaseUrl === 'string') s.setCustomBaseUrl(config.customBaseUrl);
    if (config.corsEnabled && typeof config.corsEnabled === 'object') Object.entries(config.corsEnabled as Record<string, boolean>).forEach(([k, v]) => { if (typeof v === 'boolean') s.setCorsEnabled(k, v); });
    if (Array.isArray(config.customCharacters)) {
      for (const c of config.customCharacters as CustomCharacter[]) {
        if (c.id && c.displayName && c.systemPrompt) s.saveCustomCharacter(c);
      }
    }
  }

  // Import settings from URL hash param (not query param — hash never leaves browser)
  const importedRef = useRef(false);
  useEffect(() => {
    const configParam = searchParams.get('config');
    if (!configParam || importedRef.current) return;
    importedRef.current = true;
    setSearchParams({}, { replace: true });

    (async () => {
      try {
        const parsed = JSON.parse(await decompressFromBase64(configParam));
        const { _encrypted, ...config } = parsed;

        // Confirm before applying
        const summary = [
          config.defaultProvider && `Provider: ${config.defaultProvider}`,
          config.defaultModel && `Model: ${config.defaultModel}`,
          config.corsProxy && `CORS Proxy: ${config.corsProxy}`,
          config.customBaseUrl && `Custom URL: ${config.customBaseUrl}`,
          config.language && `Language: ${config.language}`,
          config.theme && `Theme: ${config.theme}`,
          _encrypted && 'API Keys (encrypted)',
        ].filter(Boolean).join('\n');
        if (!confirm(`${t('chat.settingsImported')}?\n\n${summary}`)) return;

        applyConfig(config);

        if (_encrypted) {
          const password = prompt(t('chat.enterDecryptPassword'));
          if (password) {
            const keys = JSON.parse(await decrypt(_encrypted, password));
            Object.entries(keys).forEach(([k, v]) => useSettingsStore.getState().setApiKey(k, v as string));
          }
        }
        setShareStatus(t('chat.settingsImported'));
      } catch {
        setShareStatus(t('chat.importError'));
      }
      setTimeout(() => setShareStatus(null), 5000);
    })();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleShareSettings = async () => {
    const config: Record<string, unknown> = {
      defaultProvider: settings.defaultProvider,
      defaultModel: settings.defaultModel,
      language: settings.language,
      theme: settings.theme,
      corsProxy: settings.corsProxy,
      corsEnabled: settings.corsEnabled,
      customBaseUrl: settings.customBaseUrl,
      thinkingLevel: settings.thinkingLevel,
      customCharacters: settings.customCharacters.length > 0 ? settings.customCharacters : undefined,
    };

    const password = prompt(t('chat.enterPassword'));
    if (password) {
      config._encrypted = await encrypt(JSON.stringify(settings.apiKeys), password);
    }

    const base64 = await compressToBase64(JSON.stringify(config));
    // Use hash fragment — query params would be sent to servers via referrer headers
    const url = `${window.location.origin}${window.location.pathname}#${lp('/settings')}?config=${base64}`;
    try {
      await navigator.clipboard.writeText(url);
      setShareStatus(t('chat.copied'));
    } catch {
      prompt(t('chat.copied'), url); // Fallback: show URL for manual copy
    }
    setTimeout(() => setShareStatus(null), 2000);
  };

  const handleExportAll = () => {
    const data = JSON.stringify(conversations, null, 2);
    downloadFile(data, 'legend-talk-conversations.json', 'application/json');
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const data = JSON.parse(reader.result as string);
        const arr = Array.isArray(data) ? data : [];
        const valid = arr.filter((c: unknown) =>
          c && typeof c === 'object' && 'id' in c && 'messages' in c && Array.isArray((c as { messages: unknown }).messages),
        );
        if (valid.length === 0) throw new Error('invalid');
        const count = importConversations(valid);
        setImportStatus(t('chat.importSuccess', { count }));
      } catch {
        setImportStatus(t('chat.importError'));
      }
      setTimeout(() => setImportStatus(null), 3000);
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  return (
    <div className="max-w-2xl mx-auto p-6 space-y-8">
      <div className="flex items-center gap-3">
        <button
          onClick={() => navigate(-1)}
          className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500"
        >
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5 rtl:-scale-x-100">
            <polyline points="15 18 9 12 15 6" />
          </svg>
        </button>
        <h2 className="text-2xl font-bold">{t('settings.title')}</h2>
      </div>

      {/* Provider + Model + Key — one cohesive section */}
      <section className="space-y-4">
        <div>
          <h3 className="text-lg font-semibold mb-2">{t('settings.defaultProvider')}</h3>
          <select
            value={settings.defaultProvider}
            onChange={(e) => {
              const prev = settings.defaultProvider;
              const next = e.target.value;
              let modelMap: Record<string, string> = {};
              try { modelMap = JSON.parse(localStorage.getItem('legend-talk-provider-models') || '{}'); } catch { /* ok */ }
              modelMap[prev] = settings.defaultModel;
              try { localStorage.setItem('legend-talk-provider-models', JSON.stringify(modelMap)); } catch { /* ok */ }
              settings.setDefaultProvider(next);
              const saved = modelMap[next];
              if (saved) {
                settings.setDefaultModel(saved);
              } else {
                const newAdapter = getAdapter(next);
                settings.setDefaultModel(newAdapter?.models[0]?.id || '');
              }
            }}
            className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800"
          >
            {adapters.map((a) => (
              <option key={a.id} value={a.id}>{a.name}</option>
            ))}
          </select>
        </div>

        {/* API Key — only for selected provider */}
        <div>
          <div className="flex items-center gap-2 mb-1">
            <label className="text-sm font-medium text-gray-600 dark:text-gray-400">
              API Keys
            </label>
            {currentAdapter?.apiKeyUrl && (
              <a href={currentAdapter.apiKeyUrl} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-500 hover:underline">
                Get Key ↗
              </a>
            )}
          </div>
          <input
            type="password"
            value={settings.apiKeys[settings.defaultProvider] || ''}
            onChange={(e) => settings.setApiKey(settings.defaultProvider, e.target.value)}
            placeholder={t('settings.apiKeyPlaceholder', { provider: currentAdapter?.name || '' })}
            className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Custom base URL */}
        {settings.defaultProvider === 'custom' && (
          <div>
            <label className="text-sm font-medium text-gray-600 dark:text-gray-400">API Base URL</label>
            <p className="text-xs text-gray-400 mb-1">{t('settings.customBaseUrlHint')}</p>
            <input
              type="text"
              value={settings.customBaseUrl}
              onChange={(e) => settings.setCustomBaseUrl(e.target.value)}
              placeholder="https://api.example.com/v1"
              className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        )}

        {/* Model */}
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400">{t('settings.defaultModel')}</h3>
            {currentAdapter?.docsUrl && (
              <a href={currentAdapter.docsUrl} target="_blank" rel="noopener noreferrer" className="text-xs text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
                Docs ↗
              </a>
            )}
          </div>
          <select
            value={(currentAdapter?.models || []).some((m) => m.id === settings.defaultModel) ? settings.defaultModel : '__custom__'}
            onChange={(e) => {
              settings.setDefaultModel(e.target.value === '__custom__' ? '' : e.target.value);
            }}
            className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800"
          >
            {(currentAdapter?.models || []).map((m) => (
              <option key={m.id} value={m.id}>{m.name}</option>
            ))}
            <option value="__custom__">{t('settings.customModel')}</option>
          </select>
          {!(currentAdapter?.models || []).some((m) => m.id === settings.defaultModel) && (
            <input
              type="text"
              value={settings.defaultModel}
              onChange={(e) => settings.setDefaultModel(e.target.value)}
              placeholder="model-id"
              className="w-full mt-2 px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          )}
        </div>
      </section>

      {/* Thinking Level */}
      <section>
        <h3 className="text-lg font-semibold mb-1">{t('settings.thinkingLevel')}</h3>
        <p className="text-xs text-gray-400 mb-2">{t('settings.thinkingLevelHint')}</p>
        <select
          value={settings.thinkingLevel}
          onChange={(e) => settings.setThinkingLevel(e.target.value as 'off' | 'low' | 'medium' | 'high')}
          className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800"
        >
          <option value="off">{t('settings.thinkingOff')}</option>
          <option value="low">{t('settings.thinkingLow')}</option>
          <option value="medium">{t('settings.thinkingMedium')}</option>
          <option value="high">{t('settings.thinkingHigh')}</option>
        </select>
      </section>

      {/* CORS Proxy */}
      {settings.defaultProvider !== 'custom' && (
        <section>
          <div className="flex items-center justify-between mb-2">
            <div>
              <h3 className="text-lg font-semibold">CORS Proxy</h3>
              <p className="text-xs text-gray-400">{t('settings.corsProxyHint')}</p>
            </div>
            <button
              onClick={() => settings.setCorsEnabled(settings.defaultProvider, !settings.corsEnabled[settings.defaultProvider])}
              className={`relative w-11 h-6 rounded-full transition-colors ${settings.corsEnabled[settings.defaultProvider] ? 'bg-blue-500' : 'bg-gray-300 dark:bg-gray-600'}`}
            >
              <span className={`absolute top-0.5 start-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${settings.corsEnabled[settings.defaultProvider] ? 'ltr:translate-x-5 rtl:-translate-x-5' : ''}`} />
            </button>
          </div>
          {settings.corsEnabled[settings.defaultProvider] && (
            <input
              type="text"
              value={settings.corsProxy}
              onChange={(e) => settings.setCorsProxy(e.target.value)}
              placeholder="https://cors.api2026.workers.dev"
              className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          )}
        </section>
      )}

      {/* Language & Theme */}
      <section className="flex flex-col sm:flex-row gap-4 sm:gap-8">
        <div>
          <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">{t('settings.language')}</h3>
          <select
            value={i18n.language}
            onChange={(e) => {
              const lng = e.target.value;
              ensureLanguageLoaded(lng).then(() => {
                i18n.changeLanguage(lng);
                settings.setLanguage(lng);
              });
            }}
            className="px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800"
          >
            {((i18n.options.supportedLngs || []) as string[]).filter((l) => l !== 'cimode').map((lng) => (
              <option key={lng} value={lng}>
                {({ en: 'English', zh: '中文', 'zh-Hant': '繁體中文', ja: '日本語', ko: '한국어', es: 'Español', pt: 'Português', fr: 'Français', de: 'Deutsch', it: 'Italiano', ru: 'Русский', ar: 'العربية', tr: 'Türkçe', hi: 'हिन्दी', id: 'Indonesia', vi: 'Tiếng Việt', th: 'ไทย', bn: 'বাংলা' } as Record<string, string>)[lng] || lng}
              </option>
            ))}
          </select>
        </div>
        <div>
          <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">{t('settings.theme')}</h3>
          <select
            value={settings.theme}
            onChange={(e) => settings.setTheme(e.target.value as 'light' | 'dark')}
            className="px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800"
          >
            <option value="light">{t('settings.themeLight')}</option>
            <option value="dark">{t('settings.themeDark')}</option>
          </select>
        </div>
      </section>

      {/* Custom Characters */}
      <CustomCharactersSection />

      {/* Conversations */}
      <section>
        <h3 className="text-lg font-semibold mb-1">{t('settings.conversations')}</h3>
        <p className="text-xs text-gray-400 mb-2">{t('settings.storageUsed', { size: getStorageUsage() })}</p>
        <div className="flex flex-wrap gap-2">
          <button onClick={handleExportAll}
            className="px-4 py-2 text-sm rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800">
            {t('settings.exportAll')}
          </button>
          <button onClick={() => fileInputRef.current?.click()}
            className="px-4 py-2 text-sm rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800">
            {t('chat.importConversations')}
          </button>
          <input ref={fileInputRef} type="file" accept=".json" onChange={handleImport} className="hidden" />
        </div>
        {importStatus && (
          <p className={`mt-2 text-sm ${importStatus.includes(t('chat.importError')) ? 'text-red-500' : 'text-green-600 dark:text-green-400'}`}>
            {importStatus}
          </p>
        )}
      </section>

      {/* Settings Sync */}
      <section>
        <h3 className="text-lg font-semibold mb-1">{t('settings.settingsSync')}</h3>
        <p className="text-xs text-gray-400 mb-2">{t('settings.settingsSyncHint')}</p>
        <button onClick={handleShareSettings}
          className="px-4 py-2 text-sm rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800">
          {t('chat.shareSettings')}
        </button>
        {shareStatus && (
          <p className="mt-2 text-sm text-green-600 dark:text-green-400">{shareStatus}</p>
        )}
      </section>

      {/* Danger Zone */}
      <section>
        <button
          onClick={async () => {
            if (confirm(t('common.confirm'))) {
              await clearAllStorage();
              window.location.reload();
            }
          }}
          className="px-4 py-2 text-sm rounded-lg text-red-500 border border-red-200 dark:border-red-800 hover:bg-red-50 dark:hover:bg-red-900/20"
        >
          {t('settings.clearData')}
        </button>
      </section>
    </div>
  );
}

function CustomCharactersSection() {
  const { t } = useTranslation();
  const customCharacters = useSettingsStore((s) => s.customCharacters);
  const deleteCustomCharacter = useSettingsStore((s) => s.deleteCustomCharacter);

  const handleDelete = (id: string) => {
    deleteCustomCharacter(id);
    // Clean up runtime: remove from presetCharacters array
    const idx = presetCharacters.findIndex((c) => c.id === id);
    if (idx !== -1) presetCharacters.splice(idx, 1);
  };
  const [showEditor, setShowEditor] = useState(false);
  const [editingChar, setEditingChar] = useState<CustomCharacter | undefined>();

  return (
    <section>
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-lg font-semibold">{t('settings.customCharacters')}</h3>
        <button onClick={() => { setEditingChar(undefined); setShowEditor(true); }}
          className="text-xs px-3 py-1.5 rounded-lg border border-dashed border-gray-300 dark:border-gray-600 text-gray-500 hover:border-blue-400 hover:text-blue-500 transition-colors">
          + {t('chat.createCharacter')}
        </button>
      </div>
      {customCharacters.length === 0 ? (
        <p className="text-sm text-gray-400">{t('settings.noCustomCharacters')}</p>
      ) : (
        <div className="space-y-2">
          {customCharacters.map((c) => (
            <div key={c.id} className="flex items-center gap-3 p-2 rounded-lg border border-gray-200 dark:border-gray-700">
              <Avatar emoji={c.avatar} color={c.color} size="sm" />
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium truncate">{c.displayName}</div>
                <div className="text-xs text-gray-400 truncate">{c.era || c.systemPrompt.slice(0, 60)}</div>
              </div>
              <button onClick={() => { setEditingChar(c); setShowEditor(true); }}
                className="p-1.5 text-gray-400 hover:text-blue-500 text-xs shrink-0">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
                  <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" /><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                </svg>
              </button>
              <button onClick={() => handleDelete(c.id)}
                className="p-1.5 text-gray-400 hover:text-red-500 text-xs shrink-0">✕</button>
            </div>
          ))}
        </div>
      )}
      {showEditor && <CharacterEditor character={editingChar} onClose={() => setShowEditor(false)} />}
    </section>
  );
}
