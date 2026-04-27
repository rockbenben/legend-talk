import { useLangPath } from '../hooks/useLangPath';
import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Button, Spin, Typography, Space } from 'antd';
import { ArrowRightOutlined } from '@ant-design/icons';
import { MessageBubble } from '../components/MessageBubble';
import { presetCharacters } from '../characters/presets';
import { decompressFromBase64 } from '../utils/compress';
import { useSettingsStore } from '../stores/settings';

const { Title, Text } = Typography;

interface SharedMessage {
  role: 'user' | 'character';
  characterId?: string;
  content: string;
}

interface SharedData {
  title?: string;
  characters: string[];
  messages: SharedMessage[];
}

export function SharedView() {
  const { data } = useParams<{ data: string }>();
  const { t } = useTranslation();
  const lp = useLangPath();
  const [shared, setShared] = useState<SharedData | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!data) return;

    if (data.startsWith('s:')) {
      const parts = data.slice(2).split(':');
      let proxy = useSettingsStore.getState().corsProxy;
      try { if (parts.length >= 2) proxy = atob(parts[0].replace(/-/g, '+').replace(/_/g, '/')); } catch { /* use default */ }
      const id = parts.length >= 2 ? parts[1] : parts[0];
      fetch(`${proxy}/s/${id}`)
        .then((res) => { if (!res.ok) throw new Error('Not found'); return res.text(); })
        .then((base64) => decompressFromBase64(base64))
        .then((json) => setShared(JSON.parse(json)))
        .catch(() => setError(t('common.error', { message: '' })));
      return;
    }

    decompressFromBase64(data)
      .then((json) => setShared(JSON.parse(json)))
      .catch(() => setError(t('common.error', { message: '' })));
  }, [data]); // eslint-disable-line react-hooks/exhaustive-deps

  if (error) {
    return (
      <Space direction="vertical" align="center" size="middle" style={{ width: '100%', height: '100%', justifyContent: 'center', display: 'flex' }}>
        <Text type="danger">{error}</Text>
        <Link to={lp('/chat')}>
          <Button type="primary" icon={<ArrowRightOutlined className="rtl:-scale-x-100" />} iconPosition="end">
            {t('shared.startOwn')}
          </Button>
        </Link>
      </Space>
    );
  }

  if (!shared) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
        <Spin />
      </div>
    );
  }

  const characters = shared.characters
    .map((id) => presetCharacters.find((c) => c.id === id))
    .filter(Boolean) as NonNullable<ReturnType<typeof presetCharacters.find>>[];

  const isMulti = characters.length > 1;

  const displayTitle = shared.title
    || characters.map((c) => t(`characters.${c.id}.name`)).join(', ')
    || t('shared.title');

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div style={{ padding: '12px 20px', borderBottom: '1px solid var(--ant-color-border-secondary)' }}>
        <Text type="secondary" style={{ fontSize: 12 }}>{t('shared.title')}</Text>
        <Title level={4} className="display-serif" style={{ margin: 0, fontWeight: 500 }}>
          {displayTitle}
        </Title>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: '24px clamp(16px, 5vw, 96px)' }}>
        <div style={{ maxWidth: 1200, width: '100%', margin: '0 auto' }}>
          {shared.messages.map((msg, idx) => {
            const msgChar = msg.characterId ? presetCharacters.find((c) => c.id === msg.characterId) : undefined;
            return (
              <MessageBubble
                key={idx}
                content={msg.content}
                isUser={msg.role === 'user'}
                avatar={msgChar?.avatar}
                color={msgChar?.color}
                name={isMulti && msgChar ? (t(`characters.${msgChar.id}.name`)) : undefined}
              />
            );
          })}
        </div>
      </div>

      <div style={{ display: 'flex', justifyContent: 'center', padding: 16, borderTop: '1px solid var(--ant-color-border-secondary)' }}>
        <Link to={lp('/chat')}>
          <Button type="primary" size="large" icon={<ArrowRightOutlined className="rtl:-scale-x-100" />} iconPosition="end">
            {t('shared.startOwn')}
          </Button>
        </Link>
      </div>
    </div>
  );
}
