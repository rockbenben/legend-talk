import { useLangPath } from '../hooks/useLangPath';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Input, Button, Empty, App, Tag } from 'antd';

const { CheckableTag } = Tag;
import { PlusOutlined, LinkOutlined } from '@ant-design/icons';
import { CharacterCard } from './CharacterCard';
import { CharacterEditor } from './CharacterEditor';
import { presetCharacters } from '../characters/presets';
import { generateCharacter } from '../characters/generator';
import { useSettingsStore } from '../stores/settings';
import type { Character } from '../types';

interface CharacterGridProps {
  onStartChat: (character: Character) => void;
  onSelect?: (character: Character) => void;
  selectedIds?: string[];
}

const CATEGORIES = ['all', 'philosophy', 'technology', 'business', 'strategy', 'science', 'psychology', 'economics', 'history', 'politics', 'literature', 'art', 'finance', 'education', 'religion', 'sociology'];

export function CharacterGrid({ onStartChat, onSelect, selectedIds = [] }: CharacterGridProps) {
  const { t } = useTranslation();
  const lp = useLangPath();
  const { message } = App.useApp();
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('all');
  const [showEditor, setShowEditor] = useState(false);
  const favoriteCharacters = useSettingsStore((s) => s.favoriteCharacters);
  const toggleFavorite = useSettingsStore((s) => s.toggleFavorite);

  const filtered = presetCharacters.filter((c) => {
    if (category !== 'all' && !c.domain.includes(category)) return false;
    if (search) {
      const q = search.toLowerCase();
      const name = t(`characters.${c.id}.name`).toLowerCase();
      return name.includes(q) || c.id.includes(q);
    }
    return true;
  });

  const sorted = [...filtered].sort((a, b) => {
    const aFav = favoriteCharacters.includes(a.id) ? 0 : 1;
    const bFav = favoriteCharacters.includes(b.id) ? 0 : 1;
    if (aFav !== bFav) return aFav - bFav;
    const aCustom = a.domain.includes('custom') ? 0 : 1;
    const bCustom = b.domain.includes('custom') ? 0 : 1;
    return aCustom - bCustom;
  });

  const handleSearchSubmit = () => {
    if (search && filtered.length === 0) {
      const custom = generateCharacter(search);
      onStartChat(custom);
    }
  };

  const copyCategoryLink = () => {
    const url = `${window.location.origin}${window.location.pathname}#${lp('/chat')}?category=${category}`;
    navigator.clipboard.writeText(url).catch(() => {});
    message.success(t('chat.linkCopied'));
  };

  return (
    <div>
      <Input
        size="large"
        allowClear
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        onPressEnter={handleSearchSubmit}
        placeholder={t('home.search')}
        style={{ marginBottom: 16 }}
      />
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, alignItems: 'center', marginBottom: 16 }}>
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
        {category !== 'all' && (
          <Button type="text" size="small" icon={<LinkOutlined />} onClick={copyCategoryLink} title={t('chat.copyCategoryLink')} />
        )}
      </div>
      <div style={{ marginBottom: 16 }}>
        <Button icon={<PlusOutlined />} onClick={() => setShowEditor(true)} style={{ borderStyle: 'dashed' }}>
          {t('chat.createCharacter')}
        </Button>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 12 }}>
        {sorted.map((c) => (
          <CharacterCard
            key={c.id}
            character={c}
            onStartChat={onStartChat}
            onSelect={onSelect}
            selected={selectedIds.includes(c.id)}
            isFavorite={favoriteCharacters.includes(c.id)}
            onToggleFavorite={toggleFavorite}
          />
        ))}
      </div>
      {search && filtered.length === 0 && (
        <Empty style={{ padding: 32 }} description={t('home.search')}>
          <Button type="primary" onClick={handleSearchSubmit}>
            {t('home.startChat')} — {search}
          </Button>
        </Empty>
      )}
      {showEditor && (
        <CharacterEditor
          onClose={() => setShowEditor(false)}
          onStartChat={(id) => {
            const char = presetCharacters.find((c) => c.id === id);
            if (char) onStartChat(char);
          }}
        />
      )}
    </div>
  );
}
