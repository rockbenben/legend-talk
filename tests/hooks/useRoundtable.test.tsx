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
  it('runs multiple rounds of discussion', async () => {
    mockAdapter();
    const { result } = renderHook(() => useRoundtable());

    const convId = useConversationStore
      .getState()
      .createConversation('roundtable', ['socrates', 'munger']);

    await act(async () => {
      await result.current.sendMessage(convId, 'How to think clearly?', 2);
    });

    const conv = useConversationStore.getState().getConversation(convId)!;
    // 1 user + 2 characters * 2 rounds = 5 messages
    expect(conv.messages).toHaveLength(5);
    expect(conv.messages[0].role).toBe('user');
    // Round 1
    expect(conv.messages[1].characterId).toBe('socrates');
    expect(conv.messages[2].characterId).toBe('munger');
    // Round 2
    expect(conv.messages[3].characterId).toBe('socrates');
    expect(conv.messages[4].characterId).toBe('munger');
  });

  it('defaults to 3 rounds', async () => {
    mockAdapter();
    const { result } = renderHook(() => useRoundtable());

    const convId = useConversationStore
      .getState()
      .createConversation('roundtable', ['socrates', 'munger']);

    await act(async () => {
      await result.current.sendMessage(convId, 'Topic');
    });

    const conv = useConversationStore.getState().getConversation(convId)!;
    // 1 user + 2 characters * 3 rounds = 7 messages
    expect(conv.messages).toHaveLength(7);
  });

  it('regenerate appends a new message for a specific character', async () => {
    mockAdapter();
    const { result } = renderHook(() => useRoundtable());

    const convId = useConversationStore
      .getState()
      .createConversation('roundtable', ['socrates', 'munger']);

    // Pre-populate: user message + one message from each character
    useConversationStore.getState().addMessage(convId, 'user', 'How to think clearly?', undefined);
    useConversationStore.getState().addMessage(convId, 'character', 'Socrates says...', 'socrates');
    useConversationStore.getState().addMessage(convId, 'character', 'Munger says...', 'munger');

    await act(async () => {
      await result.current.continueFrom(convId, 'munger', 1);
    });

    const conv = useConversationStore.getState().getConversation(convId)!;
    // Should have 4 messages: user + socrates + munger + regenerated munger
    expect(conv.messages).toHaveLength(4);
    expect(conv.messages[3].role).toBe('character');
    expect(conv.messages[3].characterId).toBe('munger');
    expect(conv.messages[3].content).toBe('Response 1');
  });
});
