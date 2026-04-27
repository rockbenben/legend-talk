import { useLangPath } from '../hooks/useLangPath';
import { useState, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Input, Button, Alert, Typography, Card, App, Space } from 'antd';
import { ArrowRightOutlined, ThunderboltOutlined, CloseOutlined, LinkOutlined } from '@ant-design/icons';
import { ConversationList } from '../components/ConversationList';
import { ChatView } from '../components/ChatView';
import { CharacterGrid } from '../components/CharacterGrid';
import { Avatar } from '../components/Avatar';
import { useConversationStore } from '../stores/conversations';
import { useSettingsStore } from '../stores/settings';
import { presetCharacters } from '../characters/presets';
import { generateCharacter } from '../characters/generator';
import { roundtableTemplates } from '../characters/templates';
import type { Character } from '../types';

const { Title, Paragraph, Text } = Typography;

const MAX_PARTICIPANTS = 10;

export function ChatPage() {
  const { id } = useParams<{ id?: string }>();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const lp = useLangPath();
  const { message } = App.useApp();
  const createConversation = useConversationStore((s) => s.createConversation);
  const isConfigured = useSettingsStore((s) => {
    if (s.defaultProvider === 'custom') return !!s.customBaseUrl;
    const key = s.apiKeys[s.defaultProvider];
    return !!key && key.trim().length > 0;
  });
  const [searchParams] = useSearchParams();

  const charsParam = searchParams.get('chars');
  const categoryParam = searchParams.get('category');

  useEffect(() => {
    if (id) return;
    if (!charsParam && !categoryParam) return;

    let charIds: string[] = [];

    if (charsParam) {
      const names = charsParam.split(',').map((s) => s.trim()).filter(Boolean);
      for (const name of names) {
        if (charIds.length >= MAX_PARTICIPANTS) break;
        const lower = name.toLowerCase();
        const found = presetCharacters.find(
          (p) => p.id === lower || t(`characters.${p.id}.name`).toLowerCase() === lower || t(`characters.${p.id}.name`) === name,
        );
        if (found) {
          if (!charIds.includes(found.id)) charIds.push(found.id);
        } else {
          const custom = generateCharacter(name);
          if (!presetCharacters.find((c) => c.id === custom.id)) presetCharacters.push(custom);
          if (!charIds.includes(custom.id)) charIds.push(custom.id);
        }
      }
    } else if (categoryParam) {
      charIds = presetCharacters
        .filter((c) => c.domain.includes(categoryParam))
        .map((c) => c.id)
        .slice(0, MAX_PARTICIPANTS);
    }

    if (charIds.length === 0) return;

    const type = charIds.length === 1 ? 'single' : 'roundtable';
    const convId = createConversation(type, charIds);
    navigate(lp(`/chat/${convId}`), { replace: true });
  }, [id, charsParam, categoryParam, createConversation, navigate]); // eslint-disable-line react-hooks/exhaustive-deps

  const conversation = useConversationStore((s) =>
    id ? s.conversations.find((c) => c.id === id) : undefined,
  );

  const validId = id && conversation ? id : undefined;

  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [topicInput, setTopicInput] = useState('');

  const handleAutoRoundtable = () => {
    const topic = topicInput.trim();
    if (!topic) return;
    const convId = createConversation('roundtable', [], topic);
    setTopicInput('');
    navigate(lp(`/chat/${convId}`));
  };

  const handleStartChat = (character: Character) => {
    const exists = presetCharacters.find((c) => c.id === character.id);
    if (!exists) presetCharacters.push(character);
    const convId = createConversation('single', [character.id]);
    navigate(lp(`/chat/${convId}`));
  };

  const handleSelect = (character: Character) => {
    setSelectedIds((prev) =>
      prev.includes(character.id)
        ? prev.filter((cid) => cid !== character.id)
        : prev.length < MAX_PARTICIPANTS
          ? [...prev, character.id]
          : prev,
    );
  };

  const startRoundtable = () => {
    if (selectedIds.length >= 2) {
      const convId = createConversation('roundtable', selectedIds);
      setSelectedIds([]);
      navigate(lp(`/chat/${convId}`));
    }
  };

  return (
    <div style={{ display: 'flex', height: '100%', overflow: 'hidden' }}>
      <ConversationList activeId={validId} />
      <div style={{ flex: 1, minWidth: 0 }}>
        {validId ? (
          <ChatView conversationId={validId} />
        ) : (
          <div style={{ height: '100%', overflowY: 'auto' }}>
            <div style={{ padding: 'clamp(20px, 5vw, 96px)', maxWidth: 1200, margin: '0 auto', paddingBottom: 96 }}>
              {/* Masthead */}
              <div style={{ marginBottom: 32 }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>
                  <Title
                    className="display-serif"
                    level={1}
                    style={{ margin: 0, fontSize: 'clamp(1.8rem, 5vw, 2.8rem)', fontWeight: 500, lineHeight: 1.15 }}
                  >
                    {t('home.title')}
                  </Title>
                  <Button
                    icon={<ThunderboltOutlined />}
                    onClick={() => {
                      const shuffled = [...presetCharacters].sort(() => Math.random() - 0.5);
                      const charIds = shuffled.slice(0, 5).map((c) => c.id);
                      const convId = createConversation('roundtable', charIds);
                      navigate(lp(`/chat/${convId}`));
                    }}
                    style={{ flexShrink: 0, marginTop: 4 }}
                  >
                    {t('home.randomRoundtable')}
                  </Button>
                </div>
                <Paragraph type="secondary" style={{ marginTop: 12, fontSize: 16, maxWidth: 640 }}>
                  {t('home.subtitle')}
                </Paragraph>
              </div>

              {!isConfigured && (
                <Alert
                  type="warning"
                  showIcon
                  message={t('home.apiKeyBanner')}
                  action={<Button type="primary" size="small" onClick={() => navigate(lp('/settings'))}>{t('chat.goSettings')}</Button>}
                  style={{ marginBottom: 24 }}
                />
              )}

              {/* Topic question */}
              <Card title={<span className="display-serif" style={{ fontSize: 17, fontWeight: 500 }}>{t('home.autoRoundtable')}</span>} style={{ marginBottom: 24 }} size="small">
                <Space.Compact style={{ width: '100%' }}>
                  <Input
                    size="large"
                    value={topicInput}
                    onChange={(e) => setTopicInput(e.target.value)}
                    onPressEnter={handleAutoRoundtable}
                    placeholder={t('home.topicPlaceholder')}
                  />
                  <Button
                    type="primary"
                    size="large"
                    onClick={handleAutoRoundtable}
                    disabled={!topicInput.trim()}
                    icon={<ArrowRightOutlined className="rtl:-scale-x-100" />}
                    iconPosition="end"
                  >
                    {t('home.autoRoundtable')}
                  </Button>
                </Space.Compact>
              </Card>

              {/* Templates */}
              <div style={{ marginBottom: 32 }}>
                <Title level={5} className="display-serif" style={{ fontWeight: 500, marginBottom: 12 }}>
                  {t('home.templates')}
                </Title>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 12 }}>
                  {roundtableTemplates.map((tpl) => (
                    <Card
                      key={tpl.id}
                      size="small"
                      hoverable
                      onClick={() => {
                        const convId = createConversation('roundtable', tpl.characters, t(`templates.${tpl.id}.name`), tpl.id);
                        navigate(lp(`/chat/${convId}`));
                      }}
                      styles={{ body: { padding: 12 } }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <div style={{ display: 'flex', flexShrink: 0 }}>
                          {tpl.characters.slice(0, 3).map((cid, j) => {
                            const char = presetCharacters.find((c) => c.id === cid);
                            return char ? (
                              <div
                                key={cid}
                                style={{
                                  marginInlineStart: j > 0 ? -10 : 0,
                                  // Later DOM children paint on top of earlier ones (default).
                                  // First avatar = bottom, last = front.
                                  position: 'relative',
                                  zIndex: j + 1,
                                }}
                              >
                                <Avatar emoji={char.avatar} color={char.color} size="sm" />
                              </div>
                            ) : null;
                          })}
                        </div>
                        <div style={{ minWidth: 0, flex: 1 }}>
                          <Text className="display-serif" ellipsis style={{ display: 'block', fontSize: 15, fontWeight: 500 }}>
                            {t(`templates.${tpl.id}.name`)}
                          </Text>
                          <Text type="secondary" ellipsis style={{ display: 'block', fontSize: 12 }}>
                            {t(`templates.${tpl.id}.description`)}
                          </Text>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              </div>

              {/* Registry */}
              <div>
                <Title level={5} className="display-serif" style={{ fontWeight: 500, marginBottom: 12 }}>
                  {t('home.title')}
                </Title>
                <CharacterGrid
                  onStartChat={handleStartChat}
                  onSelect={handleSelect}
                  selectedIds={selectedIds}
                />
              </div>
            </div>

            {selectedIds.length > 0 && (
              <div
                style={{
                  position: 'sticky',
                  bottom: 0,
                  zIndex: 10,
                  borderTop: '1px solid var(--ant-color-border-secondary)',
                  background: 'var(--ant-color-bg-elevated)',
                  backdropFilter: 'blur(8px)',
                }}
              >
                <div style={{ maxWidth: 1200, margin: '0 auto', padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
                  <div style={{ display: 'flex', gap: 6, overflowX: 'auto', minWidth: 0, flex: '1 1 auto' }}>
                    {selectedIds.map((cid) => {
                      const char = presetCharacters.find((c) => c.id === cid);
                      if (!char) return null;
                      return (
                        <button
                          key={cid}
                          onClick={() => setSelectedIds((prev) => prev.filter((x) => x !== cid))}
                          title={t(`characters.${char.id}.name`)}
                          style={{ background: 'transparent', border: 'none', cursor: 'pointer', padding: 0, flexShrink: 0 }}
                        >
                          <Avatar emoji={char.avatar} color={char.color} size="sm" />
                        </button>
                      );
                    })}
                  </div>
                  <Text type="secondary">
                    {t('roundtable.selected', { count: selectedIds.length })}
                  </Text>
                  <Space style={{ marginInlineStart: 'auto' }}>
                    <Button
                      type="primary"
                      size="large"
                      onClick={startRoundtable}
                      disabled={selectedIds.length < 2}
                      icon={<ArrowRightOutlined className="rtl:-scale-x-100" />}
                      iconPosition="end"
                    >
                      {t('roundtable.start')}
                    </Button>
                    {selectedIds.length >= 2 && (
                      <Button
                        className="hidden sm:inline-flex"
                        icon={<LinkOutlined />}
                        onClick={() => {
                          const url = `${window.location.origin}${window.location.pathname}#${lp('/chat')}?chars=${selectedIds.join(',')}`;
                          navigator.clipboard.writeText(url).catch(() => {});
                          message.success(t('chat.linkCopied'));
                        }}
                      >
                        {t('chat.copyLineupLink')}
                      </Button>
                    )}
                    <Button type="text" icon={<CloseOutlined />} onClick={() => setSelectedIds([])} />
                  </Space>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
