import { useTranslation } from 'react-i18next';
import { Card, Button, Tag, Space, Typography } from 'antd';
import { StarFilled, StarOutlined, CheckOutlined, UserAddOutlined } from '@ant-design/icons';
import { Avatar } from './Avatar';
import type { Character } from '../types';

const { Text } = Typography;

interface CharacterCardProps {
  character: Character;
  onStartChat: (character: Character) => void;
  onSelect?: (character: Character) => void;
  selected?: boolean;
  isFavorite?: boolean;
  onToggleFavorite?: (characterId: string) => void;
}

export function CharacterCard({
  character,
  onStartChat,
  onSelect,
  selected,
  isFavorite,
  onToggleFavorite,
}: CharacterCardProps) {
  const { t } = useTranslation();
  const name = t(`characters.${character.id}.name`);
  const era = t(`characters.${character.id}.era`);

  return (
    <Card
      size="small"
      hoverable
      styles={{ body: { padding: 14 } }}
      style={selected ? { borderColor: 'var(--ant-color-primary)' } : undefined}
    >
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, marginBottom: 10 }}>
        <Avatar emoji={character.avatar} color={character.color} size="md" />
        <div style={{ flex: 1, minWidth: 0 }}>
          <Text className="display-serif" ellipsis style={{ display: 'block', fontSize: 16, fontWeight: 500 }}>
            {name}
          </Text>
          <Text type="secondary" ellipsis style={{ display: 'block', fontSize: 12 }}>{era}</Text>
        </div>
        {onToggleFavorite && (
          <Button
            type="text"
            size="small"
            icon={isFavorite ? <StarFilled style={{ color: 'var(--ant-color-primary)' }} /> : <StarOutlined />}
            onClick={(e) => { e.stopPropagation(); onToggleFavorite(character.id); }}
          />
        )}
      </div>
      <Space size={[4, 4]} wrap style={{ marginBottom: 10, minHeight: 22 }}>
        {character.domain.map((d) => (
          <Tag key={d} bordered={false}>{t(`home.categories.${d}`, d)}</Tag>
        ))}
      </Space>
      <Space.Compact block>
        <Button block onClick={(e) => { e.stopPropagation(); onStartChat(character); }}>
          {t('home.startChat')}
        </Button>
        {onSelect && (
          <Button
            type={selected ? 'primary' : 'default'}
            icon={selected ? <CheckOutlined /> : <UserAddOutlined />}
            onClick={(e) => { e.stopPropagation(); onSelect(character); }}
            title={t(selected ? 'roundtable.removeFromRoundtable' : 'roundtable.addToRoundtable')}
            style={{ width: 44 }}
          />
        )}
      </Space.Compact>
    </Card>
  );
}
