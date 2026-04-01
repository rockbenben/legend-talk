import { useState } from 'react';
import { useLangPath } from '../hooks/useLangPath';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { useConversationStore } from '../stores/conversations';
import { exportAsMarkdown, exportAsJSON, downloadFile } from '../utils/export';
import type { Conversation, Character } from '../types';

interface ActionBarProps {
  conversation: Conversation;
  characters: Character[];
  displayTitle: string;
  isMulti: boolean;
  isGenerating: boolean;
  isSummarizing: boolean;
  rounds: number;
  shareStatus: 'idle' | 'sharing' | 'copied' | 'tooLong';
  onContinue: () => void;
  onSummarize: () => void;
  onShare: () => void;
  onStopSummarize: () => void;
}

export function ActionBar({
  conversation, characters, displayTitle, isMulti, isGenerating, isSummarizing, rounds,
  shareStatus, onContinue, onSummarize, onShare, onStopSummarize,
}: ActionBarProps) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const lp = useLangPath();
  const createConversation = useConversationStore((s) => s.createConversation);
  const [showExportMenu, setShowExportMenu] = useState(false);

  const hasMessages = conversation.messages.length > 0;

  const charNames = Object.fromEntries(
    characters.map((c) => [c.id, t(`characters.${c.id}.name`)]),
  );

  const handleExportMarkdown = () => {
    const md = exportAsMarkdown(conversation, charNames, displayTitle);
    downloadFile(md, `${displayTitle}.md`, 'text/markdown');
  };

  const handleExportJSON = () => {
    const json = exportAsJSON(conversation, charNames, displayTitle);
    downloadFile(json, `${displayTitle}.json`, 'application/json');
  };

  return (
    <div className="flex flex-wrap items-center gap-2 px-2 sm:px-4 pt-1">
      {hasMessages && !isGenerating && !isSummarizing && (
        <>
          {isMulti && (
            <button
              onClick={onContinue}
              className="text-xs px-3 py-2 rounded-full border border-blue-400 dark:border-blue-500 text-blue-500 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 active:bg-blue-100 dark:active:bg-blue-900/30 transition-colors"
            >
              {t('roundtable.continue', { count: rounds })}
            </button>
          )}
          <button
            onClick={onSummarize}
            className="text-xs px-3 py-2 rounded-full border border-gray-200 dark:border-gray-700 text-gray-500 dark:text-gray-400 hover:border-blue-400 hover:text-blue-500 active:bg-gray-100 dark:active:bg-gray-800 transition-colors"
          >
            {t('chat.summarize')}
          </button>
          <button
            onClick={() => {
              const type = conversation.characters.length > 1 ? 'roundtable' : 'single';
              const convId = createConversation(type, conversation.characters);
              navigate(lp(`/chat/${convId}`));
            }}
            className="text-xs px-3 py-2 rounded-full border border-gray-200 dark:border-gray-700 text-gray-500 dark:text-gray-400 hover:border-blue-400 hover:text-blue-500 active:bg-gray-100 dark:active:bg-gray-800 transition-colors"
          >
            {t('chat.newWithSame')}
          </button>
          <button
            onClick={onShare}
            disabled={shareStatus === 'sharing'}
            className="text-xs px-3 py-2 rounded-full border border-gray-200 dark:border-gray-700 text-gray-500 dark:text-gray-400 hover:border-blue-400 hover:text-blue-500 active:bg-gray-100 dark:active:bg-gray-800 disabled:opacity-50 transition-colors"
          >
            {shareStatus === 'sharing'
              ? '...'
              : shareStatus === 'copied'
                ? t('chat.copied')
                : shareStatus === 'tooLong'
                  ? t('chat.shareTooLong')
                  : t('chat.share')}
          </button>
          <div className="relative">
            <button
              onClick={() => setShowExportMenu(!showExportMenu)}
              className="text-xs px-3 py-2 rounded-full border border-gray-200 dark:border-gray-700 text-gray-500 dark:text-gray-400 hover:border-blue-400 hover:text-blue-500 active:bg-gray-100 dark:active:bg-gray-800 transition-colors"
            >
              {t('chat.export')} ▾
            </button>
            {showExportMenu && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setShowExportMenu(false)} />
                <div className="absolute bottom-full start-0 mb-1 py-1 min-w-[120px] rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 shadow-lg z-20">
                  <button
                    onClick={() => { handleExportMarkdown(); setShowExportMenu(false); }}
                    className="block w-full text-start px-4 py-2.5 text-sm text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 active:bg-gray-100 dark:active:bg-gray-700"
                  >
                    Markdown
                  </button>
                  <button
                    onClick={() => { handleExportJSON(); setShowExportMenu(false); }}
                    className="block w-full text-start px-4 py-2.5 text-sm text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 active:bg-gray-100 dark:active:bg-gray-700"
                  >
                    JSON
                  </button>
                </div>
              </>
            )}
          </div>
        </>
      )}
      {isSummarizing && (
        <span className="text-xs text-gray-400">
          {t('chat.summarizing')}
          <button onClick={onStopSummarize} className="ms-2 text-xs px-2.5 py-1 rounded-full border border-red-300 dark:border-red-700 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 active:bg-red-100">{t('chat.stop')}</button>
        </span>
      )}
    </div>
  );
}
