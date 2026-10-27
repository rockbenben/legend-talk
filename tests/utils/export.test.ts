import { exportAsMarkdown, exportAsJSON, exportAsJSONFull, importFromJSON, safeFileName } from '../../src/utils/export';
import i18n from '../../src/i18n';
import type { Conversation } from '../../src/types';

const mockConversation: Conversation = {
  id: 'conv-1',
  type: 'single',
  characters: ['socrates'],
  messages: [
    { id: 'm1', role: 'user', content: 'What is truth?', timestamp: 1711700000000 },
    {
      id: 'm2',
      role: 'character',
      characterId: 'socrates',
      content: 'What do you mean by truth?',
      timestamp: 1711700010000,
    },
  ],
  createdAt: 1711700000000,
  updatedAt: 1711700010000,
};

const names = { socrates: 'Socrates' };
const title = 'Socrates';

beforeEach(async () => {
  await i18n.changeLanguage('en');
});

describe('exportAsMarkdown', () => {
  it('formats conversation as markdown', () => {
    const md = exportAsMarkdown(mockConversation, names, title);
    expect(md).toContain('# Socrates');
    expect(md).toContain('**The Chair:** What is truth?');
    expect(md).toContain('**Socrates:** What do you mean by truth?');
  });

  it('renders analysis messages as headings', () => {
    const conv: Conversation = {
      ...mockConversation,
      messages: [
        ...mockConversation.messages,
        { id: 'm3', role: 'character', characterId: '__summarize__', content: 'Key points...', timestamp: 0 },
      ],
    };
    const md = exportAsMarkdown(conv, names, title);
    expect(md).toContain('### Summarize');
  });

  // The exported file is handed to someone else. Its role labels must say
  // what the transcript said — a file that calls the moderator "Moderator"
  // while the screen called it 主持人 reads like a different document, and
  // "You" for the chair means the reader in a file the reader did not write.
  it('uses the same role labels as the interface, in the interface language', async () => {
    await i18n.changeLanguage('zh');
    const conv: Conversation = {
      ...mockConversation,
      messages: [
        { id: 'm1', role: 'user', content: '什么是真理?', timestamp: 0 },
        { id: 'm2', role: 'character', characterId: '__moderator__', content: '这一轮的分歧已经清楚。', timestamp: 0 },
        { id: 'm3', role: 'character', characterId: '__summarize__', content: '三条线索。', timestamp: 0 },
        { id: 'm4', role: 'character', characterId: '__focus__', content: '焦点内容', timestamp: 0 },
      ],
    };
    const md = exportAsMarkdown(conv, names, '远程办公会削弱团队的创造力吗?');
    expect(md).toContain('**主席:** 什么是真理?');
    expect(md).toContain('### 主持人');
    expect(md).toContain('### 总结对话');
    expect(md).toContain('### 讨论焦点');
    // No English role labels left behind.
    expect(md).not.toContain('You:');
    expect(md).not.toContain('Moderator');
    expect(md).not.toContain('Summary');
  });
});

describe('exportAsJSON', () => {
  it('returns minimal JSON with [speaker, content] tuples', () => {
    const json = exportAsJSON(mockConversation, names, title);
    const parsed = JSON.parse(json);
    expect(parsed.title).toBe('Socrates');
    expect(parsed.messages).toHaveLength(2);
    expect(parsed.messages[0]).toEqual(['The Chair', 'What is truth?']);
    expect(parsed.messages[1]).toEqual(['Socrates', 'What do you mean by truth?']);
  });

  it('labels analysis messages correctly', () => {
    const conv: Conversation = {
      ...mockConversation,
      messages: [
        ...mockConversation.messages,
        { id: 'm3', role: 'character', characterId: '__moderator__', content: 'Synthesis: ...', timestamp: 0 },
      ],
    };
    const json = exportAsJSON(conv, names, title);
    const parsed = JSON.parse(json);
    expect(parsed.messages[2]).toEqual(['Moderator', 'Synthesis: ...']);
  });
});

describe('safeFileName', () => {
  it('replaces characters the filesystem refuses', () => {
    // A topic is user text — "AI 会取代人类吗?" asks for a name Windows
    // cannot create, and the download would land under a mangled one.
    expect(safeFileName('AI 会取代人类吗?.md')).toBe('AI 会取代人类吗_.md');
    expect(safeFileName('C++/Rust 谁更强?.md')).toBe('C++_Rust 谁更强_.md');
    expect(safeFileName('a:b|c"d<e>f*g.md')).toBe('a_b_c_d_e_f_g.md');
  });

  it('drops trailing dots and spaces', () => {
    // Windows drops a trailing dot or space from the component name.
    expect(safeFileName('话题...  ')).toBe('话题');
    expect(safeFileName('话题. .md')).toBe('话题. .md');
  });

  it('falls back to a name when nothing usable is left', () => {
    expect(safeFileName('...  ')).toBe('Untitled');
  });

  it('keeps long titles from exceeding the filename limit', () => {
    const long = 'x'.repeat(300);
    expect([...safeFileName(long)].length).toBeLessThanOrEqual(100);
  });

  it('keeps the extension when it truncates', () => {
    // The extension is what tells the OS what the file is — cutting it off
    // leaves a file nothing opens as Markdown/JSON.
    const out = safeFileName(`${'远'.repeat(120)}.md`);
    expect(out.endsWith('.md')).toBe(true);
    expect([...out].length).toBeLessThanOrEqual(100 + 3);
  });
});

describe('importFromJSON', () => {
  it('parses a valid JSON conversation', () => {
    const json = exportAsJSONFull(mockConversation);
    const imported = importFromJSON(json);
    expect(imported.id).toBe('conv-1');
    expect(imported.messages).toHaveLength(2);
  });

  it('throws on invalid JSON', () => {
    expect(() => importFromJSON('not json')).toThrow();
  });
});
