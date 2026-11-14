import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { App } from './App';
import { THEME_STORAGE_KEY } from './features/theme/theme';
import { NARROW_QUERY } from './lib/useMediaQuery';
import { setMediaMatches } from './test/setup';

describe('App shell', () => {
  it('renders header, toolbar, sidebar, editor and status bar', () => {
    render(<App />);
    expect(screen.getByRole('banner')).toHaveTextContent('Hash Mark');
    expect(screen.getByRole('button', { name: 'New note' })).toBeInTheDocument();
    expect(screen.getByRole('radiogroup', { name: 'Mode' })).toBeInTheDocument();
    expect(screen.getByRole('complementary', { name: 'Notes' })).toBeInTheDocument();
    expect(screen.getByRole('main', { name: 'Document' })).toBeInTheDocument();
    expect(screen.getByRole('status')).toHaveTextContent('Saved');
  });

  it('starts in Write mode and switches modes', async () => {
    render(<App />);
    expect(screen.getByRole('radio', { name: 'Write' })).toBeChecked();
    await userEvent.click(screen.getByRole('radio', { name: 'Read' }));
    expect(screen.getByRole('main')).toHaveAttribute('data-mode', 'read');
  });

  it('selects and filters notes', async () => {
    render(<App />);
    const sidebar = screen.getByRole('complementary', { name: 'Notes' });
    await userEvent.click(within(sidebar).getByRole('button', { name: /Project README/ }));
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Project README');
    expect(within(sidebar).getByRole('button', { name: /Project README/ })).toHaveAttribute(
      'aria-current',
      'true',
    );

    await userEvent.type(within(sidebar).getByRole('searchbox', { name: 'Search notes' }), 'zzz');
    expect(within(sidebar).getByText(/No notes match/)).toBeInTheDocument();
  });

  it('follows the system theme and saves an explicit choice', async () => {
    setMediaMatches(['(prefers-color-scheme: dark)']);
    render(<App />);
    expect(document.documentElement.dataset.theme).toBe('dark');

    await userEvent.click(screen.getByRole('button', { name: 'Switch to light theme' }));
    expect(document.documentElement.dataset.theme).toBe('light');
    expect(localStorage.getItem(THEME_STORAGE_KEY)).toBe('light');
  });

  it('uses a saved theme over the system preference', () => {
    localStorage.setItem(THEME_STORAGE_KEY, 'dark');
    render(<App />);
    expect(document.documentElement.dataset.theme).toBe('dark');
  });

  describe('under 1000px', () => {
    beforeEach(() => setMediaMatches([NARROW_QUERY]));

    it('hides Split and collapses the sidebar into a drawer', async () => {
      render(<App />);
      expect(screen.queryByRole('radio', { name: 'Split' })).not.toBeInTheDocument();
      expect(screen.queryByRole('complementary', { name: 'Notes' })).not.toBeInTheDocument();

      const notesButton = screen.getByRole('button', { name: 'Notes' });
      await userEvent.click(notesButton);
      expect(notesButton).toHaveAttribute('aria-expanded', 'true');
      const drawer = screen.getByRole('complementary', { name: 'Notes' });
      expect(within(drawer).getByRole('searchbox')).toHaveFocus();

      await userEvent.keyboard('{Escape}');
      expect(screen.queryByRole('complementary', { name: 'Notes' })).not.toBeInTheDocument();
      expect(notesButton).toHaveFocus();
    });
  });
});
