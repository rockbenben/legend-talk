import { presetCharacters } from '../../src/characters/presets';
import { roundtableTemplates } from '../../src/characters/templates';
import { tintRgb } from '../../src/components/Avatar';
import i18n from '../../src/i18n';

describe('presetCharacters', () => {
  it('has 100+ characters', () => {
    expect(presetCharacters.length).toBeGreaterThanOrEqual(100);
  });

  it('each character has required fields', () => {
    for (const char of presetCharacters) {
      expect(char.id).toBeTruthy();
      expect(char.domain.length).toBeGreaterThan(0);
      expect(char.avatar).toBeTruthy();
      expect(char.color).toBeTruthy();
      expect(char.systemPrompt).toBeTruthy();
      // i18n translations exist
      expect(i18n.t(`characters.${char.id}.name`)).toBeTruthy();
      expect(i18n.t(`characters.${char.id}.era`)).toBeTruthy();
    }
  });

  it('has unique ids', () => {
    const ids = presetCharacters.map((c) => c.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('every roundtable template references existing characters', () => {
    const ids = new Set(presetCharacters.map((c) => c.id));
    for (const tpl of roundtableTemplates) {
      expect(tpl.characters.length).toBeGreaterThan(0);
      for (const cid of tpl.characters) {
        expect(ids.has(cid)).toBe(true);
        expect(i18n.t(`characters.${cid}.name`)).toBeTruthy();
      }
    }
  });

  it('every preset color has an Avatar tint mapping (no silent gray fallback)', () => {
    for (const char of presetCharacters) {
      expect(tintRgb[char.color], `color "${char.color}" of ${char.id} missing in tintRgb`).toBeTruthy();
    }
  });

  it('covers all categories', () => {
    const domains = new Set(presetCharacters.flatMap((c) => c.domain));
    expect(domains).toContain('philosophy');
    expect(domains).toContain('business');
    expect(domains).toContain('science');
    expect(domains).toContain('strategy');
    expect(domains).toContain('psychology');
    expect(domains).toContain('literature');
    expect(domains).toContain('art');
    expect(domains).toContain('religion');
    expect(domains).toContain('politics');
    expect(domains).toContain('economics');
    expect(domains).toContain('education');
  });
});
