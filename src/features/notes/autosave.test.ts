import { Autosaver, type SaveStatus } from './autosave';

function setup(save = vi.fn(async () => {})) {
  const statuses: SaveStatus[] = [];
  const saver = new Autosaver(save, (status) => statuses.push(status), 500);
  return { saver, save, statuses, last: () => statuses.at(-1) };
}

beforeEach(() => vi.useFakeTimers());
afterEach(() => vi.useRealTimers());

describe('Autosaver', () => {
  it('debounces edits and saves the latest text once', async () => {
    const { saver, save, last } = setup();
    saver.change('a', 'H');
    saver.change('a', 'He');
    saver.change('a', 'Hey');
    expect(last()).toBe('pending');
    expect(save).not.toHaveBeenCalled();

    await vi.advanceTimersByTimeAsync(500);
    expect(save).toHaveBeenCalledTimes(1);
    expect(save).toHaveBeenCalledWith('a', 'Hey');
    expect(last()).toBe('saved');
  });

  it('restarts the delay on each edit', async () => {
    const { saver, save } = setup();
    saver.change('a', '1');
    await vi.advanceTimersByTimeAsync(400);
    saver.change('a', '12');
    await vi.advanceTimersByTimeAsync(400);
    expect(save).not.toHaveBeenCalled();
    await vi.advanceTimersByTimeAsync(100);
    expect(save).toHaveBeenCalledWith('a', '12');
  });

  it('flushes the previous note when another note is edited', async () => {
    const { saver, save } = setup();
    saver.change('a', 'first');
    saver.change('b', 'second');
    await vi.advanceTimersByTimeAsync(0);
    expect(save).toHaveBeenNthCalledWith(1, 'a', 'first');
    await vi.advanceTimersByTimeAsync(500);
    expect(save).toHaveBeenNthCalledWith(2, 'b', 'second');
  });

  it('flush saves immediately', async () => {
    const { saver, save, last } = setup();
    saver.change('a', 'now');
    await saver.flush();
    expect(save).toHaveBeenCalledWith('a', 'now');
    expect(last()).toBe('saved');
  });

  it('reports errors and retries on the next flush', async () => {
    const save = vi.fn().mockRejectedValueOnce(new Error('quota')).mockResolvedValue(undefined);
    const { saver, last } = setup(save);
    saver.change('a', 'text');
    await saver.flush();
    expect(last()).toBe('error');
    expect(saver.hasPending).toBe(true);

    await saver.flush();
    expect(save).toHaveBeenCalledTimes(2);
    expect(last()).toBe('saved');
  });

  it('cancels a pending edit for a deleted note', async () => {
    const { saver, save, last } = setup();
    saver.change('a', 'gone');
    saver.cancel('a');
    await vi.advanceTimersByTimeAsync(1000);
    expect(save).not.toHaveBeenCalled();
    expect(last()).toBe('saved');
  });
});
