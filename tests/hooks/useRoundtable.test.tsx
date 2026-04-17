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

  it('second user message triggers focus card; chair starts to run rounds', async () => {
    mockAdapter();

    const convId = useConversationStore
      .getState()
      .createConversation('roundtable', ['socrates', 'munger']);
    const { result } = renderHook(() => useRoundtable(convId));

    await act(async () => {
      await result.current.sendMessage(convId, 'First topic', 1);
    });

    const after1 = useConversationStore.getState().getConversation(convId)!;
    // 1 user + 2 chars + 1 moderator = 4
    expect(after1.messages).toHaveLength(4);
    expect(result.current.isGenerating).toBe(false);

    // Second message: director intervention. sendMessage adds user + focus but does NOT run rounds.
    await act(async () => {
      await result.current.sendMessage(convId, 'Second topic', 1);
    });

    const after2 = useConversationStore.getState().getConversation(convId)!;
    // 4 existing + 1 user + 1 focus marker = 6; rounds not yet run
    expect(after2.messages).toHaveLength(6);
    expect(after2.messages[4].role).toBe('user');
    expect(after2.messages[4].content).toBe('Second topic');
    expect(after2.messages[5].characterId).toBe('__focus__');
    expect(result.current.isGenerating).toBe(false);

    // Chair confirms; startFromFocus runs rounds using the (possibly edited) focus topic.
    await act(async () => {
      await result.current.startFromFocus(convId, 1);
    });

    const after3 = useConversationStore.getState().getConversation(convId)!;
    // 6 existing + 2 chars + 1 moderator = 9
    expect(after3.messages).toHaveLength(9);
    expect(after3.messages[6].characterId).toBe('socrates');
    expect(after3.messages[7].characterId).toBe('munger');
    expect(after3.messages[8].characterId).toBe('__moderator__');
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
