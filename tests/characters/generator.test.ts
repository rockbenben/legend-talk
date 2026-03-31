import { generateCharacter } from '../../src/characters/generator';
import i18n from '../../src/i18n';

describe('generateCharacter', () => {
  it('generates a character from a name', () => {
    const char = generateCharacter('Elon Musk');
    expect(char.id).toBe('custom-elon-musk');
    expect(char.systemPrompt).toContain('Elon Musk');
    expect(char.domain).toEqual(['custom']);
    expect(char.avatar).toBeTruthy();
    expect(char.color).toBeTruthy();
    // Name injected into i18n
    expect(i18n.t('characters.custom-elon-musk.name')).toBe('Elon Musk');
  });

  it('generates unique ids for different names', () => {
    const a = generateCharacter('Person A');
    const b = generateCharacter('Person B');
    expect(a.id).not.toBe(b.id);
  });

  it('trims and lowercases for id', () => {
    const char = generateCharacter('  Albert Einstein  ');
    expect(char.id).toBe('custom-albert-einstein');
  });
});
