import { readFileSync, statSync, writeFileSync } from "node:fs";

export const readCache = (path: string, ttlMs?: number): string | null => {
  try {
    if (ttlMs !== undefined) {
      const { mtimeMs } = statSync(path);
      if (Date.now() - mtimeMs > ttlMs) return null;
    }
    const value = readFileSync(path, "utf-8").trim();
    return value || null;
  } catch {
    return null;
  }
};

export const writeCache = (path: string, value: string): void => {
  try {
    writeFileSync(path, value);
  } catch {
    // non-fatal — caching is best-effort
  }
};
