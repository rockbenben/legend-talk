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

describe('ChatView — a connection failure', () => {
  /** Send a message that fails the way an unreachable upstream fails. */
  async function sendAndFail(convId: string) {
    renderChat(convId);
    const composer = screen.getByPlaceholderText(/ask socrates something/i);
    fireEvent.change(composer, { target: { value: 'Hello' } });
    fireEvent.click(screen.getByRole('button', { name: /send/i }));
  }

  it('offers the relay to a provider the relay can actually serve', async () => {
    // DeepSeek on its official address: the built-in relay is on the host
    // allow-list, so "use the public proxy" is a real remedy here.
    vi.spyOn(registry, 'getAdapter').mockReturnValue({
      id: 'deepseek',
      name: 'DeepSeek',
      models: [{ id: 'deepseek-flash', name: 'DeepSeek Flash' }],
      chat: async function* () { throw new Error('Failed to fetch'); },
    });
    useSettingsStore.getState().setApiKey('deepseek', 'sk-test');

    const convId = useConversationStore
      .getState()
      .createConversation('single', ['socrates']);
    await sendAndFail(convId);

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /use public proxy/i })).not.toBeNull();
    });
  });

  it('does not offer a relay that cannot serve this provider', async () => {
    // Custom (llm) never goes through the relay — resolveProvider gates on
    // !isCustom — and Settings does not even show a relay toggle for it.
    // Pointing the user at one would be a button that changes nothing.
    // A custom endpoint's remedy is its address, so that is where the user
    // is sent instead.
    useSettingsStore.getState().setDefaultProvider('llm');
    useSettingsStore.getState().setCustomBaseUrl('http://127.0.0.1:8891/v1');
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new TypeError('Failed to fetch')));

    try {
      const convId = useConversationStore
        .getState()
        .createConversation('single', ['socrates']);
      await sendAndFail(convId);

      await waitFor(() => {
        expect(screen.getByText(/connection failed/i)).not.toBeNull();
      });
      expect(screen.queryByRole('button', { name: /use public proxy/i })).toBeNull();
      expect(screen.getByRole('button', { name: /go to settings/i })).not.toBeNull();
    } finally {
      vi.unstubAllGlobals();
    }
  });
});

describe('ChatView — a roundtable that has not started', () => {
  it('asks for the first question instead of a focus to steer', () => {
    // "Adjust the discussion focus" names something that does not exist yet:
    // the focus card only appears from the first directive onwards.
    const convId = useConversationStore
      .getState()
      .createConversation('roundtable', ['socrates', 'kant'], 'Philosophy');
    renderChat(convId);

    expect(screen.getByPlaceholderText(/ask your first question/i)).not.toBeNull();
  });

  it('names a template roundtable after the topic it actually discusses', async () => {
    // The template name ("Philosophy") is the title a template roundtable is
    // born with, so two roundtables from the same template look identical in
    // the sidebar. The first user message IS the topic — it takes over.
    mockAdapter('OK');
    const convId = useConversationStore
      .getState()
      .createConversation('roundtable', ['socrates', 'kant'], 'Philosophy Debate', 'philosophy-debate');
    renderChat(convId);

    const composer = screen.getByPlaceholderText(/ask your first question/i);
    fireEvent.change(composer, { target: { value: 'Does free will exist?' } });
    fireEvent.click(screen.getByRole('button', { name: /send/i }));

    await waitFor(() => {
      expect(useConversationStore.getState().getConversation(convId)!.title).toBe('Does free will exist?');
    });
  });

  it('still takes the title over after the interface language changed', async () => {
    // The conversation was created while the UI was Chinese, so its title is
    // the Chinese template name; the interface is now English. Comparing the
    // title against the CURRENT language's template name silently disabled the
    // hand-over — the title is compared against the one stored at creation.
    mockAdapter('OK');
    const convId = useConversationStore
      .getState()
      .createConversation('roundtable', ['socrates', 'kant'], '哲学辩论', 'philosophy-debate');
    renderChat(convId);

    const composer = screen.getByPlaceholderText(/ask your first question/i);
    fireEvent.change(composer, { target: { value: 'Does free will exist?' } });
    fireEvent.click(screen.getByRole('button', { name: /send/i }));

    await waitFor(() => {
      expect(useConversationStore.getState().getConversation(convId)!.title).toBe('Does free will exist?');
    });
  });

  it('leaves a title the user set by hand alone', async () => {
    // The first message must not overwrite a name the user chose themselves.
    mockAdapter('OK');
    const convId = useConversationStore
      .getState()
      .createConversation('roundtable', ['socrates', 'kant'], 'Philosophy', 'philosophy-debate');
    useConversationStore.getState().renameConversation(convId, 'My own name');
    renderChat(convId);

    const composer = screen.getByPlaceholderText(/ask your first question/i);
    fireEvent.change(composer, { target: { value: 'Does free will exist?' } });
    fireEvent.click(screen.getByRole('button', { name: /send/i }));

    await waitFor(() => {
      expect(useConversationStore.getState().getConversation(convId)!.messages.length).toBeGreaterThan(0);
    });
    expect(useConversationStore.getState().getConversation(convId)!.title).toBe('My own name');
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
