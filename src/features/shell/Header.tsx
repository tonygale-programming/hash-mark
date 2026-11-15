import { Code, Coffee, Hash, Keyboard, Moon, Sun } from 'lucide-react';
import { Button, LinkButton, Tooltip } from '../../ui';
import type { Theme } from '../theme/theme';
import { LINKS } from '../../config';

export function Header({ theme, onToggleTheme }: { theme: Theme; onToggleTheme: () => void }) {
  const themeLabel = theme === 'dark' ? 'Switch to light theme' : 'Switch to dark theme';
  return (
    <header className="header">
      {/* Brand, as in Curly Brace: the symbol drawn as a Lucide icon in the line style, then the name */}
      <div className="brand">
        <a className="brand-mark" href={import.meta.env.BASE_URL} aria-label="Hash Mark home">
          <Hash className="brand-symbol" aria-hidden="true" focusable="false" strokeWidth={2.25} />
          <span aria-hidden="true">Hash Mark</span>
        </a>
        <p className="brand-tagline">Markdown, made readable.</p>
      </div>
      <nav className="header__links" aria-label="App">
        <Button variant="ghost" icon={Keyboard} collapseLabel>
          Shortcuts
        </Button>
        <LinkButton variant="ghost" icon={Code} collapseLabel href={LINKS.github}>
          GitHub
        </LinkButton>
        <LinkButton variant="ghost" icon={Coffee} collapseLabel href={LINKS.buyMeACoffee}>
          Buy Me a Coffee
        </LinkButton>
        <Tooltip label={themeLabel} align="end" describe={false}>
          <Button
            variant="ghost"
            icon={theme === 'dark' ? Sun : Moon}
            aria-label={themeLabel}
            onClick={onToggleTheme}
          />
        </Tooltip>
      </nav>
    </header>
  );
}
