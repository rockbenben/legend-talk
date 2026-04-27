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
  const { t } = useTranslation();
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
              const last = conv.messages.length > 0
                ? conv.messages[conv.messages.length - 1].content.slice(0, 38)
                : t('chat.noMessages');
              return (
                <List.Item
                  onClick={() => { navigate(lp(`/chat/${conv.id}`)); if (isMobile) setCollapsed(true); }}
                  onDoubleClick={(e) => { e.stopPropagation(); startEditing(conv); }}
                  style={{
                    padding: '10px 16px',
                    cursor: 'pointer',
                    background: isActive ? `color-mix(in srgb, ${token.colorPrimary} 6%, transparent)` : undefined,
                    borderInlineStart: isActive ? `2px solid ${token.colorPrimary}` : '2px solid transparent',
                  }}
                  actions={[
                    <Button
                      key="del"
                      type="text"
                      size="small"
                      icon={<CloseOutlined />}
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteConversation(conv.id);
                        if (activeId === conv.id) navigate(lp('/chat'));
                      }}
                    />,
                  ]}
                >
                  <List.Item.Meta
                    title={
                      editingId === conv.id ? (
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
                        <Text className="display-serif" ellipsis style={{ fontSize: 15, fontWeight: 500 }}>
                          {getDisplayTitle(conv)}
                        </Text>
                      )
                    }
                    description={<Text type="secondary" ellipsis style={{ fontSize: 12 }}>{last}</Text>}
                  />
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
