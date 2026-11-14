// Minimal Node typing for config files, so @types/node is not needed.
declare const process: { env: Record<string, string | undefined> };
