import { useEffect, useRef, useState } from 'react';
import { NARROW_QUERY, useMediaQuery } from '../../lib/useMediaQuery';
import { effectiveMode, type Mode } from '../editor/mode';
import { SAMPLE_NOTES } from '../notes/sampleNotes';
import { useTheme } from '../theme/useTheme';
import { EditorPane } from './EditorPane';
import { Header } from './Header';
import { Sidebar } from './Sidebar';
import { StatusBar } from './StatusBar';
import { Toolbar } from './Toolbar';
import './shell.css';

export function AppShell() {
  const { theme, toggleTheme } = useTheme();
  const narrow = useMediaQuery(NARROW_QUERY);

  const [mode, setMode] = useState<Mode>('write');
  const [showSyntax, setShowSyntax] = useState(false);
  const [selectedId, setSelectedId] = useState(SAMPLE_NOTES[0]?.id ?? '');
  const [query, setQuery] = useState('');
  const [drawerOpen, setDrawerOpen] = useState(false);

  const drawerButtonRef = useRef<HTMLButtonElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);

  const shownMode = effectiveMode(mode, narrow);
  const note = SAMPLE_NOTES.find((n) => n.id === selectedId);
  const drawer = narrow;
  const drawerVisible = drawer && drawerOpen;

  // Drawer: focus search on open, close on Esc and return focus to the Notes button.
  useEffect(() => {
    if (!drawerVisible) return;
    searchRef.current?.focus();
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setDrawerOpen(false);
        drawerButtonRef.current?.focus();
      }
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [drawerVisible]);

  function closeDrawer() {
    setDrawerOpen(false);
    drawerButtonRef.current?.focus();
  }

  return (
    <div className="app">
      <Header theme={theme} onToggleTheme={toggleTheme} />
      <Toolbar
        mode={shownMode}
        onModeChange={setMode}
        showSyntax={showSyntax}
        onShowSyntaxChange={setShowSyntax}
        narrow={narrow}
        drawerOpen={drawerVisible}
        onOpenDrawer={() => setDrawerOpen(true)}
        drawerButtonRef={drawerButtonRef}
      />
      <div className="main">
        <Sidebar
          notes={SAMPLE_NOTES}
          selectedId={selectedId}
          onSelect={(id) => {
            setSelectedId(id);
            if (drawer) closeDrawer();
          }}
          query={query}
          onQueryChange={setQuery}
          drawer={drawer}
          open={drawerOpen}
          onClose={closeDrawer}
          searchRef={searchRef}
        />
        {drawerVisible && <div className="scrim" aria-hidden="true" onClick={closeDrawer} />}
        <EditorPane mode={shownMode} note={note} />
      </div>
      <StatusBar stats={note?.stats} />
    </div>
  );
}
