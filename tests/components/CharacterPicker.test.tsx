import { render, screen, fireEvent } from '@testing-library/react';
import { App as AntApp } from 'antd';
import { CharacterPicker } from '../../src/components/CharacterPicker';
import i18n from '../../src/i18n';

beforeEach(async () => {
  localStorage.clear();
  await i18n.changeLanguage('en');
});

function renderPicker(onSelect = vi.fn(), onClose = vi.fn()) {
  render(
    <AntApp>
      <CharacterPicker onSelect={onSelect} onClose={onClose} />
    </AntApp>,
  );
  return { onSelect, onClose };
}

describe('CharacterPicker', () => {
  it('offers every candidate as a real button, not a div with a click handler', () => {
    renderPicker();
    // A div with onClick is unreachable by keyboard and unannounced by screen
    // readers — the picker is the only way to seat a panelist mid-roundtable.
    const socrates = screen.getByRole('button', { name: /socrates/i });
    expect(socrates.tagName).toBe('BUTTON');
    expect(socrates).toHaveProperty('tabIndex', 0);
  });

  it('selects a candidate on click and closes', () => {
    const { onSelect, onClose } = renderPicker();
    fireEvent.click(screen.getByRole('button', { name: /socrates/i }));
    expect(onSelect).toHaveBeenCalledTimes(1);
    expect(onSelect.mock.calls[0][0].id).toBe('socrates');
    expect(onClose).toHaveBeenCalled();
  });

  it('hides characters that are already at the table', () => {
    render(
      <AntApp>
        <CharacterPicker onSelect={vi.fn()} onClose={vi.fn()} excludeIds={['socrates']} />
      </AntApp>,
    );
    expect(screen.queryByRole('button', { name: /socrates/i })).toBeNull();
    expect(screen.getByRole('button', { name: /confucius/i })).not.toBeNull();
  });
});
