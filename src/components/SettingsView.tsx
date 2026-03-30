import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { useSettingsStore } from '../stores/settings';
import { getAllAdapters, getAdapter } from '../adapters/registry';
import { getStorageUsage } from '../utils/storage';
import { downloadFile } from '../utils/export';
import { useConversationStore } from '../stores/conversations';

export function SettingsView() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const settings = useSettingsStore();
  const conversations = useConversationStore((s) => s.conversations);
  const adapters = getAllAdapters();

  const currentAdapter = getAdapter(settings.defaultProvider);

  const handleExportAll = () => {
    const data = JSON.stringify(conversations, null, 2);
    downloadFile(data, 'legend-talk-conversations.json', 'application/json');
  };

  return (
    <div className="max-w-2xl mx-auto p-6 space-y-8">
      <div className="flex items-center gap-3">
        <button
          onClick={() => navigate(-1)}
          className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500"
        >
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
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
              const modelMap = JSON.parse(localStorage.getItem('legend-talk-provider-models') || '{}');
              modelMap[prev] = settings.defaultModel;
              localStorage.setItem('legend-talk-provider-models', JSON.stringify(modelMap));
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
              {t('settings.apiKeys')}
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
            <label className="text-sm font-medium text-gray-600 dark:text-gray-400">{t('settings.customBaseUrl')}</label>
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
              <h3 className="text-lg font-semibold">{t('settings.corsProxy')}</h3>
              <p className="text-xs text-gray-400">{t('settings.corsProxyHint')}</p>
            </div>
            <button
              onClick={() => settings.setCorsEnabled(settings.defaultProvider, !settings.corsEnabled[settings.defaultProvider])}
              className={`relative w-11 h-6 rounded-full transition-colors ${settings.corsEnabled[settings.defaultProvider] ? 'bg-blue-500' : 'bg-gray-300 dark:bg-gray-600'}`}
            >
              <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${settings.corsEnabled[settings.defaultProvider] ? 'translate-x-5' : ''}`} />
            </button>
          </div>
          {settings.corsEnabled[settings.defaultProvider] && (
            <input
              type="text"
              value={settings.corsProxy}
              onChange={(e) => settings.setCorsProxy(e.target.value)}
              placeholder={t('settings.corsProxyPlaceholder')}
              className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          )}
        </section>
      )}

      {/* Language & Theme */}
      <section className="flex gap-8">
        <div>
          <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">{t('settings.language')}</h3>
          <select
            value={i18n.language.startsWith('zh') ? 'zh' : 'en'}
            onChange={(e) => {
              i18n.changeLanguage(e.target.value);
              settings.setLanguage(e.target.value);
            }}
            className="px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800"
          >
            <option value="zh">中文</option>
            <option value="en">English</option>
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

      {/* Data Management */}
      <section>
        <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">{t('settings.storageUsed', { size: getStorageUsage() })}</h3>
        <div className="flex gap-3">
          <button
            onClick={handleExportAll}
            className="px-4 py-2 text-sm rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800"
          >
            {t('chat.exportJSON')}
          </button>
          <button
            onClick={() => {
              if (confirm(t('common.confirm'))) {
                localStorage.clear();
                window.location.reload();
              }
            }}
            className="px-4 py-2 text-sm rounded-lg text-red-500 border border-red-200 dark:border-red-800 hover:bg-red-50 dark:hover:bg-red-900/20"
          >
            {t('settings.clearData')}
          </button>
        </div>
      </section>
    </div>
  );
}
