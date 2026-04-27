import { useLangPath } from '../hooks/useLangPath';
import { useTranslation } from 'react-i18next';
import { Button, App, Tooltip, Typography, theme as antTheme } from 'antd';
import { PlusOutlined, LinkOutlined, CloseOutlined } from '@ant-design/icons';
import { Avatar } from './Avatar';
import type { Character } from '../types';

const { Text } = Typography;
const { useToken } = antTheme;

interface ParticipantsBarProps {
  characters: Character[];
  conversationCharIds: string[];
  isMulti: boolean;
  isGenerating: boolean;
  currentSpeaker: string | null;
  currentRound?: number | null;
  totalRounds?: number | null;
  onAdd: () => void;
  onRemove: (charId: string) => void;
}

export function ParticipantsBar({
  characters, conversationCharIds, isMulti, isGenerating, currentSpeaker, currentRound, totalRounds, onAdd, onRemove,
}: ParticipantsBarProps) {
  const { t } = useTranslation();
  const lp = useLangPath();
  const { token } = useToken();
  const { message } = App.useApp();
  const showProgress = isMulti && isGenerating && !!currentRound && !!totalRounds;

  return (
    <div
      style={{
        display: 'flex',
        flexWrap: 'wrap',
        alignItems: 'center',
        gap: '4px 14px',
        padding: '8px 16px',
        borderBottom: `1px solid ${token.colorBorderSecondary}`,
      }}
    >
      {characters.map((char) => {
        const speaking = isMulti && currentSpeaker === char.id;
        return (
          <span
            key={char.id}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              padding: '2px 0',
            }}
          >
            <span
              style={{
                display: 'inline-flex',
                outline: speaking ? `2px solid ${token.colorPrimary}` : 'none',
                outlineOffset: 1,
                borderRadius: 4,
              }}
            >
              <Avatar emoji={char.avatar} color={char.color} size="sm" />
            </span>
            <Text
              className="display-serif-italic"
              style={{
                fontSize: 14,
                fontWeight: 600,
                color: speaking ? token.colorPrimary : token.colorText,
              }}
            >
              {t(`characters.${char.id}.name`)}
            </Text>
            {isMulti && !isGenerating && conversationCharIds.length > 2 && (
              <Button
                type="text"
                size="small"
                icon={<CloseOutlined style={{ fontSize: 10 }} />}
                onClick={() => onRemove(char.id)}
                title={t('roundtable.removeParticipant')}
              />
            )}
          </span>
        );
      })}
      {showProgress && (
        <Text
          type="secondary"
          style={{ marginInlineStart: 'auto', color: token.colorPrimary, fontSize: 12, fontWeight: 500 }}
        >
          {currentSpeaker === '__moderator__' ? '⚖ ' : ''}{currentRound}/{totalRounds}
        </Text>
      )}
      {!isGenerating && (
        <>
          <Button size="small" icon={<PlusOutlined />} onClick={onAdd} style={{ borderStyle: 'dashed' }}>
            {t('chat.addParticipant')}
          </Button>
          <Tooltip title={t('chat.copyLineupLink')}>
            <Button
              type="text"
              size="small"
              icon={<LinkOutlined />}
              onClick={() => {
                const url = `${window.location.origin}${window.location.pathname}#${lp('/chat')}?chars=${conversationCharIds.join(',')}`;
                navigator.clipboard.writeText(url).catch(() => {});
                message.success(t('chat.linkCopied'));
              }}
            />
          </Tooltip>
        </>
      )}
    </div>
  );
}
