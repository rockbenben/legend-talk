import { useLangPath } from '../hooks/useLangPath';
import { useState, useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { Drawer, Input, List, Button, Empty, Typography, theme as antTheme } from 'antd';
import {
  PlusOutlined,
  MenuOutlined,
  SettingOutlined,
  CloseOutlined,
  MenuFoldOutlined,
  SearchOutlined,
} from '@ant-design/icons';
import { useConversationStore } from '../stores/conversations';
import { presetCharacters } from '../characters/presets';
import { Avatar } from './Avatar';

/** Short relative time: "5m", "3h", "Yesterday", or "Mar 14". */
function formatRelative(ts: number, lng: string): string {
  const diff = Date.now() - ts;
  const min = Math.floor(diff / 60000);
  if (min < 1) return '·';
  if (min < 60) return new Intl.RelativeTimeFormat(lng, { numeric: 'auto', style: 'short' }).format(-min, 'minute');
  const hr = Math.floor(diff / 3600000);
  if (hr < 24) return new Intl.RelativeTimeFormat(lng, { numeric: 'auto', style: 'short' }).format(-hr, 'hour');
  const day = Math.floor(diff / 86400000);
  if (day < 7) return new Intl.RelativeTimeFormat(lng, { numeric: 'auto', style: 'short' }).format(-day, 'day');
  return new Intl.DateTimeFormat(lng, { month: 'short', day: 'numeric' }).format(ts);
}

const { Text } = Typography;
const { useToken } = antTheme;

interface ConversationListProps {
  activeId?: string;
}

function useIsMobile() {
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  useEffect(() => {
    const handler = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handler);
    return () => window.removeEventListener('resize', handler);
  }, []);
  return isMobile;
}

export function ConversationList({ activeId }: ConversationListProps) {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const lp = useLangPath();
  const { token } = useToken();
  const conversations = useConversationStore((s) => s.conversations);
  const deleteConversation = useConversationStore((s) => s.deleteConversation);
  const renameConversation = useConversationStore((s) => s.renameConversation);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState('');
  const isMobile = useIsMobile();
  const [collapsed, setCollapsed] = useState(isMobile);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    setCollapsed(isMobile);
  }, [isMobile]);

  const getDisplayTitle = (conv: typeof conversations[0]) => {
    if (conv.title) return conv.title;
    return conv.characters
      .map((id) => {
        const c = presetCharacters.find((p) => p.id === id);
        return c ? (t(`characters.${c.id}.name`)) : id;
      })
      .join(', ');
  };

  const filteredConversations = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return conversations;
    return conversations.filter((conv) => {
      const title = getDisplayTitle(conv).toLowerCase();
      if (title.includes(q)) return true;
      const charNames = conv.characters
        .map((id) => {
          const c = presetCharacters.find((p) => p.id === id);
          return c ? t(`characters.${c.id}.name`).toLowerCase() : id.toLowerCase();
        })
        .join(' ');
      if (charNames.includes(q)) return true;
      return conv.messages.some((m) => m.content.toLowerCase().includes(q));
    });
  }, [conversations, searchQuery, t]); // eslint-disable-line react-hooks/exhaustive-deps

  const startEditing = (conv: typeof conversations[0]) => {
    setEditingId(conv.id);
    setEditValue(getDisplayTitle(conv));
  };

  const finishEditing = () => {
    if (editingId && editValue.trim()) renameConversation(editingId, editValue.trim());
    setEditingId(null);
  };

  const renderListBody = () => (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div style={{ padding: '12px 12px 8px', display: 'flex', gap: 8 }}>
        <Button
          icon={<PlusOutlined />}
          onClick={() => { navigate(lp('/chat')); if (isMobile) setCollapsed(true); }}
          block
        >
          {t('chat.newChat')}
        </Button>
        {!isMobile && (
          <Button
            type="text"
            icon={<MenuFoldOutlined className="rtl:-scale-x-100" />}
            onClick={() => setCollapsed(true)}
          />
        )}
      </div>
      <div style={{ padding: '0 12px 8px' }}>
        <Input
          allowClear
          placeholder={t('chat.searchConversations')}
          prefix={<SearchOutlined />}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>
      <div style={{ flex: 1, overflowY: 'auto' }}>
        {filteredConversations.length === 0 ? (
          <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description={t('chat.noConversations')} style={{ padding: 24 }} />
        ) : (
          <List
            dataSource={filteredConversations}
            renderItem={(conv) => {
              const isActive = activeId === conv.id;
              const chars = conv.characters
                .map((id) => presetCharacters.find((p) => p.id === id))
                .filter((c): c is NonNullable<typeof c> => !!c);
              const visibleChars = chars.slice(0, 3);
              const extraChars = chars.length - visibleChars.length;
              const time = formatRelative(conv.updatedAt || conv.createdAt, i18n.language);
              return (
                <List.Item
                  className="group"
                  onClick={() => { navigate(lp(`/chat/${conv.id}`)); if (isMobile) setCollapsed(true); }}
                  onDoubleClick={(e) => { e.stopPropagation(); startEditing(conv); }}
                  style={{
                    padding: '12px 14px',
                    cursor: 'pointer',
                    background: isActive ? `color-mix(in srgb, ${token.colorPrimary} 6%, transparent)` : undefined,
                    borderInlineStart: isActive ? `2px solid ${token.colorPrimary}` : '2px solid transparent',
                  }}
                >
                  <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 6 }}>
                    {/* Title row: title + delete on hover */}
                    <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        {editingId === conv.id ? (
                          <Input
                            size="small"
                            autoFocus
                            value={editValue}
                            onChange={(e) => setEditValue(e.target.value)}
                            onBlur={finishEditing}
                            onPressEnter={finishEditing}
                            onKeyDown={(e) => { if (e.key === 'Escape') setEditingId(null); }}
                            onClick={(e) => e.stopPropagation()}
                          />
                        ) : (
                          <Text
                            className="display-serif"
                            ellipsis
                            style={{
                              fontSize: 15,
                              fontWeight: isActive ? 600 : 500,
                              color: isActive ? token.colorPrimary : token.colorText,
                              display: 'block',
                            }}
                          >
                            {getDisplayTitle(conv)}
                          </Text>
                        )}
                      </div>
                      <Button
                        type="text"
                        size="small"
                        icon={<CloseOutlined style={{ fontSize: 11 }} />}
                        className="opacity-0 group-hover:!opacity-100"
                        style={{ color: token.colorTextTertiary, transition: 'opacity 0.18s', flexShrink: 0 }}
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteConversation(conv.id);
                          if (activeId === conv.id) navigate(lp('/chat'));
                        }}
                      />
                    </div>
                    {/* Meta row: stacked participant avatars + relative time */}
                    {chars.length > 0 ? (
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
                        <div style={{ display: 'flex', flexShrink: 0 }}>
                          {visibleChars.map((c, j) => (
                            <div
                              key={c.id}
                              style={{
                                marginInlineStart: j > 0 ? -6 : 0,
                                position: 'relative',
                                zIndex: j + 1,
                              }}
                            >
                              <Avatar emoji={c.avatar} color={c.color} size="xs" />
                            </div>
                          ))}
                        </div>
                        {extraChars > 0 && (
                          <Text type="secondary" style={{ fontSize: 11, flexShrink: 0 }}>+{extraChars}</Text>
                        )}
                        <Text
                          type="secondary"
                          style={{
                            fontSize: 11,
                            fontFamily: 'ui-monospace, "JetBrains Mono", Menlo, monospace',
                            marginInlineStart: 'auto',
                            flexShrink: 0,
                          }}
                        >
                          {time}
                        </Text>
                      </div>
                    ) : (
                      <Text type="secondary" style={{ fontSize: 11 }}>
                        {time}
                      </Text>
                    )}
                  </div>
                </List.Item>
              );
            }}
          />
        )}
      </div>
      <div style={{ padding: 12, borderTop: `1px solid ${token.colorBorderSecondary}` }}>
        <Button
          type="text"
          icon={<SettingOutlined />}
          onClick={() => { navigate(lp('/settings')); if (isMobile) setCollapsed(true); }}
          block
          style={{ textAlign: 'start', justifyContent: 'flex-start' }}
        >
          {t('nav.settings')}
        </Button>
      </div>
    </div>
  );

  if (!isMobile && collapsed) {
    return (
      <div
        style={{
          width: 44,
          borderInlineEnd: `1px solid ${token.colorBorderSecondary}`,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          padding: '8px 0',
          gap: 4,
        }}
      >
        <Button type="text" icon={<MenuOutlined />} onClick={() => setCollapsed(false)} />
        <div style={{ flex: 1 }} />
        <Button type="text" icon={<SettingOutlined />} onClick={() => navigate(lp('/settings'))} title={t('nav.settings')} />
      </div>
    );
  }

  if (isMobile) {
    return (
      <>
        <div
          style={{
            width: 44,
            borderInlineEnd: `1px solid ${token.colorBorderSecondary}`,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            padding: '8px 0',
          }}
        >
          <Button type="text" icon={<MenuOutlined />} onClick={() => setCollapsed(false)} />
          <div style={{ flex: 1 }} />
          <Button type="text" icon={<SettingOutlined />} onClick={() => navigate(lp('/settings'))} />
        </div>
        <Drawer
          placement="left"
          open={!collapsed}
          onClose={() => setCollapsed(true)}
          width="80vw"
          styles={{ body: { padding: 0 }, header: { display: 'none' } }}
        >
          {renderListBody()}
        </Drawer>
      </>
    );
  }

  return (
    <aside
      style={{
        width: 272,
        flexShrink: 0,
        height: '100%',
        borderInlineEnd: `1px solid ${token.colorBorderSecondary}`,
        background: token.colorBgContainer,
      }}
    >
      {renderListBody()}
    </aside>
  );
}
