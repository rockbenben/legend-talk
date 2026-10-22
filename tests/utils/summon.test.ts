import { parseSummonReply } from '../../src/utils/prompt';

/**
 * The panel is read out of the model's reply, which is NOT guaranteed to be a
 * bare JSON array. These cases are the ones that used to throw a perfectly
 * good answer away.
 */
const CHARS = [
  { id: 'socrates', names: ['Socrates', '苏格拉底'] },
  { id: 'confucius', names: ['Confucius', '孔子'] },
  { id: 'kant', names: ['Immanuel Kant', '伊曼努尔·康德'] },
  { id: 'taleb', names: ['Nassim Taleb', '塔勒布'] },
  { id: 'sun-tzu', names: ['Sun Tzu', '孙子'] },
];

describe('parseSummonReply', () => {
  it('reads a bare JSON array of ids', () => {
    const r = parseSummonReply('["socrates","confucius"]', CHARS);
    expect(r.reason).toBe('ok');
    expect(r.ids).toEqual(['socrates', 'confucius']);
  });

  it('reads an array that follows a sentence', () => {
    const r = parseSummonReply('Here are my picks: ["socrates","confucius"]', CHARS);
    expect(r.ids).toEqual(['socrates', 'confucius']);
  });

  it('does not stop at a bracketed phrase that comes before the answer', () => {
    // The old parser took the FIRST bracket group, read ["urban","rural"] as
    // the panel, and told the user no character matched their topic.
    const r = parseSummonReply(
      'The topic spans ["urban","rural"] issues, so I pick ["socrates","confucius"]',
      CHARS,
    );
    expect(r.reason).toBe('ok');
    expect(r.ids).toEqual(['socrates', 'confucius']);
  });

  it('accepts display names, not just catalogue ids', () => {
    const r = parseSummonReply('["苏格拉底","孔子"]', CHARS);
    expect(r.reason).toBe('ok');
    expect(r.ids).toEqual(['socrates', 'confucius']);
  });

  it('accepts English display names', () => {
    const r = parseSummonReply('["Immanuel Kant","Nassim Taleb"]', CHARS);
    expect(r.ids).toEqual(['kant', 'taleb']);
  });

  it('reads a name decorated with a gloss', () => {
    const r = parseSummonReply('["Socrates (苏格拉底)","孔子（Confucius）"]', CHARS);
    expect(r.ids).toEqual(['socrates', 'confucius']);
  });

  it('skips a non-JSON bracket group and keeps looking', () => {
    const r = parseSummonReply('I think [Socrates] and [Confucius] would work.', CHARS);
    expect(r.reason).toBe('no-list');
  });

  it('reports no-list when the reply carries no list at all', () => {
    const r = parseSummonReply('No suitable characters for this topic.', CHARS);
    expect(r.reason).toBe('no-list');
    expect(r.raw).toBe('No suitable characters for this topic.');
  });

  it('reports no-match when the list names nobody in the catalogue', () => {
    const r = parseSummonReply('["cleopatra","marco-polo"]', CHARS);
    expect(r.reason).toBe('no-match');
    expect(r.ids).toEqual([]);
  });

  it('caps the panel at five', () => {
    const many = Array.from({ length: 9 }, (_, i) => `c${i}`);
    const r = parseSummonReply(JSON.stringify(many), many.map((id) => ({ id })));
    expect(r.ids).toHaveLength(5);
  });

  it('de-duplicates a list that names the same character twice', () => {
    const r = parseSummonReply('["socrates","Socrates","苏格拉底"]', CHARS);
    expect(r.ids).toEqual(['socrates']);
  });
});
