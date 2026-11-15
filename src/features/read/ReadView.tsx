import { useDeferredValue, useMemo, type MouseEvent } from 'react';
import { renderMarkdown } from './renderMarkdown';
import './ReadView.css';

/** Rendered, sanitized document. Rendering is deferred so typing in Split stays responsive. */
export function ReadView({ markdown }: { markdown: string }) {
  const deferred = useDeferredValue(markdown);
  const html = useMemo(() => renderMarkdown(deferred), [deferred]);

  // In-page links (footnotes) scroll within the document instead of changing the URL fragment,
  // which is reserved for share links.
  function onClick(event: MouseEvent<HTMLElement>) {
    const link = (event.target as Element).closest('a');
    const href = link?.getAttribute('href');
    if (!href?.startsWith('#')) return;
    event.preventDefault();
    const target = event.currentTarget.querySelector(`[id="${CSS.escape(href.slice(1))}"]`);
    target?.scrollIntoView({ block: 'start' });
    if (target instanceof HTMLElement) {
      target.tabIndex = -1;
      target.focus({ preventScroll: true });
    }
  }

  if (!markdown.trim()) {
    return (
      <div className="doc">
        <p className="doc__placeholder">Nothing to read yet</p>
      </div>
    );
  }

  return (
    <article className="doc prose" onClick={onClick} dangerouslySetInnerHTML={{ __html: html }} />
  );
}
