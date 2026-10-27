import { useLangPath } from '../hooks/useLangPath';
import { useState, useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { Drawer, Input, Button, Typography, theme as antTheme } from 'antd';
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
import { isRtlLang } from '../utils/lang';

/** Short relative time: "this minute", "5m", "3h", "Yesterday", or "Mar 14". */
function formatRelative(ts: number, lng: string): string {
  const diff = Date.now() - ts;
  const min = Math.floor(diff / 60000);
  // Under a minute used to render a bare "·", which reads as a rendering
  // glitch rather than a time. Intl already has the phrase in every locale
  // ("此刻" / "this minute" / "1 分以内") — no new string needed.
  if (min < 1) return new Intl.RelativeTimeFormat(lng, { numeric: 'auto', style: 'short' }).format(0, 'minute');
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
    // 按【最近活跃】排序,不是按创建顺序。存储里的数组是创建顺序(createConversation
    // 往前插),但每条消息都会 bump updatedAt,标签又正是拿 updatedAt 显示的 ——
    // 于是"你三天前开的对话今天接着聊"会停在老位置上,标签却写着"此刻",
    // 整个列表的时间标签和顺序互相打架。只改渲染顺序,不动存储。
    const ordered = [...conversations].sort(
      (a, b) => (b.updatedAt || b.createdAt) - (a.updatedAt || a.createdAt),
    );
    const q = searchQuery.trim().toLowerCase();
    if (!q) return ordered;
    return ordered.filter((conv) => {
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
          // 「暂无对话」说的是【你一条都没有】,而搜索没匹配上时说的是【有,但不是
          // 这些】。混成一句话,用户会以为自己的记录没了 —— 数据其实都在,清空
          // 搜索词就回来。两种情况必须分开说。
          <Text type="secondary" style={{ display: 'block', padding: '32px 16px', textAlign: 'center', fontSize: 13 }}>
            {searchQuery.trim() ? t('chat.noSearchResults') : t('chat.noConversations')}
          </Text>
        ) : (
          filteredConversations.map((conv) => {
            const isActive = activeId === conv.id;
            const chars = conv.characters
              .map((id) => presetCharacters.find((p) => p.id === id))
              .filter((c): c is NonNullable<typeof c> => !!c);
            const visibleChars = chars.slice(0, 3);
            const extraChars = chars.length - visibleChars.length;
            const time = formatRelative(conv.updatedAt || conv.createdAt, i18n.language);
            return (
              <div
                key={conv.id}
                className="group"
                onClick={() => { navigate(lp(`/chat/${conv.id}`)); if (isMobile) setCollapsed(true); }}
                onDoubleClick={(e) => { e.stopPropagation(); startEditing(conv); }}
                style={{
                  padding: '10px 14px',
                  cursor: 'pointer',
                  // Active reads as a marginal rule + red title — a tinted
                  // background block would fight the "one hairline, no fill"
                  // doctrine (and turns into a muddy maroon in dark mode).
                  // --lt-madder, not token.colorPrimary: the dark algorithm
                  // DERIVES a slightly browner primary (#B06C73, 4.19:1 — under
                  // AA at 15px), while the CSS variable is the design's own
                  // madder at 7.39:1 light / 5.37:1 dark.
                  borderInlineStart: isActive ? '2px solid var(--lt-madder)' : '2px solid transparent',
                }}
              >
                <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 4 }}>
                  {/* Meta row leads: avatars + time are the scan anchors, the
                      title gets the full row width beneath them. */}
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
                    <Text type="secondary" style={{ fontSize: 11 }}>{time}</Text>
                  )}
                  {/* Title row: title + delete on hover/focus (touch: always, via .lt-reveal) */}
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
                            color: isActive ? 'var(--lt-madder)' : token.colorText,
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
                      className="opacity-0 group-hover:!opacity-100 group-focus-within:!opacity-100 lt-reveal"
                      style={{ color: token.colorTextTertiary, flexShrink: 0 }}
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteConversation(conv.id);
                        if (activeId === conv.id) navigate(lp('/chat'));
                      }}
                    />
                  </div>
                </div>
              </div>
            );
          })
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
          placement={isRtlLang(i18n.language) ? 'right' : 'left'}
          open={!collapsed}
          onClose={() => setCollapsed(true)}
          // `size`, not `width` — antd 6 deprecated `width` in favour of it
          // ("Will be removed in next major version"), and this Drawer only
          // mounts on phones, so the warning only ever showed up in mobile QA.
          size="80vw"
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
