import { availableModes, effectiveMode } from './mode';

describe('mode', () => {
  it('keeps the chosen mode on wide screens', () => {
    expect(effectiveMode('split', false)).toBe('split');
    expect(effectiveMode('read', false)).toBe('read');
  });

  it('falls back from Split to Write on narrow screens', () => {
    expect(effectiveMode('split', true)).toBe('write');
    expect(effectiveMode('read', true)).toBe('read');
  });

  it('hides Split on narrow screens', () => {
    expect(availableModes(true).map((option) => option.value)).toEqual(['write', 'read']);
    expect(availableModes(false).map((option) => option.value)).toEqual(['write', 'split', 'read']);
  });
});
