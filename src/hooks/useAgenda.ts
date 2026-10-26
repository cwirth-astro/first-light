import { useCallback, useEffect, useState } from "react";
import { fetchAgenda, type AgendaEvent } from "../api/calendar";

const CACHE_KEY = "agenda:v1";
const REFRESH_MS = 15 * 60 * 1000;

interface Cached {
  // Which feeds and day the events belong to; anything else is stale.
  key: string;
  events: AgendaEvent[];
}

interface State {
  events: AgendaEvent[] | null;
  error: string | null;
}

const cacheKeyFor = (feeds: string[], day: string) => `${day}|${feeds.join(" ")}`;

function readCache(key: string): AgendaEvent[] | null {
  try {
    const cached = JSON.parse(localStorage.getItem(CACHE_KEY) ?? "null") as Cached | null;
    return cached?.key === key ? cached.events : null;
  } catch {
    return null;
  }
}

function writeCache(key: string, events: AgendaEvent[]) {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify({ key, events } satisfies Cached));
  } catch {
    // Storage unavailable; the page still works without the cache.
  }
}

// Pass enabled=false until the extension has permission to read the feeds.
export function useAgenda(feeds: string[], now: number, enabled: boolean): State {
  const day = new Date(now).toDateString();
  const key = cacheKeyFor(feeds, day);
  const [state, setState] = useState<State & { key: string }>(() => ({ key, events: readCache(key), error: null }));

  // Feeds or the date changed: show what's cached for the new key, then refetch.
  if (state.key !== key) setState({ key, events: readCache(key), error: null });

  const load = useCallback(async () => {
    if (feeds.length === 0 || !enabled) return;
    try {
      const events = await fetchAgenda(feeds, new Date(day));
      writeCache(key, events);
      setState({ key, events, error: null });
    } catch (e) {
      setState((s) => ({ ...s, error: (e as Error).message }));
    }
    // feeds is read through key, which changes whenever feeds do.
  }, [key, enabled]);

  useEffect(() => {
    load();
    const timer = setInterval(load, REFRESH_MS);
    return () => clearInterval(timer);
  }, [load]);

  return state;
}
