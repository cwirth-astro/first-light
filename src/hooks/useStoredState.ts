import { useCallback, useEffect, useState } from "react";

type Update<T> = T | ((prev: T) => T);

// useState backed by localStorage. Stays in sync across open tabs, so an old
// new-tab page can't overwrite changes made in a newer one.
export function useStoredState<T>(
  key: string,
  initial: T,
  normalize: (stored: unknown) => T = (v) => v as T,
): [T, (update: Update<T>) => void] {
  const [value, setValue] = useState<T>(() => read(key, initial, normalize));

  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key === key) setValue(read(key, initial, normalize));
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
    // initial/normalize are treated as constants for a given key.
  }, [key]);

  const update = useCallback(
    (next: Update<T>) => {
      setValue((prev) => {
        const resolved = typeof next === "function" ? (next as (p: T) => T)(prev) : next;
        try {
          localStorage.setItem(key, JSON.stringify(resolved));
        } catch {
          // Storage unavailable; keep the in-memory value.
        }
        return resolved;
      });
    },
    [key],
  );

  return [value, update];
}

function read<T>(key: string, initial: T, normalize: (stored: unknown) => T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw == null ? initial : normalize(JSON.parse(raw));
  } catch {
    return initial;
  }
}
