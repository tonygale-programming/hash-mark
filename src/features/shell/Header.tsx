import { Code, Coffee, Keyboard, Moon, Sun } from 'lucide-react';
import { Button, LinkButton, Tooltip } from '../../ui';
import type { Theme } from '../theme/theme';
import { LINKS } from '../../config';

export function Header({ theme, onToggleTheme }: { theme: Theme; onToggleTheme: () => void }) {
  const themeLabel = theme === 'dark' ? 'Switch to light theme' : 'Switch to dark theme';
  return (
    <header className="header">
      <a className="wordmark" href="/" aria-label="Hash Mark home">
        <span aria-hidden="true">#</span>Hash Mark
      </a>
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
