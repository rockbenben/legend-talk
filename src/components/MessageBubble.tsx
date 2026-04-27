import { memo } from 'react';
import ReactMarkdown from 'react-markdown';
import { useTranslation } from 'react-i18next';
import { Typography, theme as antTheme } from 'antd';
import { Avatar } from './Avatar';

const { Text } = Typography;
const { useToken } = antTheme;

interface MessageBubbleProps {
  content: string;
  isUser: boolean;
  avatar?: string;
  color?: string;
  name?: string;
  timestamp?: number;
}

const MODERATOR_RE = /moderator|⚖|主持|裁判|모더레이터|moderador|moderatore|moderateur|модератор|वार्ताकार|moderator|kıdemli/i;

const FRAUNCES = '"Fraunces", ui-serif, Georgia, "Times New Roman", serif';

/**
 * Three semantic registers, three visual languages:
 *
 *   Character → portrait + bold serif name + serif body. The "voice" form.
 *   Chair (user) → right-aligned, accent-edged. The "intervention" form.
 *   Moderator (⚖️) → centered, italic, framed by hairline rules. The
 *                    "synthesis" form — not a voice but a frame around voices.
 */
function MessageBubbleImpl({ content, isUser, avatar, color, name, timestamp }: MessageBubbleProps) {
  const { i18n } = useTranslation();
  const { token } = useToken();
  const trimmed = content?.trim() || '';
  const isEmpty = !trimmed;
  const isRaw = !isEmpty && trimmed.length === 1;
  const displayText = isRaw ? trimmed : trimmed.replace(/^\[([^\]]+)\]:/gm, '\\[$1]:');
  const isModerator = !!name && MODERATOR_RE.test(name);

  const timeLabel = timestamp
    ? new Intl.DateTimeFormat(i18n.language, { hour: '2-digit', minute: '2-digit' }).format(timestamp)
    : null;
  const fullDate = timestamp
    ? new Intl.DateTimeFormat(i18n.language, { dateStyle: 'medium', timeStyle: 'short' }).format(timestamp)
    : undefined;

  // ── Moderator: hairline-framed synthesis (left-aligned for readability) ──
  if (isModerator) {
    return (
      <div style={{ margin: '28px 0' }}>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            color: token.colorTextTertiary,
            fontSize: 12,
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
            marginBottom: 12,
            fontFamily: 'ui-monospace, "JetBrains Mono", Menlo, monospace',
          }}
        >
          <span aria-hidden style={{ width: 24, height: 1, background: token.colorBorderSecondary, flexShrink: 0 }} />
          <span>⚖ {name || 'Moderator'}{timeLabel ? ` · ${timeLabel}` : ''}</span>
          <span style={{ flex: 1, height: 1, background: token.colorBorderSecondary }} />
        </div>
        {!isEmpty && (
          <div
            className="prose dark:prose-invert prose-sm max-w-none"
            style={{
              fontFamily: FRAUNCES,
              fontStyle: 'italic',
              fontSize: 'clamp(15px, 0.6vw + 13.4px, 16.5px)',
              lineHeight: 1.7,
              color: token.colorTextSecondary,
              wordBreak: 'break-word',
              paddingInlineStart: 12,
              borderInlineStart: `2px solid ${token.colorBorderSecondary}`,
            }}
          >
            {isRaw ? <span>{displayText}</span> : <ReactMarkdown>{displayText}</ReactMarkdown>}
          </div>
        )}
      </div>
    );
  }

  // ── Chair (user): right-aligned intervention ─────────────────────────
  if (isUser) {
    return (
      <div style={{ display: 'flex', justifyContent: 'flex-end', margin: '20px 0' }}>
        <div style={{ maxWidth: '80%' }}>
          <div
            style={{
              fontSize: 11,
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
              color: token.colorPrimary,
              marginBottom: 6,
              textAlign: 'end',
              fontFamily: 'ui-monospace, "JetBrains Mono", Menlo, monospace',
            }}
            title={fullDate}
          >
            The Chair{timeLabel ? ` · ${timeLabel}` : ''}
          </div>
          {!isEmpty && (
            <div
              style={{
                padding: '10px 14px',
                borderInlineEnd: `2px solid ${token.colorPrimary}`,
                background: `color-mix(in srgb, ${token.colorPrimary} 7%, transparent)`,
                fontFamily: FRAUNCES,
                fontSize: 'clamp(15px, 0.6vw + 13.4px, 16.5px)',
                lineHeight: 1.65,
                color: token.colorText,
                wordBreak: 'break-word',
              }}
            >
              <div className="prose dark:prose-invert prose-sm max-w-none">
                {isRaw ? <span>{displayText}</span> : <ReactMarkdown>{displayText}</ReactMarkdown>}
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  // ── Character: portrait + name header + serif body ───────────────────
  return (
    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14, margin: '24px 0' }}>
      <div style={{ flexShrink: 0, paddingTop: 2 }}>
        <Avatar emoji={avatar || '👤'} color={color || 'gray'} size="md" />
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, flexWrap: 'wrap', marginBottom: 8 }}>
          {name && (
            <Text
              style={{
                fontFamily: FRAUNCES,
                fontSize: 17,
                fontWeight: 600,
                letterSpacing: '-0.005em',
                color: token.colorText,
                lineHeight: 1.2,
              }}
            >
              {name}
            </Text>
          )}
          {timeLabel && (
            <span
              style={{
                fontFamily: 'ui-monospace, "JetBrains Mono", Menlo, monospace',
                fontSize: 11,
                letterSpacing: '0.06em',
                color: token.colorTextTertiary,
              }}
              title={fullDate}
            >
              {timeLabel}
            </span>
          )}
        </div>
        {!isEmpty && (
          <div
            className="prose dark:prose-invert prose-sm max-w-none"
            style={{
              fontFamily: FRAUNCES,
              fontSize: 'clamp(15px, 0.6vw + 13.4px, 16.5px)',
              lineHeight: 1.7,
              color: token.colorText,
              wordBreak: 'break-word',
            }}
          >
            {isRaw ? <span>{displayText}</span> : <ReactMarkdown>{displayText}</ReactMarkdown>}
          </div>
        )}
      </div>
    </div>
  );
}

export const MessageBubble = memo(MessageBubbleImpl);
