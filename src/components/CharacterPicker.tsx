import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Modal, Input, List, Button, Tag, Typography, Space } from 'antd';

const { CheckableTag } = Tag;
import { StarFilled } from '@ant-design/icons';
import { presetCharacters } from '../characters/presets';
import { generateCharacter } from '../characters/generator';
import { Avatar } from './Avatar';
import { useSettingsStore } from '../stores/settings';
import type { Character } from '../types';

const { Text } = Typography;

const CATEGORIES = ['all', 'philosophy', 'strategy', 'business', 'finance', 'history', 'sociology', 'psychology', 'science', 'literature', 'art', 'economics', 'politics', 'technology', 'religion', 'education'];

interface CharacterPickerProps {
  onSelect: (character: Character) => void;
  onClose: () => void;
  excludeIds?: string[];
}

export function CharacterPicker({ onSelect, onClose, excludeIds = [] }: CharacterPickerProps) {
  const { t } = useTranslation();
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('all');
  const favoriteCharacters = useSettingsStore((s) => s.favoriteCharacters);

  const filtered = presetCharacters.filter((c) => {
    if (excludeIds.includes(c.id)) return false;
    if (category !== 'all' && !c.domain.includes(category)) return false;
    if (search) {
      const q = search.toLowerCase();
      const name = t(`characters.${c.id}.name`).toLowerCase();
      const era = t(`characters.${c.id}.era`, { defaultValue: '' }).toLowerCase();
      const domainEn = c.domain.join(' ').toLowerCase();
      const domainLocalized = c.domain.map((d) => t(`home.categories.${d}`, { defaultValue: '' }).toLowerCase()).join(' ');
      return name.includes(q) || c.id.includes(q) || era.includes(q) || domainEn.includes(q) || domainLocalized.includes(q);
    }
    return true;
  });

  const sorted = [...filtered].sort((a, b) => {
    const aFav = favoriteCharacters.includes(a.id) ? 0 : 1;
    const bFav = favoriteCharacters.includes(b.id) ? 0 : 1;
    return aFav - bFav;
  });

  const handleSelect = (char: Character) => {
    onSelect(char);
    onClose();
  };

  const handleCustom = () => {
    if (search.trim()) {
      const custom = generateCharacter(search.trim());
      if (!presetCharacters.find((c) => c.id === custom.id)) {
        presetCharacters.push(custom);
      }
      onSelect(custom);
      onClose();
    }
  };

  return (
    <Modal
      open
      onCancel={onClose}
      footer={null}
      title={<span className="display-serif" style={{ fontSize: 18, fontWeight: 500 }}>{t('chat.addParticipant')}</span>}
      width={520}
      styles={{ body: { padding: 0 } }}
    >
      <Space direction="vertical" style={{ width: '100%', padding: '0 24px 16px' }} size="middle">
        <Input
          autoFocus
          allowClear
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          onPressEnter={() => filtered.length === 0 && handleCustom()}
          placeholder={t('home.search')}
        />
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, width: '100%' }}>
          {CATEGORIES.map((c) => (
            <CheckableTag
              key={c}
              checked={category === c}
              onChange={() => setCategory(c)}
              style={{ margin: 0, fontSize: 13, padding: '2px 10px' }}
            >
              {t(`home.categories.${c}`)}
            </CheckableTag>
          ))}
        </div>
      </Space>
      <div style={{ maxHeight: '60vh', overflowY: 'auto' }}>
        <List
          dataSource={sorted}
          locale={{
            emptyText: search ? (
              <div style={{ padding: 24, textAlign: 'center' }}>
                <Button type="primary" onClick={handleCustom}>{t('home.startChat')} — {search}</Button>
              </div>
            ) : t('chat.noConversations'),
          }}
          renderItem={(char) => (
            <List.Item
              style={{ padding: '10px 24px', cursor: 'pointer' }}
              onClick={() => handleSelect(char)}
              extra={favoriteCharacters.includes(char.id) ? <StarFilled style={{ color: 'var(--ant-color-primary)' }} /> : null}
            >
              <List.Item.Meta
                avatar={<Avatar emoji={char.avatar} color={char.color} size="sm" />}
                title={
                  <Text className="display-serif" style={{ fontSize: 15, fontWeight: 500 }}>
                    {t(`characters.${char.id}.name`)}
                  </Text>
                }
                description={<Text type="secondary" style={{ fontSize: 12 }}>{t(`characters.${char.id}.era`)}</Text>}
              />
            </List.Item>
          )}
        />
      </div>
    </Modal>
  );
}
