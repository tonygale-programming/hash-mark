// Minimal Node typing for config files, so @types/node is not needed.
declare const process: { env: Record<string, string | undefined> };
// Used by Playwright tests for in-memory files.
declare const Buffer: { from(data: string, encoding?: string): Uint8Array };
