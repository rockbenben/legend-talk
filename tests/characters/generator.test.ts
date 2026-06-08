import { generateCharacter, customCharacterId } from '../../src/characters/generator';
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

  it('uses the same id for the same name regardless of entry point', () => {
    // The editor, deep links, and registry search all go through customCharacterId,
    // so a given name resolves to one character instead of several.
    expect(generateCharacter('Marie Curie').id).toBe(customCharacterId('Marie Curie'));
  });

  it('normalizes punctuation and preserves unicode letters', () => {
    expect(customCharacterId('Ada / Lovelace')).toBe('custom-ada-lovelace');
    expect(customCharacterId('苏格拉底')).toBe('custom-苏格拉底');
  });

  it('gives symbol-only names a stable, distinct id (no collision)', () => {
    expect(customCharacterId('!!!')).toBe(customCharacterId('!!!')); // deterministic
    expect(customCharacterId('!!!')).not.toBe(customCharacterId('???')); // distinct
    expect(customCharacterId('!!!')).toMatch(/^custom-/);
  });
});
