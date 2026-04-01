import ReactMarkdown from 'react-markdown';
import { Avatar } from './Avatar';

interface MessageBubbleProps {
  content: string;
  isUser: boolean;
  avatar?: string;
  color?: string;
  name?: string;
}

export function MessageBubble({ content, isUser, avatar, color, name }: MessageBubbleProps) {
  const trimmed = content?.trim() || '...';
  const isRaw = trimmed.length === 1;
  const displayText = isRaw ? trimmed : trimmed.replace(/^\[([^\]]+)\]:/gm, '\\[$1]:');

  return (
    <div className={`flex gap-2 sm:gap-3 ${isUser ? 'flex-row-reverse' : ''}`}>
      {isUser ? (
        <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-blue-500 flex items-center justify-center text-white text-xs sm:text-sm shrink-0">
          You
        </div>
      ) : (
        <div className="shrink-0">
          <Avatar emoji={avatar || '👤'} color={color || 'gray'} size="sm" />
        </div>
      )}
      <div
        className={`max-w-[90%] sm:max-w-[75%] rounded-2xl px-3 py-2 sm:px-4 ${
          isUser ? 'bg-blue-500 text-white' : 'bg-gray-100 dark:bg-gray-800'
        }`}
      >
        {name && !isUser && (
          <div className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1">{name}</div>
        )}
        <div className="prose dark:prose-invert prose-sm max-w-none break-words">
          {isRaw ? <span>{displayText}</span> : <ReactMarkdown>{displayText}</ReactMarkdown>}
        </div>
      </div>
    </div>
  );
}
