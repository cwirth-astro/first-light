import { useCallback, useEffect, useRef, useState } from "react";
import { extensionStorage, onStorageChange } from "../lib/storage";

type Update<T> = T | ((prev: T) => T);

// useState that persists. Extension storage (src/lib/storage.ts) is the source
// of truth; localStorage keeps a synchronous copy so a new tab renders saved
// state on the first frame instead of after an async read. Stays in sync
// across open tabs, so an old new-tab page can't overwrite changes made in a
// newer one.
export function useStoredState<T>(
  key: string,
  initial: T,
  normalize: (stored: unknown) => T = (v) => v as T,
): [T, (update: Update<T>) => void] {
  const [value, setValue] = useState<T>(() => readMirror(key, initial, normalize));
  // Set once this tab writes, so a slower initial read can't undo the change.
  const written = useRef(false);

  useEffect(() => {
    const area = extensionStorage();
    const apply = (stored: unknown) => {
      const next = stored === undefined ? initial : normalize(stored);
      writeMirror(key, next);
      setValue(next);
    };

    if (!area) {
      const onStorage = (e: StorageEvent) => {
        if (e.key === key) setValue(readMirror(key, initial, normalize));
      };
      window.addEventListener("storage", onStorage);
      return () => window.removeEventListener("storage", onStorage);
    }

    let active = true;
    area.get(key).then(
      (items) => {
        if (!active || written.current) return;
        if (key in items) return apply(items[key]);
        // Saved by a version that only used localStorage: copy it over.
        const mirrored = readMirrorRaw(key);
        if (mirrored !== undefined) area.set({ [key]: mirrored }).catch(() => {});
      },
      () => {},
    );
    const stop = onStorageChange(key, apply);
    return () => {
      active = false;
      stop();
    };
    // initial/normalize are treated as constants for a given key.
  }, [key]);

  const update = useCallback(
    (next: Update<T>) => {
      written.current = true;
      setValue((prev) => {
        const resolved = typeof next === "function" ? (next as (p: T) => T)(prev) : next;
        writeMirror(key, resolved);
        extensionStorage()?.set({ [key]: resolved }).catch(() => {});
        return resolved;
      });
    },
    [key],
  );

  return [value, update];
}

function readMirrorRaw(key: string): unknown {
  try {
    const raw = localStorage.getItem(key);
    return raw == null ? undefined : JSON.parse(raw);
  } catch {
    return undefined;
  }
}

function readMirror<T>(key: string, initial: T, normalize: (stored: unknown) => T): T {
  const stored = readMirrorRaw(key);
  return stored === undefined ? initial : normalize(stored);
}

function writeMirror(key: string, value: unknown) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Storage unavailable; extension storage or the in-memory value remains.
  }
}
