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

/**
 * Parse + validate a decoded share payload. The payload comes from a URL and is
 * fully third-party-controlled, so a successful JSON.parse guarantees nothing
 * about shape. `messages`/`characters` must be arrays (render maps over them),
 * and `title` must be a string — it flows unguarded into a React child
 * (`displayTitle`), and a non-string (e.g. `{}`) throws "Objects are not valid
 * as a React child", crashing the whole view instead of showing the graceful
 * malformed-link fallback. Non-string titles are dropped, not rejected, so an
 * otherwise-renderable payload still displays (falling back to the char names).
 */
export function parseSharedPayload(json: string): SharedData {
  const obj = JSON.parse(json);
  if (!Array.isArray(obj?.messages) || !Array.isArray(obj?.characters)) {
    throw new Error('Malformed share payload');
  }
  if (typeof obj.title !== 'string') obj.title = undefined;
  return obj as SharedData;
}

export function SharedView() {
  const { data } = useParams<{ data: string }>();
  const { t } = useTranslation();
  const lp = useLangPath();
  const [shared, setShared] = useState<SharedData | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!data) return;

    // Successful JSON.parse doesn't guarantee a well-formed payload (old or
    // tampered links). Validate the shape so render-time .map()/children can't throw.
    const accept = (json: string) => setShared(parseSharedPayload(json));

    if (data.startsWith('s:')) {
      const parts = data.slice(2).split(':');
      let proxy = useSettingsStore.getState().corsProxy;
      try { if (parts.length >= 2) proxy = atob(parts[0].replace(/-/g, '+').replace(/_/g, '/')); } catch { /* use default */ }
      // Old links may carry a trailing-slash proxy in the tag — "proxy.com//s/id" 400s.
      proxy = proxy.replace(/\/+$/, '');
      const id = parts.length >= 2 ? parts[1] : parts[0];
      fetch(`${proxy}/s/${id}`)
        .then((res) => { if (!res.ok) throw new Error('Not found'); return res.text(); })
        .then((base64) => decompressFromBase64(base64))
        .then(accept)
        .catch(() => setError(t('common.error', { message: '' })));
      return;
    }

    decompressFromBase64(data)
      .then(accept)
      .catch(() => setError(t('common.error', { message: '' })));
  }, [data]); // eslint-disable-line react-hooks/exhaustive-deps

  if (error) {
    return (
      <Space orientation="vertical" align="center" size="middle" style={{ width: '100%', height: '100%', justifyContent: 'center', display: 'flex' }}>
        <Text type="danger">{error}</Text>
        <Link to={lp('/chat')}>
          <Button type="primary" icon={<ArrowRightOutlined className="rtl:-scale-x-100" />} iconPlacement="end">
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
        {/* 880, not 1200 — the same measure ChatView sets its transcript to.
            The marginal speaker label is sized against this column. */}
        <div className="lt-column" style={{ maxWidth: 880, width: '100%', margin: '0 auto' }}>
          {shared.messages.map((msg, idx) => {
            // Share data comes from a URL and may be tampered — skip malformed items
            // so a single bad entry can't crash the whole view.
            if (!msg || typeof msg.content !== 'string') return null;
            const msgChar = msg.characterId ? presetCharacters.find((c) => c.id === msg.characterId) : undefined;
            const prev = idx > 0 ? shared.messages[idx - 1] : null;
            return (
              <MessageBubble
                key={idx}
                content={msg.content}
                isUser={msg.role === 'user'}
                avatar={msgChar?.avatar}
                color={msgChar?.color}
                name={isMulti && msgChar ? (t(`characters.${msgChar.id}.name`)) : undefined}
                era={isMulti && msgChar ? t(`characters.${msgChar.id}.era`) : undefined}
                dropCap={isMulti && !!msgChar && (
                  !prev || prev.role === 'user' || prev.characterId === '__moderator__' || prev.characterId === '__focus__'
                )}
                isModerator={msg.characterId === '__moderator__'}
              />
            );
          })}
        </div>
      </div>

      <div style={{ display: 'flex', justifyContent: 'center', padding: 16, borderTop: '1px solid var(--ant-color-border-secondary)' }}>
        <Link to={lp('/chat')}>
          <Button type="primary" size="large" icon={<ArrowRightOutlined className="rtl:-scale-x-100" />} iconPlacement="end">
            {t('shared.startOwn')}
          </Button>
        </Link>
      </div>
    </div>
  );
}
