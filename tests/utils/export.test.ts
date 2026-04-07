import { exportAsMarkdown, exportAsJSON, exportAsJSONFull, importFromJSON } from '../../src/utils/export';
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

describe('exportAsMarkdown', () => {
  it('formats conversation as markdown', () => {
    const md = exportAsMarkdown(mockConversation, names, title);
    expect(md).toContain('# Socrates');
    expect(md).toContain('**You:** What is truth?');
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
    expect(md).toContain('### Summary');
  });
});

describe('exportAsJSON', () => {
  it('returns minimal JSON with [speaker, content] tuples', () => {
    const json = exportAsJSON(mockConversation, names, title);
    const parsed = JSON.parse(json);
    expect(parsed.title).toBe('Socrates');
    expect(parsed.messages).toHaveLength(2);
    expect(parsed.messages[0]).toEqual(['You', 'What is truth?']);
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
