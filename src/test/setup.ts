import '@testing-library/jest-dom/vitest';
import 'fake-indexeddb/auto';
import { cleanup, configure } from '@testing-library/react';
import { afterEach, vi } from 'vitest';

// jsdom has no modal dialogs; enough of the API for our ConfirmDialog.
HTMLDialogElement.prototype.showModal ??= function (this: HTMLDialogElement) {
  this.setAttribute('open', '');
};
HTMLDialogElement.prototype.close ??= function (this: HTMLDialogElement) {
  if (!this.hasAttribute('open')) return;
  this.removeAttribute('open');
  this.dispatchEvent(new Event('close'));
};

// Autosave waits 500 ms and then writes to IndexedDB; on a busy machine the default 1 s for
// findBy/waitFor is too tight. Passing tests still finish as soon as their condition holds.
configure({ asyncUtilTimeout: 3000 });

// jsdom does no layout: CodeMirror measures text with Range rects when it scrolls the cursor into view.
const emptyRect = {
  x: 0,
  y: 0,
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
  width: 0,
  height: 0,
  toJSON() {},
};
Range.prototype.getClientRects ??= function () {
  return Object.assign([], { item: () => null }) as unknown as DOMRectList;
};
Range.prototype.getBoundingClientRect ??= function () {
  return emptyRect as DOMRect;
};

/** jsdom has no matchMedia; tests can override `matches` per query via setMediaMatches. */
let matching = new Set<string>();

export function setMediaMatches(queries: string[]) {
  matching = new Set(queries);
}

Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn((query: string) => ({
    matches: matching.has(query),
    media: query,
    onchange: null,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    addListener: vi.fn(),
    removeListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});

afterEach(() => {
  cleanup();
  matching = new Set();
  localStorage.clear();
  delete document.documentElement.dataset.theme;
});
