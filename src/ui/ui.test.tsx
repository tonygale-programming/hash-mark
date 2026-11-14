import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useState } from 'react';
import { Plus } from 'lucide-react';
import { Button, Chip, LinkButton, SegmentedControl, Shortcut, Toggle, Tooltip } from '.';

describe('Button', () => {
  it('renders a typed button with a label and decorative icon', () => {
    render(<Button icon={Plus}>New note</Button>);
    const button = screen.getByRole('button', { name: 'New note' });
    expect(button).toHaveAttribute('type', 'button');
    expect(button.querySelector('svg')).toHaveAttribute('aria-hidden', 'true');
  });

  it('opens external links safely', () => {
    render(<LinkButton href="https://example.com/">Site</LinkButton>);
    const link = screen.getByRole('link', { name: 'Site' });
    expect(link).toHaveAttribute('target', '_blank');
    expect(link).toHaveAttribute('rel', 'noopener noreferrer');
  });
});

describe('SegmentedControl', () => {
  const options = [
    { value: 'write', label: 'Write' },
    { value: 'split', label: 'Split' },
    { value: 'read', label: 'Read' },
  ] as const;

  function Harness() {
    const [value, setValue] = useState<'write' | 'split' | 'read'>('write');
    return <SegmentedControl label="Mode" options={options} value={value} onChange={setValue} />;
  }

  it('exposes radio semantics with one tab stop', () => {
    render(<Harness />);
    expect(screen.getByRole('radiogroup', { name: 'Mode' })).toBeInTheDocument();
    expect(screen.getByRole('radio', { name: 'Write' })).toBeChecked();
    expect(screen.getByRole('radio', { name: 'Split' })).toHaveAttribute('tabindex', '-1');
  });

  it('selects on click', async () => {
    render(<Harness />);
    await userEvent.click(screen.getByRole('radio', { name: 'Read' }));
    expect(screen.getByRole('radio', { name: 'Read' })).toBeChecked();
    expect(screen.getByRole('radio', { name: 'Write' })).not.toBeChecked();
  });

  it('moves and selects with arrow keys, wrapping around', async () => {
    render(<Harness />);
    await userEvent.tab();
    expect(screen.getByRole('radio', { name: 'Write' })).toHaveFocus();
    await userEvent.keyboard('{ArrowRight}');
    expect(screen.getByRole('radio', { name: 'Split' })).toBeChecked();
    expect(screen.getByRole('radio', { name: 'Split' })).toHaveFocus();
    await userEvent.keyboard('{ArrowLeft}{ArrowLeft}');
    expect(screen.getByRole('radio', { name: 'Read' })).toBeChecked();
    await userEvent.keyboard('{Home}');
    expect(screen.getByRole('radio', { name: 'Write' })).toBeChecked();
  });
});

describe('Toggle', () => {
  it('reports pressed state', async () => {
    function Harness() {
      const [on, setOn] = useState(false);
      return (
        <Toggle glyph="#" pressed={on} onPressedChange={setOn}>
          Show syntax
        </Toggle>
      );
    }
    render(<Harness />);
    const toggle = screen.getByRole('button', { name: 'Show syntax' });
    expect(toggle).toHaveAttribute('aria-pressed', 'false');
    await userEvent.click(toggle);
    expect(toggle).toHaveAttribute('aria-pressed', 'true');
  });
});

describe('Chip', () => {
  it('renders text with a decorative dot', () => {
    const { container } = render(
      <Chip tone="success" dot>
        Saved
      </Chip>,
    );
    expect(screen.getByText('Saved')).toBeInTheDocument();
    expect(container.querySelector('.chip__dot')).toHaveAttribute('aria-hidden', 'true');
  });
});

describe('Shortcut', () => {
  it('renders one keycap per key', () => {
    const { container } = render(<Shortcut shortcut="Mod+Shift+M" />);
    expect(container.querySelectorAll('kbd')).toHaveLength(3);
  });
});

describe('Tooltip', () => {
  it('describes the control and shows on keyboard focus', async () => {
    render(
      <Tooltip label="Show all Markdown markers" shortcut="Mod+/">
        <button type="button">Show syntax</button>
      </Tooltip>,
    );
    const tooltip = screen.getByRole('tooltip', { hidden: true });
    const button = screen.getByRole('button', { name: 'Show syntax' });
    expect(button).toHaveAttribute('aria-describedby', tooltip.id);
    expect(tooltip).not.toBeVisible();

    await userEvent.tab();
    expect(await screen.findByRole('tooltip')).toBeVisible();

    await userEvent.keyboard('{Escape}');
    expect(tooltip).not.toBeVisible();
  });

  it('does not duplicate the name of icon-only controls', () => {
    render(
      <Tooltip label="Switch to dark theme" describe={false}>
        <button type="button" aria-label="Switch to dark theme" />
      </Tooltip>,
    );
    expect(screen.getByRole('button')).not.toHaveAttribute('aria-describedby');
  });
});
