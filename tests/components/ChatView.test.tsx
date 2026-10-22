import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { App as AntApp } from 'antd';
import { ChatView } from '../../src/components/ChatView';
import { useConversationStore } from '../../src/stores/conversations';
import { useSettingsStore } from '../../src/stores/settings';
import * as registry from '../../src/adapters/registry';
import i18n from '../../src/i18n';

// jsdom gaps (matchMedia, ResizeObserver) are filled in tests/setup.ts.

beforeEach(async () => {
  useConversationStore.setState(useConversationStore.getInitialState());
  useSettingsStore.setState(useSettingsStore.getInitialState());
  localStorage.clear();
  await i18n.changeLanguage('en');
});

/** An adapter that answers with prose instead of the requested JSON array. */
function mockAdapter(reply: string) {
  vi.spyOn(registry, 'getAdapter').mockReturnValue({
    id: 'deepseek',
    name: 'DeepSeek',
    models: [{ id: 'deepseek-flash', name: 'DeepSeek Flash' }],
    chat: async function* () { yield reply; },
  });
  useSettingsStore.getState().setApiKey('deepseek', 'sk-test');
}

function renderChat(convId: string) {
  return render(
    <MemoryRouter>
      <AntApp>
        <ChatView conversationId={convId} />
      </AntApp>
    </MemoryRouter>,
  );
}

describe('ChatView — a panel that could not be assembled', () => {
  it('does not leave the conversation spinning on “Matching…” after the user dismisses the error', async () => {
    mockAdapter('No suitable characters for this topic.');
    const convId = useConversationStore
      .getState()
      .createConversation('roundtable', [], 'Remote work and cities');

    renderChat(convId);

    // The failed summon is reported with the model's own words, so the user
    // can see the reply instead of being told their topic matched nobody.
    await waitFor(() => {
      expect(screen.getByText(/didn’t return a panel list/i)).not.toBeNull();
    });
    expect(screen.getByText(/No suitable characters for this topic\./)).not.toBeNull();

    // Dismissing the error must not leave a conversation that looks busy.
    fireEvent.click(screen.getByRole('button', { name: /later/i }));

    await waitFor(() => {
      expect(screen.queryByText(/matching/i)).toBeNull();
    });
    // …and must leave a way forward: pick the panelists by hand.
    expect(
      screen.getByRole('button', { name: /pick the panelists/i }),
    ).not.toBeNull();
    // The topic is still on record.
    expect(screen.getAllByText(/Remote work and cities/).length).toBeGreaterThan(0);
    // And the composer must not be a trap: with nobody at the table there is
    // nobody to answer, so it is disabled and says why.
    const composer = screen.getByPlaceholderText(/pick the panelists first/i) as HTMLTextAreaElement;
    expect(composer.disabled).toBe(true);
  });

  it('keeps the topic on record when no API key is configured yet', async () => {
    // No adapter mock, no key → the veil says the key is missing.
    const convId = useConversationStore
      .getState()
      .createConversation('roundtable', [], 'Remote work and cities');

    renderChat(convId);

    await waitFor(() => {
      expect(screen.getByText(/no API key yet/i)).not.toBeNull();
    });
    fireEvent.click(screen.getByRole('button', { name: /later/i }));

    await waitFor(() => {
      expect(screen.queryByText(/matching/i)).toBeNull();
    });
    expect(
      screen.getByRole('button', { name: /pick the panelists/i }),
    ).not.toBeNull();
  });

  it('says a roundtable needs two when the AI names only one', async () => {
    mockAdapter('["socrates"]');
    const convId = useConversationStore
      .getState()
      .createConversation('roundtable', [], 'Remote work and cities');

    renderChat(convId);

    await waitFor(() => {
      expect(screen.getByText(/needs at least two/i)).not.toBeNull();
    });
    // One panelist is not a panel — the conversation must not start as a
    // one-on-one chat behind the user's back.
    expect(useConversationStore.getState().getConversation(convId)!.characters).toHaveLength(0);
  });
});

describe('ChatView — one-on-one chat', () => {
  it('addresses the thinker by name instead of offering roundtable-only wording', () => {
    const convId = useConversationStore
      .getState()
      .createConversation('single', ['socrates']);
    renderChat(convId);

    const composer = screen.getByPlaceholderText(/ask socrates something/i);
    expect(composer).not.toBeNull();
    // "Steer the discussion" describes a focus card, rounds and a moderator —
    // none of which exist in a one-on-one chat.
    expect(screen.queryByPlaceholderText(/steer the discussion/i)).toBeNull();
  });
});

describe('ChatView — sharing', () => {
  it('says so when the link could not be copied', async () => {
    // The share flow tries a short link through the public relay first; keep
    // the test off the network so it falls straight through to the clipboard.
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('offline')));
    const writeText = vi.fn().mockRejectedValue(new Error('denied'));
    Object.defineProperty(navigator, 'clipboard', {
      value: { writeText },
      configurable: true,
    });
    try {
      const convId = useConversationStore
        .getState()
        .createConversation('single', ['socrates']);
      useConversationStore.getState().addMessage(convId, 'user', 'Hello', undefined);
      renderChat(convId);

      fireEvent.click(screen.getByRole('button', { name: /share chat/i }));

      await waitFor(() => {
        expect(writeText).toHaveBeenCalled();
      });
      await waitFor(() => {
        expect(screen.getByText(/copy failed/i)).not.toBeNull();
      });
    } finally {
      vi.unstubAllGlobals();
      Reflect.deleteProperty(navigator, 'clipboard');
    }
  });
});
