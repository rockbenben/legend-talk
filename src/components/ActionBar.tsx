import { useState, useRef } from 'react';
import { useLangPath } from '../hooks/useLangPath';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { Button, Dropdown, Space, Typography } from 'antd';
import { DownOutlined } from '@ant-design/icons';
import { useConversationStore } from '../stores/conversations';
import { useSettingsStore } from '../stores/settings';
import { exportAsMarkdown, exportAsJSON, downloadFile, generateShareCard } from '../utils/export';
import type { Conversation, Character } from '../types';

const { Text } = Typography;

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
  const shareCardEndpoint = useSettingsStore((s) => s.shareCardEndpoint);
  const [cardStatus, setCardStatus] = useState<'idle' | 'generating' | 'error' | 'network-error'>('idle');
  const cardAbortRef = useRef<AbortController | null>(null);
  const cardTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

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

  const handleShareCard = async (mode: 'zip' | 'long') => {
    if (cardStatus === 'generating') return;
    if (cardTimerRef.current) { clearTimeout(cardTimerRef.current); cardTimerRef.current = null; }
    const controller = new AbortController();
    cardAbortRef.current = controller;
    setCardStatus('generating');
    try {
      await generateShareCard(shareCardEndpoint, conversation, charNames, displayTitle, mode, controller.signal);
      setCardStatus('idle');
    } catch (err) {
      if (err instanceof DOMException && err.name === 'AbortError') { setCardStatus('idle'); return; }
      const isNetwork = err instanceof TypeError;
      setCardStatus(isNetwork ? 'network-error' : 'error');
      cardTimerRef.current = setTimeout(() => { setCardStatus('idle'); cardTimerRef.current = null; }, 4000);
    } finally {
      cardAbortRef.current = null;
    }
  };

  const handleCancelCard = () => cardAbortRef.current?.abort();

  const exportItems = [
    { key: 'md', label: 'Markdown', onClick: handleExportMarkdown },
    { key: 'json', label: 'JSON', onClick: handleExportJSON },
    ...(shareCardEndpoint ? [
      { type: 'divider' as const },
      { key: 'zip', label: t('chat.shareCardZip'), onClick: () => handleShareCard('zip'), disabled: cardStatus === 'generating' },
      { key: 'long', label: t('chat.shareCardLong'), onClick: () => handleShareCard('long'), disabled: cardStatus === 'generating' },
    ] : []),
  ];

  if (!hasMessages || isGenerating) {
    if (isSummarizing) {
      return (
        <div style={{ padding: '8px 16px 0', display: 'flex', alignItems: 'center', gap: 8 }}>
          <Text type="secondary">{t('chat.summarizing')}</Text>
          <Button danger size="small" onClick={onStopSummarize}>{t('chat.stop')}</Button>
        </div>
      );
    }
    return null;
  }

  return (
    <div style={{ padding: '8px 16px 0', borderTop: '1px solid var(--ant-color-border-secondary)' }}>
      <Space size="small" wrap>
        {isMulti && (
          <Button size="small" type="primary" ghost onClick={onContinue}>
            {t('roundtable.continue', { count: rounds })}
          </Button>
        )}
        <Button size="small" onClick={onSummarize}>{t('chat.summarize')}</Button>
        <Button
          size="small"
          onClick={() => {
            const type = conversation.characters.length > 1 ? 'roundtable' : 'single';
            const convId = createConversation(type, conversation.characters);
            navigate(lp(`/chat/${convId}`));
          }}
        >
          {t('chat.newWithSame')}
        </Button>
        <Button size="small" onClick={onShare} disabled={shareStatus === 'sharing'}>
          {shareStatus === 'sharing' ? '…' : shareStatus === 'copied' ? t('chat.copied') : t('chat.share')}
        </Button>
        <Dropdown menu={{ items: exportItems }} trigger={['click']}>
          <Button size="small">{t('chat.export')} <DownOutlined style={{ fontSize: 10 }} /></Button>
        </Dropdown>
        {cardStatus === 'generating' && (
          <Space size="small">
            <Text type="secondary">{t('chat.generatingCard')}</Text>
            <Button danger size="small" onClick={handleCancelCard}>{t('chat.stop')}</Button>
          </Space>
        )}
        {cardStatus === 'network-error' && <Text type="danger">{t('chat.cardNetworkError')}</Text>}
        {cardStatus === 'error' && <Text type="danger">{t('chat.cardError')}</Text>}
      </Space>
    </div>
  );
}
