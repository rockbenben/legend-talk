import { useConversationStore } from '../../src/stores/conversations';

beforeEach(() => {
  useConversationStore.setState(useConversationStore.getInitialState());
  localStorage.clear();
});

describe('conversationStore', () => {
  it('starts with empty conversations', () => {
    expect(useConversationStore.getState().conversations).toEqual([]);
  });

  it('auto-title truncation does not split a surrogate pair (no lone � at the cut)', () => {
    const id = useConversationStore.getState().createConversation('single', ['socrates']);
    const content = '问'.repeat(28) + '😀后续内容';
    useConversationStore.getState().addMessage(id, 'user', content, undefined);
    const title = useConversationStore.getState().getConversation(id)!.title!;
    expect([...title].length).toBe(29);
    expect(title.endsWith('😀')).toBe(true);
  });

  it('creates a single conversation', () => {
    const { createConversation } = useConversationStore.getState();
    const id = createConversation('single', ['socrates']);
    const conv = useConversationStore.getState().conversations[0];
    expect(conv.id).toBe(id);
    expect(conv.type).toBe('single');
    expect(conv.characters).toEqual(['socrates']);
    expect(conv.messages).toEqual([]);
  });

  it('creates a roundtable conversation', () => {
    const { createConversation } = useConversationStore.getState();
    const id = createConversation('roundtable', ['socrates', 'munger', 'feynman']);
    const conv = useConversationStore.getState().conversations[0];
    expect(conv.id).toBe(id);
    expect(conv.type).toBe('roundtable');
    expect(conv.characters).toEqual(['socrates', 'munger', 'feynman']);
  });

  it('adds a message to a conversation', () => {
    const { createConversation, addMessage } = useConversationStore.getState();
    const convId = createConversation('single', ['socrates']);
    const msgId = addMessage(convId, 'user', 'Hello', undefined);
    const conv = useConversationStore.getState().conversations[0];
    expect(conv.messages).toHaveLength(1);
    expect(conv.messages[0].id).toBe(msgId);
    expect(conv.messages[0].role).toBe('user');
    expect(conv.messages[0].content).toBe('Hello');
  });

  it('adds a character message with characterId', () => {
    const { createConversation, addMessage } = useConversationStore.getState();
    const convId = createConversation('single', ['socrates']);
    addMessage(convId, 'character', 'Let me ask you a question.', 'socrates');
    const msg = useConversationStore.getState().conversations[0].messages[0];
    expect(msg.characterId).toBe('socrates');
  });

  it('updates message content (for streaming)', () => {
    const { createConversation, addMessage, updateMessageContent } =
      useConversationStore.getState();
    const convId = createConversation('single', ['socrates']);
    const msgId = addMessage(convId, 'character', '', 'socrates');
    updateMessageContent(convId, msgId, 'Hello');
    updateMessageContent(convId, msgId, 'Hello world');
    const msg = useConversationStore.getState().conversations[0].messages[0];
    expect(msg.content).toBe('Hello world');
  });

  it('deletes a conversation', () => {
    const { createConversation, deleteConversation } = useConversationStore.getState();
    const id = createConversation('single', ['socrates']);
    expect(useConversationStore.getState().conversations).toHaveLength(1);
    deleteConversation(id);
    expect(useConversationStore.getState().conversations).toHaveLength(0);
  });

  it('gets a conversation by id', () => {
    const { createConversation, getConversation } = useConversationStore.getState();
    const id = createConversation('single', ['socrates']);
    const conv = getConversation(id);
    expect(conv).toBeDefined();
    expect(conv!.id).toBe(id);
  });

  it('auto-sets title from first user message', () => {
    const { createConversation, addMessage } = useConversationStore.getState();
    const convId = createConversation('single', ['socrates']);
    addMessage(convId, 'user', 'What is the meaning of life and how should I live it?', undefined);
    const conv = useConversationStore.getState().getConversation(convId)!;
    expect(conv.title).toBe('What is the meaning of life a');
  });

  it('does not overwrite existing title', () => {
    const { createConversation, addMessage, renameConversation } = useConversationStore.getState();
    const convId = createConversation('single', ['socrates']);
    renameConversation(convId, 'My Topic');
    addMessage(convId, 'user', 'Hello', undefined);
    const conv = useConversationStore.getState().getConversation(convId)!;
    expect(conv.title).toBe('My Topic');
  });

  it('renames a conversation', () => {
    const { createConversation, renameConversation } = useConversationStore.getState();
    const convId = createConversation('single', ['socrates']);
    renameConversation(convId, 'New Title');
    const conv = useConversationStore.getState().getConversation(convId)!;
    expect(conv.title).toBe('New Title');
  });

  it('updates characters list', () => {
    const { createConversation, updateCharacters } = useConversationStore.getState();
    const convId = createConversation('single', ['socrates']);
    updateCharacters(convId, ['socrates', 'munger']);
    const conv = useConversationStore.getState().getConversation(convId)!;
    expect(conv.characters).toEqual(['socrates', 'munger']);
  });

  it('updates conversation type when updating characters', () => {
    const { createConversation, updateCharacters } = useConversationStore.getState();
    const convId = createConversation('single', ['socrates']);
    updateCharacters(convId, ['socrates', 'munger', 'feynman']);
    const conv = useConversationStore.getState().getConversation(convId)!;
    expect(conv.type).toBe('roundtable');
  });
});
