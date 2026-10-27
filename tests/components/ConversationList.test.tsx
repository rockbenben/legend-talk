import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { ConversationList } from '../../src/components/ConversationList';
import { useConversationStore } from '../../src/stores/conversations';
import i18n from '../../src/i18n';

beforeEach(async () => {
  useConversationStore.setState(useConversationStore.getInitialState());
  localStorage.clear();
  await i18n.changeLanguage('en');
});

function makeConv(id: string, title: string, updatedAt: number) {
  useConversationStore.setState((s) => ({
    conversations: [
      ...s.conversations,
      {
        id, type: 'roundtable', characters: ['socrates'], title,
        messages: [], createdAt: updatedAt, updatedAt,
      },
    ],
  }));
}

function renderList() {
  return render(
    <MemoryRouter>
      <ConversationList activeId={undefined} />
    </MemoryRouter>,
  );
}

describe('ConversationList — ordering', () => {
  it('lists conversations by last activity, not by creation', () => {
    // Created oldest-first, but the OLDEST one was used most recently. The
    // label ("just now") comes from updatedAt, so a creation-ordered list
    // shows "just now" below "2 days ago" — the labels and the order
    // contradict each other.
    makeConv('a', 'Oldest created', 1000);
    makeConv('b', 'Middle', 2000);
    makeConv('c', 'Newest created', 3000);
    // 'a' was just used again.
    useConversationStore.setState((s) => ({
      conversations: s.conversations.map((c) => (c.id === 'a' ? { ...c, updatedAt: 9999 } : c)),
    }));

    renderList();

    const titles = screen.getAllByText(/Oldest created|Middle|Newest created/).map((n) => n.textContent);
    expect(titles).toEqual(['Oldest created', 'Newest created', 'Middle']);
  });

  it('keeps the storage order untouched', () => {
    makeConv('a', 'First', 1000);
    makeConv('b', 'Second', 2000);
    renderList();
    // The store still holds them in creation order — only the VIEW sorts.
    expect(useConversationStore.getState().conversations.map((c) => c.id)).toEqual(['a', 'b']);
  });
});

describe('ConversationList — nothing to show', () => {
  it('says there are no conversations when the account is empty', () => {
    renderList();
    expect(screen.getByText(/no conversations yet/i)).not.toBeNull();
  });

  it('says the search found nothing when a search misses', async () => {
    // "No conversations yet" while 61 conversations exist reads as "my history
    // is gone". The two states need different words.
    makeConv('a', 'Philosophy', 1000);
    renderList();

    const search = screen.getByPlaceholderText(/search/i);
    fireEvent.change(search, { target: { value: 'zzz-nothing-matches' } });

    await waitFor(() => {
      expect(screen.getByText(/no matching conversations/i)).not.toBeNull();
    });
    expect(screen.queryByText(/no conversations yet/i)).toBeNull();
  });
});
