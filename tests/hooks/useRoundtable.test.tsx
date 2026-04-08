import { renderHook, act } from '@testing-library/react';
import { useRoundtable } from '../../src/hooks/useRoundtable';
import { useConversationStore } from '../../src/stores/conversations';
import { useSettingsStore } from '../../src/stores/settings';
import * as registry from '../../src/adapters/registry';

beforeEach(() => {
  useConversationStore.setState(useConversationStore.getInitialState());
  useSettingsStore.setState(useSettingsStore.getInitialState());
  localStorage.clear();
});

function mockAdapter() {
  let callCount = 0;
  const mockChat = async function* () {
    callCount++;
    yield `Response ${callCount}`;
  };
  vi.spyOn(registry, 'getAdapter').mockReturnValue({
    id: 'openai',
    name: 'OpenAI',
    models: [{ id: 'gpt-4o', name: 'GPT-4o' }],
    validateKey: vi.fn(),
    chat: mockChat,
  });
  useSettingsStore.getState().setApiKey('deepseek', 'sk-test');
}

describe('useRoundtable', () => {
  it('runs multiple rounds with moderator synthesis', async () => {
    mockAdapter();

    const convId = useConversationStore
      .getState()
      .createConversation('roundtable', ['socrates', 'munger']);
    const { result } = renderHook(() => useRoundtable(convId));

    await act(async () => {
      await result.current.sendMessage(convId, 'How to think clearly?', 2);
    });

    const conv = useConversationStore.getState().getConversation(convId)!;
    // 1 user + (2 chars + 1 moderator) * 2 rounds = 7 messages
    expect(conv.messages).toHaveLength(7);
    expect(conv.messages[0].role).toBe('user');
    // Round 1
    expect(conv.messages[1].characterId).toBe('socrates');
    expect(conv.messages[2].characterId).toBe('munger');
    expect(conv.messages[3].characterId).toBe('__moderator__');
    // Round 2
    expect(conv.messages[4].characterId).toBe('socrates');
    expect(conv.messages[5].characterId).toBe('munger');
    expect(conv.messages[6].characterId).toBe('__moderator__');
  });

  it('defaults to 3 rounds', async () => {
    mockAdapter();

    const convId = useConversationStore
      .getState()
      .createConversation('roundtable', ['socrates', 'munger']);
    const { result } = renderHook(() => useRoundtable(convId));

    await act(async () => {
      await result.current.sendMessage(convId, 'Topic');
    });

    const conv = useConversationStore.getState().getConversation(convId)!;
    // 1 user + (2 chars + 1 moderator) * 3 rounds = 10 messages
    expect(conv.messages).toHaveLength(10);
  });

  it('regenerate continues from character with moderator', async () => {
    mockAdapter();

    const convId = useConversationStore
      .getState()
      .createConversation('roundtable', ['socrates', 'munger']);
    const { result } = renderHook(() => useRoundtable(convId));

    // Pre-populate: user message + one message from each character
    useConversationStore.getState().addMessage(convId, 'user', 'How to think clearly?', undefined);
    useConversationStore.getState().addMessage(convId, 'character', 'Socrates says...', 'socrates');
    useConversationStore.getState().addMessage(convId, 'character', 'Munger says...', 'munger');

    await act(async () => {
      await result.current.continueFrom(convId, 'munger', 1);
    });

    const conv = useConversationStore.getState().getConversation(convId)!;
    // 3 existing + regenerated munger + moderator = 5 messages
    expect(conv.messages).toHaveLength(5);
    expect(conv.messages[3].characterId).toBe('munger');
    expect(conv.messages[4].characterId).toBe('__moderator__');
  });
});
