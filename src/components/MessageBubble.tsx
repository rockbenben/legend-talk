import { memo, useMemo } from 'react';
import ReactMarkdown from 'react-markdown';
import { useTranslation } from 'react-i18next';
import { Avatar } from './Avatar';

interface MessageBubbleProps {
  content: string;
  isUser: boolean;
  avatar?: string;
  color?: string;
  name?: string;
  /** Speaker's era/domain note, shown under the marginal name (e.g. "古希腊") */
  era?: string;
  /**
   * Enlarged opening character. The caller grants this to ONE speech per round
   * (the round opener) — with a drop cap on every speech, rounds where several
   * speakers open with the same word ("你…/你…/你…") read as a typo.
   */
  dropCap?: boolean;
  timestamp?: number;
  isModerator?: boolean;
}

/**
 * Three semantic registers, typeset as printed proceedings (议事录):
 *
 *   Character → marginal speaker label (name + madder rule + time) beside
 *               the transcript body, drop cap on the opening paragraph.
 *   Chair (user) → end-aligned block carried by a double madder rule.
 *   Moderator → double-framed memorandum with a centered letterspaced head.
 *
 * Visual layer lives in index.css (.lt-speech / .lt-chair / .lt-synthesis);
 * this component only decides which register applies.
 */
function MessageBubbleImpl({ content, isUser, avatar, color, name, era, dropCap = false, timestamp, isModerator = false }: MessageBubbleProps) {
  const { t, i18n } = useTranslation();
  const trimmed = content?.trim() || '';
  const isEmpty = !trimmed;
  const isRaw = !isEmpty && trimmed.length === 1;
  const displayText = isRaw ? trimmed : trimmed.replace(/^\[([^\]]+)\]:/gm, '\\[$1]:');

  // Cache the parsed-markdown element. Without this, ReactMarkdown re-parses
  // the whole accumulated text on every render — during streaming the last
  // message's `content` grows every ~50ms (token flush throttle), and parsing
  // a 500-char message costs ~200μs each time. The element identity stays
  // stable across renders of unrelated state (hover, focus), so React skips
  // re-rendering its subtree entirely.
  const renderedBody = useMemo(
    () => (isRaw ? <span>{displayText}</span> : <ReactMarkdown>{displayText}</ReactMarkdown>),
    [displayText, isRaw],
  );

  const timeLabel = timestamp
    ? new Intl.DateTimeFormat(i18n.language, { hour: '2-digit', minute: '2-digit' }).format(timestamp)
    : null;
  const fullDate = timestamp
    ? new Intl.DateTimeFormat(i18n.language, { dateStyle: 'medium', timeStyle: 'short' }).format(timestamp)
    : undefined;

  // ── Moderator: double-framed memorandum ──────────────────────────────
  if (isModerator) {
    const moderatorLabel = name || t('moderator.name');
    return (
      <div className="lt-synthesis">
        <div className="lt-synthesis-head">
          <span title={fullDate}>⚖ {moderatorLabel}{timeLabel ? ` · ${timeLabel}` : ''}</span>
        </div>
        {!isEmpty && <div className="lt-synthesis-body">{renderedBody}</div>}
      </div>
    );
  }

  // ── Chair (user): end-aligned, double madder rule ────────────────────
  if (isUser) {
    return (
      <div style={{ display: 'flex', justifyContent: 'flex-end', margin: '34px 0 10px' }}>
        <div className="lt-chair" style={{ maxWidth: '78%' }}>
          <div className="lt-chair-label" title={fullDate}>
            {t('chat.theChair')}{timeLabel ? ` · ${timeLabel}` : ''}
          </div>
          {!isEmpty && <div className="lt-chair-text">{renderedBody}</div>}
        </div>
      </div>
    );
  }

  // ── Character: marginal speaker label + transcript body ──────────────
  return (
    <div className="lt-speech">
      <div className="lt-speech-margin">
        <span className="lt-speech-avatar">
          <Avatar emoji={avatar || '👤'} color={color || 'gray'} size="xs" />
        </span>
        {name && <div className="lt-speech-name">{name}</div>}
        {era && <span className="lt-speech-meta">{era}</span>}
        {timeLabel && (
          <span className="lt-speech-meta" title={fullDate}>{timeLabel}</span>
        )}
      </div>
      {!isEmpty && (
        <div className={`lt-speech-body${dropCap && !isRaw ? ' lt-dropcap' : ''}`}>
          {renderedBody}
        </div>
      )}
    </div>
  );
}

export const MessageBubble = memo(MessageBubbleImpl);
