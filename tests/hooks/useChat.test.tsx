import { renderHook, act } from '@testing-library/react';
import { useChat } from '../../src/hooks/useChat';
import { useConversationStore } from '../../src/stores/conversations';
import { useSettingsStore } from '../../src/stores/settings';
import * as registry from '../../src/adapters/registry';

beforeEach(() => {
  useConversationStore.setState(useConversationStore.getInitialState());
  useSettingsStore.setState(useSettingsStore.getInitialState());
  localStorage.clear();
});

describe('useChat', () => {
  it('sends a message and streams response', async () => {
    const mockChat = async function* () {
      yield 'Hello';
      yield ' there';
    };
    vi.spyOn(registry, 'getAdapter').mockReturnValue({
      id: 'openai',
      name: 'OpenAI',
      models: [{ id: 'gpt-4o', name: 'GPT-4o' }],
      validateKey: vi.fn(),
      chat: mockChat,
    });

    useSettingsStore.getState().setApiKey('deepseek', 'sk-test');

    const convId = useConversationStore.getState().createConversation('single', ['socrates']);
    const { result } = renderHook(() => useChat(convId));

    await act(async () => {
      await result.current.sendMessage(convId, 'What is truth?');
    });

    const conv = useConversationStore.getState().getConversation(convId)!;
    expect(conv.messages).toHaveLength(2);
    expect(conv.messages[0].role).toBe('user');
    expect(conv.messages[0].content).toBe('What is truth?');
    expect(conv.messages[1].role).toBe('character');
    expect(conv.messages[1].content).toBe('Hello there');
    expect(conv.messages[1].characterId).toBe('socrates');
  });

  it('regenerate appends a new character message without adding a user message', async () => {
    const mockChat = async function* () {
      yield 'Regenerated answer';
    };
    vi.spyOn(registry, 'getAdapter').mockReturnValue({
      id: 'openai',
      name: 'OpenAI',
      models: [{ id: 'gpt-4o', name: 'GPT-4o' }],
      validateKey: vi.fn(),
      chat: mockChat,
    });

    useSettingsStore.getState().setApiKey('deepseek', 'sk-test');

    const convId = useConversationStore.getState().createConversation('single', ['socrates']);

    // Pre-populate a user message and a character message
    useConversationStore.getState().addMessage(convId, 'user', 'What is virtue?', undefined);
    useConversationStore.getState().addMessage(convId, 'character', 'Original answer', 'socrates');

    const { result } = renderHook(() => useChat(convId));

    await act(async () => {
      await result.current.regenerate(convId);
    });

    const conv = useConversationStore.getState().getConversation(convId)!;
    // Should have 3 messages: original user, original character, regenerated character
    expect(conv.messages).toHaveLength(3);
    expect(conv.messages[0].role).toBe('user');
    expect(conv.messages[1].role).toBe('character');
    expect(conv.messages[1].content).toBe('Original answer');
    expect(conv.messages[2].role).toBe('character');
    expect(conv.messages[2].content).toBe('Regenerated answer');
    expect(conv.messages[2].characterId).toBe('socrates');
  });
});
