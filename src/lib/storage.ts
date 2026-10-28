// Extension storage for state the user creates (settings, to-dos). Browsers
// treat an extension page's localStorage like website data, so "Clear browsing
// data" and clear-on-exit settings wipe it; extension storage survives those.
// Uses the WebExtensions storage API (browser.* in Firefox and Safari, chrome.*
// in Chrome and Edge). Outside an extension, such as `npm run dev`, there is no
// API and callers fall back to localStorage alone.

interface StorageChange {
  newValue?: unknown;
}

export interface StorageArea {
  get(key: string): Promise<Record<string, unknown>>;
  set(items: Record<string, unknown>): Promise<void>;
}

interface StorageApi {
  local?: StorageArea;
  onChanged?: {
    addListener(fn: (changes: Record<string, StorageChange>, area: string) => void): void;
    removeListener(fn: (changes: Record<string, StorageChange>, area: string) => void): void;
  };
}

type ExtensionGlobal = { storage?: StorageApi } | undefined;

function storageApi(): StorageApi | null {
  const g = globalThis as { browser?: ExtensionGlobal; chrome?: ExtensionGlobal };
  const api = g.browser?.storage ?? g.chrome?.storage;
  return api?.local ? api : null;
}

export function extensionStorage(): StorageArea | null {
  return storageApi()?.local ?? null;
}

// Calls `fn` when another tab changes `key`. `undefined` means it was removed.
export function onStorageChange(key: string, fn: (value: unknown) => void): () => void {
  const events = storageApi()?.onChanged;
  if (!events) return () => {};
  const listener = (changes: Record<string, StorageChange>, area: string) => {
    if (area === "local" && key in changes) fn(changes[key].newValue);
  };
  events.addListener(listener);
  return () => events.removeListener(listener);
}
