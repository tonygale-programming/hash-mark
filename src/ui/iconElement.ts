import type { LucideIcon } from 'lucide-react';
import { createElement } from 'react';
import { flushSync } from 'react-dom';
import { createRoot } from 'react-dom/client';
import { Icon } from './Icon';

const cache = new Map<LucideIcon, Element>();

/**
 * A Lucide icon as a plain DOM element, in the same style as <Icon>, for UI that CodeMirror draws
 * itself (the slash menu). Each icon is rendered once and cloned after that.
 */
export function iconElement(icon: LucideIcon): Element {
  let svg = cache.get(icon);
  if (!svg) {
    const host = document.createElement('div');
    const root = createRoot(host);
    flushSync(() => root.render(createElement(Icon, { icon })));
    svg = host.firstElementChild!.cloneNode(true) as Element;
    root.unmount();
    cache.set(icon, svg);
  }
  return svg.cloneNode(true) as Element;
}
