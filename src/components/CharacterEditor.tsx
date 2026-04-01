import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useSettingsStore } from '../stores/settings';
import { presetCharacters } from '../characters/presets';
import { Avatar } from './Avatar';
import i18n from '../i18n';
import type { CustomCharacter } from '../stores/settings';

const COLORS = ['blue', 'emerald', 'red', 'purple', 'amber', 'teal', 'orange', 'indigo', 'cyan', 'rose', 'violet', 'green', 'slate', 'stone', 'pink', 'sky'];
const EMOJIS = ['👤', '🧠', '💡', '🎓', '🔬', '📚', '🎭', '🎨', '⚡', '🌟', '🔥', '🌊', '🏔️', '🦉', '🐉', '🤖'];

interface CharacterEditorProps {
  character?: CustomCharacter;
  onClose: () => void;
}

export function CharacterEditor({ character, onClose }: CharacterEditorProps) {
  const { t } = useTranslation();
  const saveCustomCharacter = useSettingsStore((s) => s.saveCustomCharacter);

  const [name, setName] = useState(character?.displayName || '');
  const [avatar, setAvatar] = useState(character?.avatar || '👤');
  const [color, setColor] = useState(character?.color || 'blue');
  const [prompt, setPrompt] = useState(character?.systemPrompt || '');
  const isEdit = !!character;

  const handleSave = () => {
    const trimmed = name.trim();
    if (!trimmed || !prompt.trim()) return;
    const id = character?.id || 'custom-' + trimmed.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');

    const char: CustomCharacter = {
      id, displayName: trimmed, domain: ['custom'], avatar, color, systemPrompt: prompt.trim(),
    };
    saveCustomCharacter(char);

    // Inject into presetCharacters array (runtime)
    const existing = presetCharacters.find((c) => c.id === id);
    if (existing) {
      Object.assign(existing, { avatar, color, systemPrompt: prompt.trim() });
    } else {
      presetCharacters.push({ id, domain: ['custom'], avatar, color, systemPrompt: prompt.trim() });
    }

    // Inject i18n translations
    for (const lng of Object.keys(i18n.store.data)) {
      i18n.addResourceBundle(lng, 'translation', {
        characters: { [id]: { name: trimmed, era: i18n.t('common.unknown', { lng }), questions: [] } },
      }, true, true);
    }

    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/40 flex items-end sm:items-center justify-center z-50 sm:p-4" onClick={onClose}>
      <div className="bg-white dark:bg-gray-900 rounded-t-xl sm:rounded-xl shadow-xl w-full sm:max-w-md max-h-[85vh] sm:max-h-[80vh] flex flex-col" onClick={(e) => e.stopPropagation()}>
        <div className="p-3 sm:p-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
          <h3 className="font-semibold">{isEdit ? t('chat.editCharacter') : t('chat.createCharacter')}</h3>
          <button onClick={onClose} className="p-2 text-gray-400 hover:text-gray-600">✕</button>
        </div>
        <div className="flex-1 overflow-y-auto p-3 sm:p-4 space-y-4">
          {/* Name */}
          <div>
            <label className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1 block">{t('chat.characterName')}</label>
            <input
              type="text" value={name} onChange={(e) => setName(e.target.value)}
              placeholder={t('chat.characterNamePlaceholder')}
              className="w-full px-3 py-2 text-sm rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          {/* Avatar + Color */}
          <div className="flex gap-4">
            <div className="flex-1">
              <label className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1 block">{t('chat.characterAvatar')}</label>
              <div className="flex flex-wrap gap-1">
                {EMOJIS.map((e) => (
                  <button key={e} onClick={() => setAvatar(e)}
                    className={`w-8 h-8 rounded-lg text-lg flex items-center justify-center ${avatar === e ? 'ring-2 ring-blue-500 bg-blue-50 dark:bg-blue-900/30' : 'hover:bg-gray-100 dark:hover:bg-gray-800'}`}>
                    {e}
                  </button>
                ))}
              </div>
            </div>
            <div className="flex-1">
              <label className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1 block">{t('chat.characterColor')}</label>
              <div className="flex flex-wrap gap-1">
                {COLORS.map((c) => (
                  <button key={c} onClick={() => setColor(c)}
                    className={`w-6 h-6 rounded-full ${color === c ? 'ring-2 ring-offset-2 ring-blue-500' : ''}`}>
                    <Avatar emoji="" color={c} size="sm" />
                  </button>
                ))}
              </div>
            </div>
          </div>
          {/* Preview */}
          <div className="flex items-center gap-2 p-2 rounded-lg bg-gray-50 dark:bg-gray-800/50">
            <Avatar emoji={avatar} color={color} size="sm" />
            <span className="text-sm font-medium">{name || '...'}</span>
          </div>
          {/* System Prompt */}
          <div>
            <label className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1 block">System Prompt</label>
            <textarea
              value={prompt} onChange={(e) => setPrompt(e.target.value)}
              placeholder={t('chat.characterPromptPlaceholder')}
              className="w-full px-3 py-2 text-sm rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
              rows={5}
            />
          </div>
        </div>
        <div className="p-3 sm:p-4 border-t border-gray-200 dark:border-gray-700 flex gap-2 justify-end">
          <button onClick={onClose} className="px-4 py-2 text-sm rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800">
            {t('common.cancel')}
          </button>
          <button onClick={handleSave} disabled={!name.trim() || !prompt.trim()}
            className="px-4 py-2 text-sm rounded-lg bg-blue-500 text-white hover:bg-blue-600 disabled:opacity-50">
            {t('common.save')}
          </button>
        </div>
      </div>
    </div>
  );
}
