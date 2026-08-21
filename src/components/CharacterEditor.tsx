import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Modal, Form, Input, Button, Space, Typography } from 'antd';
import { useSettingsStore } from '../stores/settings';
import { presetCharacters } from '../characters/presets';
import { customCharacterId } from '../characters/generator';
import { Avatar, tintRgb } from './Avatar';
import { clearNameCache } from '../hooks/useRoundtable';
import i18n from '../i18n';
import type { CustomCharacter } from '../stores/settings';

const { Text } = Typography;

const COLORS = ['blue', 'emerald', 'red', 'purple', 'amber', 'teal', 'orange', 'indigo', 'cyan', 'rose', 'violet', 'green', 'slate', 'stone', 'pink', 'sky'];
const EMOJIS = ['👤', '🧠', '💡', '🎓', '🔬', '📚', '🎭', '🎨', '⚡', '🌟', '🔥', '🌊', '🏔️', '🦉', '🐉', '🤖'];

interface CharacterEditorProps {
  character?: CustomCharacter;
  onClose: () => void;
  onStartChat?: (id: string) => void;
}

export function CharacterEditor({ character, onClose, onStartChat }: CharacterEditorProps) {
  const { t } = useTranslation();
  const saveCustomCharacter = useSettingsStore((s) => s.saveCustomCharacter);

  const [name, setName] = useState(character?.displayName || '');
  const [avatar, setAvatar] = useState(character?.avatar || '👤');
  const [color, setColor] = useState(character?.color || 'blue');
  const [era, setEra] = useState(character?.era || '');
  const [prompt, setPrompt] = useState(character?.systemPrompt || '');
  const [saved, setSaved] = useState(false);
  const [savedId, setSavedId] = useState(character?.id || '');
  const isEdit = !!character;

  const handleSave = () => {
    const trimmed = name.trim();
    if (!trimmed || !prompt.trim()) return;
    // New characters get a deterministic name-based id (shared with deep links and
    // registry search); existing ones keep their id so persisted data is untouched.
    const id = character?.id || customCharacterId(trimmed);
    setSavedId(id);

    const char: CustomCharacter = {
      id, displayName: trimmed, era: era.trim() || undefined, domain: ['custom'], avatar, color, systemPrompt: prompt.trim(),
    };
    saveCustomCharacter(char);

    const existing = presetCharacters.find((c) => c.id === id);
    if (existing) {
      Object.assign(existing, { avatar, color, systemPrompt: prompt.trim() });
    } else {
      presetCharacters.push({ id, domain: ['custom'], avatar, color, systemPrompt: prompt.trim() });
    }

    for (const lng of Object.keys(i18n.store.data)) {
      i18n.addResourceBundle(lng, 'translation', {
        characters: { [id]: { name: trimmed, era: era.trim() || i18n.t('common.unknown', { lng }), questions: [] } },
      }, true, true);
    }
    // The roundtable name cache is keyed by (language, charId); drop it so an
    // edited name isn't shown with its stale value in later context labels.
    clearNameCache();

    if (onStartChat) {
      setSaved(true);
    } else {
      onClose();
    }
  };

  return (
    <Modal
      open
      onCancel={onClose}
      title={<span className="display-serif" style={{ fontSize: 18, fontWeight: 500 }}>{isEdit ? t('chat.editCharacter') : t('chat.createCharacter')}</span>}
      width={520}
      footer={[
        <Button key="cancel" onClick={onClose}>{t('common.cancel')}</Button>,
        saved && onStartChat ? (
          <Button key="start" type="primary" onClick={() => { onStartChat(savedId); onClose(); }}>
            {t('home.startChat')}
          </Button>
        ) : (
          <Button key="save" type="primary" onClick={handleSave} disabled={!name.trim() || !prompt.trim()}>
            {t('common.save')}
          </Button>
        ),
      ]}
    >
      <Form layout="vertical">
        <Form.Item label={t('chat.characterName')}>
          <Input
            value={name}
            onChange={(e) => { setName(e.target.value); setSaved(false); }}
            placeholder={t('chat.characterNamePlaceholder')}
          />
        </Form.Item>
        <Form.Item label={t('chat.characterEra')}>
          <Input
            value={era}
            onChange={(e) => { setEra(e.target.value); setSaved(false); }}
            placeholder={t('chat.characterEraPlaceholder')}
          />
        </Form.Item>
        <Form.Item label={t('chat.characterAvatar')}>
          <Space wrap size={[6, 6]}>
            {EMOJIS.map((e) => (
              <Button
                key={e}
                type={avatar === e ? 'primary' : 'default'}
                onClick={() => { setAvatar(e); setSaved(false); }}
                style={{ width: 40, height: 40, padding: 0, fontSize: 18 }}
              >
                {e}
              </Button>
            ))}
          </Space>
        </Form.Item>
        <Form.Item label={t('chat.characterColor')}>
          <Space wrap size={[6, 6]}>
            {COLORS.map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => { setColor(c); setSaved(false); }}
                aria-label={c}
                style={{
                  width: 28,
                  height: 28,
                  background: `rgb(${tintRgb[c]})`,
                  border: 'none',
                  borderRadius: 4,
                  cursor: 'pointer',
                  outline: color === c ? '2px solid var(--ant-color-primary)' : 'none',
                  outlineOffset: 2,
                }}
              />
            ))}
          </Space>
        </Form.Item>
        <Form.Item>
          <Space>
            <Avatar emoji={avatar} color={color} size="sm" />
            <Text className="display-serif" style={{ fontSize: 15, fontWeight: 500 }}>{name || '...'}</Text>
          </Space>
        </Form.Item>
        <Form.Item label={t('chat.characterSystemPrompt')}>
          <Input.TextArea
            value={prompt}
            onChange={(e) => { setPrompt(e.target.value); setSaved(false); }}
            placeholder={t('chat.characterPromptPlaceholder')}
            rows={5}
          />
        </Form.Item>
      </Form>
    </Modal>
  );
}
