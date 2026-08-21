import { useState, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Form, Input, Select, AutoComplete, Button, Switch, App, Typography, Space, Divider, Flex, Tag } from 'antd';

const { CheckableTag } = Tag;
import { ArrowLeftOutlined, EditOutlined, CloseOutlined, PlusOutlined, ImportOutlined, ExportOutlined, ShareAltOutlined, ApiOutlined, SettingOutlined, UsergroupAddOutlined, DatabaseOutlined } from '@ant-design/icons';
import { useSettingsStore } from '../stores/settings';
import { getAllAdapters, getAdapter, PROVIDER_GROUPS, PROVIDER_ID_MIGRATIONS, CUSTOM_ENDPOINTS } from '../adapters/registry';
import { canDisableThinking } from '../adapters/thinking';
import { resolveProvider, probeConnection, proxyWouldServe, isProviderConfigured } from '../utils/prompt';
import { getStorageUsage } from '../utils/storage';
import { downloadFile } from '../utils/export';
import { safeHttpUrl } from '../utils/url';
import { matchesModelQuery } from '../utils/modelSearch';
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
  // 这家有没有「关闭思考」这一档 —— 没有的话最低档仍在推理、仍在计费
  const thinkingCanDisable = canDisableThinking(settings.defaultProvider);
  // 当前服务商的全部 SKU —— 模型框的 filterOption 用它判「输入是不是已选中的型号」
  const knownModelIds = new Set((currentAdapter?.models ?? []).map((m) => m.id));
  // 能换地址的适配器 —— 现在【每一家】都能（claude / gemini 两个原生适配器也
  // 各自实现了 withBaseUrl）。判据从"是不是 OpenAI 兼容类"改成"有没有这个能力"，
  // 免得再有新适配器时又漏一家。llm 除外：它的地址走 customBaseUrl 那一栏。
  const swappable = currentAdapter?.withBaseUrl && currentAdapter.id !== 'llm' ? currentAdapter : null;

  /**
   * 这一跳中转当前【转不转得了】。转不了时 resolveProvider 会静默退回直连 ——
   * 那是对的（内置中转够不着自建网关，把带 ?token= 的地址交给第三方也是泄露），
   * 但不能让开关继续显示为开：用户很可能正是因为请求失败才来拨它的，拨完什么
   * 都没变，界面上却看不出这一档根本没参与。所以这里把它显示成关且不可拨，
   * 旁边写清原因。
   */
  const relayInert = !!currentAdapter && !proxyWouldServe(currentAdapter, settings.baseUrlByProvider[settings.defaultProvider], settings.corsProxy);

  /**
   * 应用一份外来配置。返回【地址被丢弃】的 provider 集合 —— 调用方据此把配套的
   * 凭据一起丢掉。
   *
   * ⚠ 地址与凭据必须【成对处理】。只丢地址、留下 key 的后果是静默的：用户配给
   * 自建网关的那把 key，下一次请求会原样发到厂商官方端点（一台他没有选择过的
   * 机器），而界面全程只显示绿色的「导入成功」。corsProxy 同理 —— 地址没了而
   * corsEnabled 还开着，等于回落到内置的公共中转。
   */
  function applyConfig(config: Record<string, unknown>): { droppedUrlProviders: Set<string> } {
    const droppedUrlProviders = new Set<string>();
    const s = useSettingsStore.getState();
    const pickStrings = (obj: unknown, allow?: string[]) =>
      Object.fromEntries(Object.entries((obj && typeof obj === 'object' ? obj : {}) as Record<string, unknown>)
        .filter(([, v]) => typeof v === 'string' && (!allow || allow.includes(v)))) as Record<string, string>;
    // provider id 要走【和存档迁移同一张改名表】，再确认它当真解析得出来。
    // 分享链接是第三方输入，而且往往是别人在【旧版本】上生成的：那时候的 id
    // （anthropic / xai / hunyuan / custom / litellm）今天已经改名，直接写进去
    // 就是把设置面板整块打塌 —— currentAdapter 为 undefined，key 输入框、模型
    // 下拉、地址框、文档链接全都不渲染，resolveProvider 也返回 null。存档迁移
    // 救不了这一种：版本号已经是最新的，migrate 根本不会跑。
    // 解析不出就【整条丢弃】，保留用户当前选的那家，而不是退回某个默认值。
    if (typeof config.defaultProvider === 'string') {
      const id = PROVIDER_ID_MIGRATIONS[config.defaultProvider] ?? config.defaultProvider;
      if (getAdapter(id)) s.setDefaultProvider(id);
    }
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
    // 地址类字段一律过 safeUrl；不合格的【整条丢弃】而不是退回默认值 —— 退回
    // 默认会让用户以为导入成功了。
    // 地址不合格就连「走中转」这个开关一起关掉：空 corsProxy 的语义正是
    // 「用内置的公共中转」，只丢地址会把用户的 key 悄悄改道到那台公共机器上。
    const corsProxy = safeHttpUrl(config.corsProxy);
    const corsProxyDropped = config.corsProxy !== undefined && !corsProxy;
    if (corsProxy) s.setCorsProxy(corsProxy);
    const customBaseUrl = safeHttpUrl(config.customBaseUrl);
    if (customBaseUrl) s.setCustomBaseUrl(customBaseUrl);
    Object.entries((config.baseUrlByProvider ?? {}) as Record<string, unknown>).forEach(([k, v]) => {
      const url = safeHttpUrl(v);
      if (url) s.setProviderBaseUrl(k, url);
      else droppedUrlProviders.add(k); // 地址没进来 → 这家的 key 也别进来
    });
    const shareCardEndpoint = safeHttpUrl(config.shareCardEndpoint);
    if (shareCardEndpoint) s.setShareCardEndpoint(shareCardEndpoint);
    if (config.corsEnabled && typeof config.corsEnabled === 'object' && !corsProxyDropped) {
      Object.entries(config.corsEnabled as Record<string, boolean>).forEach(([k, v]) => { if (typeof v === 'boolean') s.setCorsEnabled(k, v); });
    }
    if (Array.isArray(config.customCharacters)) {
      for (const c of config.customCharacters as CustomCharacter[]) {
        // Null/undefined element guard first — a shared config link is third-party
        // input; without `!c` the malformed-entry skip below throws on `null.id`,
        // aborting applyConfig mid-way (settings half-applied, modal stuck). Matches
        // the `!!c` guard in conversations.ts importConversations.
        if (!c || !c.id || !c.displayName || !c.systemPrompt) continue;
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
    return { droppedUrlProviders };
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
          // 地址必须显示出来：它们决定 API key 发到哪台机器，是这份配置里唯一
          // 能悄悄造成伤害的部分。applyConfig 已把它们收窄到 http(s)，但「合法的
          // http 地址」和「你愿意把 key 发过去的地址」是两回事，只有用户能判断。
          config.corsProxy && `CORS proxy: ${config.corsProxy}`,
          config.customBaseUrl && `Custom base URL: ${config.customBaseUrl}`,
          ...Object.entries((config.baseUrlByProvider ?? {}) as Record<string, unknown>).map(
            ([k, v]) => `Base URL (${k}): ${v}`,
          ),
          // 分享卡片端点收到的是【整份对话记录】（generateShareCard POST 的是
          // {title, messages}）。它同样是「合法的 http 地址」≠「你愿意把内容发
          // 过去的地址」，漏掉它，一条分享链接就能把导出悄悄改道到别人的收集端，
          // 而用户点 OK 的那个弹窗从头到尾没提过它。
          config.shareCardEndpoint && `Share card endpoint: ${config.shareCardEndpoint}`,
        ].filter(Boolean).join('\n');
        modal.confirm({
          title: t('chat.settingsImported'),
          content: <pre style={{ fontSize: 13, whiteSpace: 'pre-wrap', margin: 0 }}>{summary}</pre>,
          onOk: async () => {
            const { droppedUrlProviders } = applyConfig(config);
            if (_encrypted) {
              const password = window.prompt(t('chat.enterDecryptPassword'));
              if (password) {
                try {
                  const keys = JSON.parse(await decrypt(_encrypted, password));
                  // ⚠ 地址被丢掉的那几家，key 也不要 —— 见 applyConfig 的说明。
                  Object.entries(keys).forEach(([k, v]) => {
                    if (droppedUrlProviders.has(k)) return;
                    useSettingsStore.getState().setApiKey(k, v as string);
                  });
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
      baseUrlByProvider: settings.baseUrlByProvider,
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
  const probeAbortRef = useRef<AbortController | null>(null);
  const handleTestConnection = async () => {
    // resolveProvider applies the same custom-URL and CORS-proxy resolution the
    // chat path uses, so the test exercises the real request shape.
    const provider = resolveProvider();
    if (!provider) {
      message.error(t('settings.connectionFailed'));
      return;
    }
    const controller = new AbortController();
    probeAbortRef.current = controller;
    setTesting(true);
    try {
      // 发一次最小的真实请求（见 probeConnection）。失败时把适配器给的原始错误
      // 一并显示 —— 它带着状态码（`[401] …`），比一句「连接失败」有用得多。
      await probeConnection(provider, undefined, controller.signal);
      message.success(t('settings.connectionOk'));
    } catch (e) {
      // 用户自己点的「停止」不算失败。AbortError 的文案是「signal is aborted
      // without reason」，弹出来只会让人以为是配置有问题。超时中止的是
      // probeConnection 内部那个 controller，这里判不到，所以照常报错。
      if (!controller.signal.aborted) {
        const detail = e instanceof Error ? e.message : String(e);
        // 后面要接冒号，所以先削掉文案结尾的句点 —— 直接拼会拼出
        // 「…CORS proxy.: [401] …」。削在这里而不是改文案：同一句在上面
        // 【单独】出现（resolveProvider 返回 null 那条），那时它就该带句号。
        // 目前 18 个语言里只有 en 结尾带句点，其余本来就没有；写成通用的削法
        // 是为了以后哪个译者补了标点也不会把这条又拼坏。
        const head = t('settings.connectionFailed').replace(/[.。！!？?]+$/u, '');
        message.error(detail ? `${head}: ${detail}` : head);
      }
    } finally {
      probeAbortRef.current = null;
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
              {/* 测试中换成可点的「停止」，而不是一个转着的 loading 按钮：耐心给到
                  3 分钟（思考模型第一个可见 token 本来就要等那么久），而 loading 态
                  在 antd 里点不动 —— 等于让人干瞪三分钟、只能刷新页面。停止的文案
                  复用 chat.stop，18 个语言都已经有。 */}
              {testing ? (
                <Button danger onClick={() => probeAbortRef.current?.abort()}>
                  {t('chat.stop')}
                </Button>
              ) : (
                <Button
                  onClick={handleTestConnection}
                  // 按钮不该发一个 resolveProvider() 注定要拒的请求，判据与它同一份
                  // （见 isProviderConfigured）—— 这里曾经是第四份手抄：Custom 认地址、
                  // keyOptional 两样都不认、其余认 key，抄一次漏一次。
                  disabled={!isProviderConfigured(settings)}
                >
                  {t('settings.testConnection')}
                </Button>
              )}
            </Space.Compact>
          </Form.Item>
          {settings.defaultProvider === 'llm' && (
            <Form.Item label="API Base URL" extra={t('settings.customBaseUrlHint')}>
              {/* 起步地址建议（Ollama / LM Studio / LiteLLM / Together / Fireworks…）。
                  点一下填进输入框，用户仍可随便改 —— 它们不是同一服务的区域变体，
                  所以不走上面 swappable 那套「选中即锁定」的端点逻辑。
                  选中的那条把它自己的文档摆出来：每条背后是一个独立产品，用户得
                  先照着它的说明把服务跑起来、把地址和模型名弄对。 */}
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 8, alignItems: 'center' }}>
                {CUSTOM_ENDPOINTS.map((ep) => (
                  <CheckableTag
                    key={ep.url}
                    checked={settings.customBaseUrl === ep.url}
                    onChange={() => settings.setCustomBaseUrl(ep.url)}
                    style={{ margin: 0, fontSize: 13, padding: '2px 10px' }}
                  >
                    {ep.label}
                  </CheckableTag>
                ))}
                {(() => {
                  const docs = CUSTOM_ENDPOINTS.find((ep) => ep.url === settings.customBaseUrl)?.docs;
                  return docs ? (
                    <Typography.Link href={docs} target="_blank" rel="noopener noreferrer" style={{ fontSize: 12 }}>
                      {t('settings.docs')}
                    </Typography.Link>
                  ) : null;
                })()}
              </div>
              <Input value={settings.customBaseUrl} onChange={(e) => settings.setCustomBaseUrl(e.target.value)} placeholder="https://api.example.com/v1" />
            </Form.Item>
          )}
          {/* 地址逃生口，发给【每一家】而不只是有区域变体的那几家：谁会被上游
              按 origin 拦无法预判，手发必然漏掉最需要它的人。
              ⚠ 它与下面的中转开关是【正交】的两轴 —— 地址决定打哪儿，开关决定
              走不走那一跳。唯一的组合限制在 proxyWouldServe：内置那台公共中转
              按 host 白名单转发，自填地址它够不着也不放行，那种组合退回直连。 */}
          {swappable && (
            <Form.Item label={t('settings.endpoint')} extra={t('settings.endpointHint')}>
              {(swappable.endpoints?.length ?? 0) > 1 && (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 8 }}>
                  {swappable.endpoints!.map((ep) => (
                    <CheckableTag
                      key={ep.url}
                      checked={(settings.baseUrlByProvider[settings.defaultProvider] || swappable.baseUrl) === ep.url}
                      // Selecting the adapter's own default stores '' rather than
                      // the URL, so a later change to that default is picked up
                      // instead of being pinned by a stale copy.
                      onChange={() => settings.setProviderBaseUrl(
                        settings.defaultProvider,
                        ep.url === swappable.baseUrl ? '' : ep.url,
                      )}
                      style={{ margin: 0, fontSize: 13, padding: '2px 10px' }}
                    >
                      {ep.label}
                    </CheckableTag>
                  ))}
                </div>
              )}
              <Input
                value={settings.baseUrlByProvider[settings.defaultProvider] || ''}
                onChange={(e) => settings.setProviderBaseUrl(settings.defaultProvider, e.target.value)}
                placeholder={swappable.baseUrl}
              />
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
              // An empty field is not "no model" — resolveProvider falls back to
              // the first catalogue entry. Show that, so the placeholder names
              // what a blank field will actually send.
              placeholder={currentAdapter?.models[0]?.id || t('settings.customModel')}
              // 搜索匹配模型名(label)或 SKU(value)。
              // ⚠ 「输入恰好是某个已知 SKU 时显示全部」这一条要问的是【输入】,
              // 不是【当前这个选项】—— 曾经写成 `value === q` 逐条判,结果只有
              // 自己那一条通过,而 antd 在唯一选项与输入完全相同时不弹下拉:
              // 选好模型之后再点开【什么都不出来】,9 个型号的服务商看起来只有一个。
              filterOption={(input, option) => matchesModelQuery(knownModelIds, input, option ?? {})}
              // 双行渲染:上行友好名,下行灰色小字 SKU —— 弥合下拉显示("Claude
              // Sonnet 4.6")与落入输入框的值("claude-sonnet-4-6")之间的视觉差。
              // 留空时实际会发的那个型号标上 default，与 placeholder 说的是同一件事。
              optionRender={(option) => {
                const value = String(option.value ?? '');
                const label = String(option.label ?? value);
                const isDefault = value === currentAdapter?.models[0]?.id;
                return (
                  <div style={{ paddingBlock: 2 }}>
                    <Flex align="center" gap={6}>
                      <span style={{ fontWeight: isDefault ? 600 : 500 }}>{label}</span>
                      {isDefault && <Tag style={{ margin: 0, fontSize: 10, lineHeight: '16px', padding: '0 4px' }}>default</Tag>}
                    </Flex>
                    {label !== value && (
                      <Text type="secondary" style={{ fontSize: 12 }}>{value}</Text>
                    )}
                  </div>
                );
              }}
            />
          </Form.Item>
          {/* 只在这个 SKU 真有思考形态时才显示 —— 否则是个点了没反应的开关，
              比没有它更糟。判据与适配器 chat() 里选形态那行同源。
              ⚠ 最低那一档写「关闭」还是「最低」，取决于这家有没有关闭值：
              gemini / grok / groq / cerebras 都没有，它们的关闭态实际发的是自己的
              最低档 —— 仍在推理、仍在计费，写成「关闭」就是在对用户撒谎。 */}
          {(currentAdapter?.supportsThinking?.(settings.defaultModel) ?? true) && (
            <Form.Item
              label={t('settings.thinkingLevel')}
              extra={thinkingCanDisable ? t('settings.thinkingLevelHint') : t('settings.thinkingLevelHintNoOff')}
            >
              <Select
                value={settings.thinkingLevel}
                onChange={(v) => settings.setThinkingLevel(v as 'off' | 'low' | 'medium' | 'high')}
                options={[
                  { value: 'off', label: thinkingCanDisable ? t('settings.thinkingOff') : t('settings.thinkingMin') },
                  { value: 'low', label: t('settings.thinkingLow') },
                  { value: 'medium', label: t('settings.thinkingMedium') },
                  { value: 'high', label: t('settings.thinkingHigh') },
                ]}
              />
            </Form.Item>
          )}
          {settings.defaultProvider !== 'llm' && (
            <div style={{ marginBottom: 24 }}>
              <Flex justify="space-between" align="center" gap={16} style={{ marginBottom: 4 }}>
                {/* 名字与【本仓的 README 与 worker 源码】一致 —— 那是用户被指过去
                    读隐私说明的地方（README 的 `## CORS proxy` 一节，链接锚点就是
                    #cors-proxy）。界面若改叫别的，用户按标签去文档里搜就搜不到。
                    ⚠ 不要照搬上游的「中转 API」：那台是【逐 provider 声明路由的
                    通用中转】，它存在的理由不止 CORS（DeepSeek 那种按 origin 拦的
                    403 也靠它），所以叫通名合适。本仓这台【只为 CORS 而存在】——
                    worker 头一行写的就是"浏览器直连拿不到 CORS 头的服务商"。两个
                    不同的东西不该共用一个名字。
                    CORS 留在标签里，403 之类的症状与"key 会经过它"的披露放说明。 */}
                <Text strong style={{ fontSize: 14 }}>{t('settings.corsProxy')}</Text>
                <Switch
                  checked={!!settings.corsEnabled[settings.defaultProvider] && !relayInert}
                  disabled={relayInert}
                  onChange={(v) => settings.setCorsEnabled(settings.defaultProvider, v)}
                />
              </Flex>
              <Text type="secondary" style={{ fontSize: 12, display: 'block', marginBottom: 8 }}>
                {relayInert ? t('settings.corsProxyInert') : t('settings.corsProxyHint')}
              </Text>
              {settings.corsEnabled[settings.defaultProvider] && !relayInert && (
                <Form.Item
                  // 漏写 https:// 是这一栏最常见的错法，而它【不会报错】：
                  // 拼出来的 `cors.example.dev/https://…` 是个相对地址，浏览器
                  // 按本站域名解析，请求 404 在自己站上，任何报错都不指向"少了协议头"。
                  // 留空【不算错】—— 那是「用内置的公共中转」。
                  validateStatus={settings.corsProxy.trim() && !safeHttpUrl(settings.corsProxy) ? 'error' : undefined}
                  help={settings.corsProxy.trim() && !safeHttpUrl(settings.corsProxy) ? t('settings.corsProxyInvalid') : undefined}
                  style={{ marginBottom: 0 }}
                >
                  <Input
                    value={settings.corsProxy}
                    onChange={(e) => settings.setCorsProxy(e.target.value)}
                    placeholder="https://cors.api2026.workers.dev"
                    spellCheck={false}
                  />
                </Form.Item>
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
