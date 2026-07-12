import { useState, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Form, Input, Select, AutoComplete, Button, Switch, App, Typography, Space, Divider, Flex } from 'antd';
import { ArrowLeftOutlined, EditOutlined, CloseOutlined, PlusOutlined, ImportOutlined, ExportOutlined, ShareAltOutlined, ApiOutlined, SettingOutlined, UsergroupAddOutlined, DatabaseOutlined } from '@ant-design/icons';
import { useSettingsStore } from '../stores/settings';
import { getAllAdapters, getAdapter, PROVIDER_GROUPS } from '../adapters/registry';
import { resolveProvider } from '../utils/prompt';
import { getStorageUsage } from '../utils/storage';
import { downloadFile } from '../utils/export';
import { compressToBase64, decompressFromBase64 } from '../utils/compress';
import { encrypt, decrypt } from '../utils/crypto';
import { useConversationStore } from '../stores/conversations';
import { clearAllStorage } from '../utils/persistStorage';
import { ensureLanguageLoaded } from '../i18n';
import { useLangPath } from '../hooks/useLangPath';
import { CharacterEditor } from './CharacterEditor';
import { Avatar } from './Avatar';
import { presetCharacters } from '../characters/presets';
import { clearNameCache } from '../hooks/useRoundtable';
import type { CustomCharacter } from '../stores/settings';

const { Title, Text, Paragraph } = Typography;

const LANG_DISPLAY: Record<string, string> = {
  en: 'English', zh: '中文', 'zh-Hant': '繁體中文', ja: '日本語', ko: '한국어',
  es: 'Español', pt: 'Português', fr: 'Français', de: 'Deutsch', it: 'Italiano',
  ru: 'Русский', ar: 'العربية', tr: 'Türkçe', hi: 'हिन्दी', id: 'Indonesia',
  vi: 'Tiếng Việt', th: 'ไทย', bn: 'বাংলা',
};

export function SettingsView() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const lp = useLangPath();
  const { modal, message } = App.useApp();
  const [searchParams, setSearchParams] = useSearchParams();
  const settings = useSettingsStore();
  const conversations = useConversationStore((s) => s.conversations);
  const importConversations = useConversationStore((s) => s.importConversations);
  const adapters = getAllAdapters();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const currentAdapter = getAdapter(settings.defaultProvider);

  function applyConfig(config: Record<string, unknown>) {
    const s = useSettingsStore.getState();
    const pickStrings = (obj: unknown, allow?: string[]) =>
      Object.fromEntries(Object.entries((obj && typeof obj === 'object' ? obj : {}) as Record<string, unknown>)
        .filter(([, v]) => typeof v === 'string' && (!allow || allow.includes(v)))) as Record<string, string>;
    if (typeof config.defaultProvider === 'string') s.setDefaultProvider(config.defaultProvider);
    if (typeof config.defaultModel === 'string') s.setDefaultModel(config.defaultModel);
    // Merge per-provider memory AFTER the provider/model switch above: setDefaultProvider
    // snapshots the outgoing provider's active model into modelByProvider, so merging
    // first would let that snapshot clobber the just-imported value for the pre-import
    // active provider. Merging last lets imported memory win. Active model/thinking for
    // the incoming provider are set explicitly above, so they take precedence regardless.
    s.mergeProviderMemory(
      pickStrings(config.modelByProvider),
      pickStrings(config.thinkingByProvider, ['off', 'low', 'medium', 'high']) as Record<string, 'off' | 'low' | 'medium' | 'high'>,
    );
    if (typeof config.language === 'string') { const lng = config.language; s.setLanguage(lng); ensureLanguageLoaded(lng).then(() => i18n.changeLanguage(lng)); }
    if (config.theme === 'light' || config.theme === 'dark') s.setTheme(config.theme);
    if (['off', 'low', 'medium', 'high'].includes(config.thinkingLevel as string)) s.setThinkingLevel(config.thinkingLevel as 'off' | 'low' | 'medium' | 'high');
    if (typeof config.roundtableRounds === 'number' && config.roundtableRounds >= 1 && config.roundtableRounds <= 10) s.setRoundtableRounds(config.roundtableRounds);
    if (typeof config.corsProxy === 'string') s.setCorsProxy(config.corsProxy);
    if (typeof config.customBaseUrl === 'string') s.setCustomBaseUrl(config.customBaseUrl);
    if (typeof config.shareCardEndpoint === 'string') s.setShareCardEndpoint(config.shareCardEndpoint);
    if (config.corsEnabled && typeof config.corsEnabled === 'object') Object.entries(config.corsEnabled as Record<string, boolean>).forEach(([k, v]) => { if (typeof v === 'boolean') s.setCorsEnabled(k, v); });
    if (Array.isArray(config.customCharacters)) {
      for (const c of config.customCharacters as CustomCharacter[]) {
        if (!c.id || !c.displayName || !c.systemPrompt) continue;
        const domain = Array.isArray(c.domain) && c.domain.length > 0 ? c.domain : ['custom'];
        s.saveCustomCharacter({ ...c, domain });
        // Inject into the runtime registry + i18n now — without this, imported
        // characters stay invisible (and their names unresolvable) until reload.
        const existing = presetCharacters.find((p) => p.id === c.id);
        if (existing) {
          Object.assign(existing, { avatar: c.avatar, color: c.color, systemPrompt: c.systemPrompt });
        } else {
          presetCharacters.push({ id: c.id, domain, avatar: c.avatar || '👤', color: c.color || 'blue', systemPrompt: c.systemPrompt });
        }
        for (const lng of Object.keys(i18n.store.data)) {
          i18n.addResourceBundle(lng, 'translation', {
            characters: { [c.id]: { name: c.displayName, era: c.era || i18n.t('common.unknown', { lng }), questions: [] } },
          }, true, true);
        }
      }
      clearNameCache();
    }
  }

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
        const summary = [
          config.defaultProvider && `Provider: ${config.defaultProvider}`,
          config.defaultModel && `Model: ${config.defaultModel}`,
          config.language && `Language: ${config.language}`,
          config.theme && `Theme: ${config.theme}`,
          _encrypted && 'API Keys (encrypted)',
          config.customCharacters?.length && `${config.customCharacters.length} custom characters`,
        ].filter(Boolean).join('\n');
        modal.confirm({
          title: t('chat.settingsImported'),
          content: <pre style={{ fontSize: 13, whiteSpace: 'pre-wrap', margin: 0 }}>{summary}</pre>,
          onOk: async () => {
            applyConfig(config);
            if (_encrypted) {
              const password = window.prompt(t('chat.enterDecryptPassword'));
              if (password) {
                try {
                  const keys = JSON.parse(await decrypt(_encrypted, password));
                  Object.entries(keys).forEach(([k, v]) => useSettingsStore.getState().setApiKey(k, v as string));
                } catch {
                  message.error(t('chat.importError'));
                  return;
                }
              }
            }
            message.success(t('chat.settingsImported'));
            navigate(lp('/chat'));
          },
        });
      } catch {
        message.error(t('chat.importError'));
      }
    })();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleShareSettings = async () => {
    const config: Record<string, unknown> = {
      defaultProvider: settings.defaultProvider,
      defaultModel: settings.defaultModel,
      language: settings.language,
      theme: settings.theme,
      thinkingLevel: settings.thinkingLevel,
      modelByProvider: settings.modelByProvider,
      thinkingByProvider: settings.thinkingByProvider,
      roundtableRounds: settings.roundtableRounds,
      corsProxy: settings.corsProxy,
      customBaseUrl: settings.customBaseUrl,
      shareCardEndpoint: settings.shareCardEndpoint,
      corsEnabled: settings.corsEnabled,
      customCharacters: settings.customCharacters,
    };

    const hasKeys = Object.values(settings.apiKeys).some((k) => k && k.trim());
    if (hasKeys) {
      const password = window.prompt(t('chat.enterEncryptPassword'));
      if (password === null) return;
      if (password) {
        try {
          config._encrypted = await encrypt(JSON.stringify(settings.apiKeys), password);
        } catch {
          message.error(t('chat.exportError'));
          return;
        }
      }
    }

    try {
      const base64 = await compressToBase64(JSON.stringify(config));
      const url = `${window.location.origin}${window.location.pathname}#${lp('/settings')}?config=${base64}`;
      await navigator.clipboard.writeText(url);
      message.success(t('chat.linkCopied'));
    } catch {
      message.error(t('chat.exportError'));
    }
  };

  const handleExportAll = () => {
    const data = JSON.stringify(conversations, null, 2);
    downloadFile(data, `legend-talk-conversations-${new Date().toISOString().slice(0, 10)}.json`, 'application/json');
  };

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const text = await file.text();
      const parsed = JSON.parse(text);
      if (Array.isArray(parsed)) {
        const ok = importConversations(parsed);
        message.success(t('chat.importedCount', { count: ok }));
      } else {
        message.error(t('chat.importError'));
      }
    } catch {
      message.error(t('chat.importError'));
    }
    e.target.value = '';
  };

  // Model/thinking restore lives in the store action (per-provider memory).
  const handleProviderChange = (v: string) => settings.setDefaultProvider(v);

  const [testing, setTesting] = useState(false);
  const handleTestConnection = async () => {
    // resolveProvider applies the same custom-URL and CORS-proxy resolution the
    // chat path uses, so the test exercises the real request shape.
    const provider = resolveProvider();
    if (!provider) {
      message.error(t('settings.connectionFailed'));
      return;
    }
    setTesting(true);
    try {
      const ok = await provider.adapter.validateKey(provider.apiKey, provider.corsProxy);
      if (ok) message.success(t('settings.connectionOk'));
      else message.error(t('settings.connectionFailed'));
    } finally {
      setTesting(false);
    }
  };

  const providerOptions = PROVIDER_GROUPS.flatMap((g) => {
    const inGroup = adapters.filter((a) => (a.group || 'custom') === g.id);
    if (inGroup.length === 0) return [];
    return [{
      label: t(g.labelKey),
      title: t(g.labelKey),
      options: inGroup.map((a) => ({ value: a.id, label: a.name })),
    }];
  });

  return (
    <div style={{ height: '100%', overflowY: 'auto' }}>
      <div style={{ maxWidth: 880, margin: '0 auto', padding: 'clamp(16px, 5vw, 64px)' }}>
        <Space size="middle" style={{ marginBottom: 24 }}>
          <Button type="text" icon={<ArrowLeftOutlined className="rtl:-scale-x-100" />} onClick={() => navigate(-1)} />
          <Title className="display-serif" level={2} style={{ margin: 0, fontWeight: 500 }}>
            {t('settings.title')}
          </Title>
        </Space>
        <Divider />

        <Title level={5} className="display-serif" style={{ fontWeight: 500, display: 'flex', alignItems: 'center', gap: 8 }}>
          <ApiOutlined style={{ color: 'var(--ant-color-text-tertiary)' }} />
          {t('settings.defaultProvider')}
        </Title>
        <Form layout="vertical">
          <Form.Item label={t('settings.provider')}>
            <Select
              value={settings.defaultProvider}
              onChange={handleProviderChange}
              options={providerOptions}
              showSearch
              optionFilterProp="label"
            />
          </Form.Item>
          <Form.Item
            label={
              <Space>
                <span>API Key</span>
                {currentAdapter?.apiKeyUrl && <a href={currentAdapter.apiKeyUrl} target="_blank" rel="noopener noreferrer">{t('settings.getKey')}</a>}
              </Space>
            }
          >
            <Space.Compact style={{ width: '100%' }}>
              <Input.Password
                value={settings.apiKeys[settings.defaultProvider] || ''}
                onChange={(e) => settings.setApiKey(settings.defaultProvider, e.target.value)}
                placeholder={t('settings.apiKeyPlaceholder', { provider: currentAdapter?.name || '' })}
              />
              <Button
                loading={testing}
                onClick={handleTestConnection}
                // Guard on each provider's actual requirement so the button can't
                // fire a request resolveProvider() will reject: custom needs a base
                // URL (key optional), everyone else needs a key. Without the custom
                // branch, a custom provider with no base URL reported the generic
                // "check API key / CORS" failure instead of the real cause.
                disabled={settings.defaultProvider === 'custom'
                  ? !settings.customBaseUrl
                  : !settings.apiKeys[settings.defaultProvider]}
              >
                {t('settings.testConnection')}
              </Button>
            </Space.Compact>
          </Form.Item>
          {settings.defaultProvider === 'custom' && (
            <Form.Item label="API Base URL" extra={t('settings.customBaseUrlHint')}>
              <Input value={settings.customBaseUrl} onChange={(e) => settings.setCustomBaseUrl(e.target.value)} placeholder="https://api.example.com/v1" />
            </Form.Item>
          )}
          <Form.Item
            label={
              <Space>
                <span>{t('settings.defaultModel')}</span>
                {currentAdapter?.docsUrl && <a href={currentAdapter.docsUrl} target="_blank" rel="noopener noreferrer">{t('settings.docs')}</a>}
              </Space>
            }
          >
            <AutoComplete
              style={{ width: '100%' }}
              value={settings.defaultModel}
              onChange={(v) => settings.setDefaultModel(v ?? '')}
              options={(currentAdapter?.models || []).map((m) => ({ value: m.id, label: m.name }))}
              allowClear
              placeholder={t('settings.customModel')}
              // 搜索匹配模型名(label)或 SKU(value)。当输入恰好等于某个 SKU 时,
              // 说明用户已选中它,只是想浏览其它选项 —— 显示全部而非只剩自己。
              filterOption={(input, option) => {
                if (!input) return true;
                const q = input.toLowerCase();
                const value = String(option?.value ?? '').toLowerCase();
                const label = String(option?.label ?? '').toLowerCase();
                if (value === q) return true;
                return value.includes(q) || label.includes(q);
              }}
              // 双行渲染:上行友好名,下行灰色小字 SKU —— 弥合下拉显示("Claude
              // Sonnet 4.6")与落入输入框的值("claude-sonnet-4-6")之间的视觉差。
              optionRender={(option) => {
                const value = String(option.value ?? '');
                const label = String(option.label ?? value);
                return (
                  <div style={{ paddingBlock: 2 }}>
                    <div style={{ fontWeight: 500 }}>{label}</div>
                    {label !== value && (
                      <Text type="secondary" style={{ fontSize: 12 }}>{value}</Text>
                    )}
                  </div>
                );
              }}
            />
          </Form.Item>
          <Form.Item label={t('settings.thinkingLevel')} extra={t('settings.thinkingLevelHint')}>
            <Select
              value={settings.thinkingLevel}
              onChange={(v) => settings.setThinkingLevel(v as 'off' | 'low' | 'medium' | 'high')}
              options={[
                { value: 'off', label: t('settings.thinkingOff') },
                { value: 'low', label: t('settings.thinkingLow') },
                { value: 'medium', label: t('settings.thinkingMedium') },
                { value: 'high', label: t('settings.thinkingHigh') },
              ]}
            />
          </Form.Item>
          {settings.defaultProvider !== 'custom' && (
            <div style={{ marginBottom: 24 }}>
              <Flex justify="space-between" align="center" gap={16} style={{ marginBottom: 4 }}>
                <Text strong style={{ fontSize: 14 }}>CORS Proxy</Text>
                <Switch
                  checked={!!settings.corsEnabled[settings.defaultProvider]}
                  onChange={(v) => settings.setCorsEnabled(settings.defaultProvider, v)}
                />
              </Flex>
              <Text type="secondary" style={{ fontSize: 12, display: 'block', marginBottom: 8 }}>
                {t('settings.corsProxyHint')}
              </Text>
              {settings.corsEnabled[settings.defaultProvider] && (
                <Input value={settings.corsProxy} onChange={(e) => settings.setCorsProxy(e.target.value)} placeholder="https://cors.api2026.workers.dev" />
              )}
            </div>
          )}
        </Form>

        <Divider />

        <Title level={5} className="display-serif" style={{ fontWeight: 500, display: 'flex', alignItems: 'center', gap: 8 }}>
          <SettingOutlined style={{ color: 'var(--ant-color-text-tertiary)' }} />
          {t('settings.general')}
        </Title>
        <Form layout="vertical">
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <Form.Item label={t('settings.language')}>
              <Select
                value={i18n.language}
                onChange={(lng) => { ensureLanguageLoaded(lng).then(() => { i18n.changeLanguage(lng); settings.setLanguage(lng); }); }}
                options={((i18n.options.supportedLngs || []) as string[]).filter((l) => l !== 'cimode').map((lng) => ({ value: lng, label: LANG_DISPLAY[lng] || lng }))}
              />
            </Form.Item>
            <Form.Item label={t('settings.theme')}>
              <Select
                value={settings.theme}
                onChange={(v) => settings.setTheme(v as 'light' | 'dark')}
                options={[
                  { value: 'light', label: t('settings.themeLight') },
                  { value: 'dark', label: t('settings.themeDark') },
                ]}
              />
            </Form.Item>
          </div>
          <Form.Item
            label={
              <Space>
                <span>{t('settings.shareCardEndpoint')}</span>
                <a href="https://github.com/rockbenben/json2card" target="_blank" rel="noopener noreferrer">json2card ↗</a>
              </Space>
            }
            extra={t('settings.shareCardEndpointHint')}
          >
            <Input value={settings.shareCardEndpoint} onChange={(e) => settings.setShareCardEndpoint(e.target.value)} placeholder="http://localhost:3000" />
          </Form.Item>
        </Form>

        <Divider />
        <CustomCharactersSection />

        <Divider />

        <Title level={5} className="display-serif" style={{ fontWeight: 500, display: 'flex', alignItems: 'center', gap: 8 }}>
          <DatabaseOutlined style={{ color: 'var(--ant-color-text-tertiary)' }} />
          {t('settings.dataManagement')}
        </Title>
        <div style={{ marginBottom: 24 }}>
          <Flex justify="space-between" align="center" gap={16} style={{ marginBottom: 8 }}>
            <Text strong style={{ fontSize: 14 }}>{t('settings.conversations')}</Text>
            <Text type="secondary" style={{ fontSize: 12 }}>{getStorageUsage()}</Text>
          </Flex>
          <Space wrap>
            <Button icon={<ExportOutlined />} onClick={handleExportAll}>{t('settings.exportAll')}</Button>
            <Button icon={<ImportOutlined />} onClick={() => fileInputRef.current?.click()}>{t('chat.importConversations')}</Button>
            <input ref={fileInputRef} type="file" accept=".json" onChange={handleImport} style={{ display: 'none' }} />
          </Space>
        </div>
        <div>
          <Text strong style={{ fontSize: 14, display: 'block', marginBottom: 4 }}>{t('settings.settingsSync')}</Text>
          <Text type="secondary" style={{ fontSize: 12, display: 'block', marginBottom: 8 }}>
            {t('settings.settingsSyncHint')}
          </Text>
          <Button icon={<ShareAltOutlined />} onClick={handleShareSettings}>{t('chat.shareSettings')}</Button>
        </div>

        <Divider />

        <Button
          danger
          onClick={() => {
            modal.confirm({
              title: t('common.confirm'),
              onOk: async () => {
                await clearAllStorage();
                window.location.reload();
              },
            });
          }}
        >
          {t('settings.clearData')}
        </Button>
      </div>
    </div>
  );
}

const COLLAPSE_THRESHOLD = 3;

function CustomCharactersSection() {
  const { t } = useTranslation();
  const customCharacters = useSettingsStore((s) => s.customCharacters);
  const deleteCustomCharacter = useSettingsStore((s) => s.deleteCustomCharacter);
  const [showEditor, setShowEditor] = useState(false);
  const [editingChar, setEditingChar] = useState<CustomCharacter | undefined>();
  const [expanded, setExpanded] = useState(false);

  const handleDelete = (id: string) => {
    deleteCustomCharacter(id);
    const idx = presetCharacters.findIndex((c) => c.id === id);
    if (idx !== -1) presetCharacters.splice(idx, 1);
  };

  const visible = expanded || customCharacters.length <= COLLAPSE_THRESHOLD
    ? customCharacters
    : customCharacters.slice(0, COLLAPSE_THRESHOLD);

  return (
    <>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
        <Title level={5} className="display-serif" style={{ fontWeight: 500, margin: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
          <UsergroupAddOutlined style={{ color: 'var(--ant-color-text-tertiary)' }} />
          {t('settings.customCharacters')}
          {customCharacters.length > 0 && (
            <Text type="secondary" style={{ fontSize: 13, fontWeight: 400, marginInlineStart: 8 }}>
              ({customCharacters.length})
            </Text>
          )}
        </Title>
        <Button icon={<PlusOutlined />} onClick={() => { setEditingChar(undefined); setShowEditor(true); }} style={{ borderStyle: 'dashed' }}>
          {t('chat.createCharacter')}
        </Button>
      </div>
      {customCharacters.length === 0 ? (
        <Paragraph type="secondary">{t('settings.noCustomCharacters')}</Paragraph>
      ) : (
        <div>
          {visible.map((c) => (
            <div key={c.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '8px 0', borderBottom: '1px solid var(--ant-color-border-secondary)' }}>
              <Avatar emoji={c.avatar} color={c.color} size="sm" />
              <div style={{ flex: 1, minWidth: 0 }}>
                <Text className="display-serif" ellipsis style={{ display: 'block', fontWeight: 500 }}>{c.displayName}</Text>
                <Text type="secondary" ellipsis style={{ display: 'block', fontSize: 12 }}>{c.era || c.systemPrompt.slice(0, 60)}</Text>
              </div>
              <Button type="text" size="small" icon={<EditOutlined />} onClick={() => { setEditingChar(c); setShowEditor(true); }} />
              <Button type="text" size="small" icon={<CloseOutlined />} onClick={() => handleDelete(c.id)} />
            </div>
          ))}
          {customCharacters.length > COLLAPSE_THRESHOLD && (
            <Button type="link" block onClick={() => setExpanded(!expanded)} style={{ marginTop: 8 }}>
              {expanded ? t('common.collapse') : t('common.showAll', { count: customCharacters.length })}
            </Button>
          )}
        </div>
      )}
      {showEditor && <CharacterEditor character={editingChar} onClose={() => setShowEditor(false)} />}
    </>
  );
}
