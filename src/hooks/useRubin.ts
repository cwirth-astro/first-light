import { useCallback, useEffect, useState } from "react";
import { fetchRubinNight, type RubinNight } from "../api/rubin";

const CACHE_KEY = "rubin:v1";
// Rubin observes only at night in Chile; poll often while it is, rarely otherwise.
const OBSERVING_REFRESH_MS = 5 * 60 * 1000;
const IDLE_REFRESH_MS = 30 * 60 * 1000;
// A visit this recent means the telescope is observing right now.
const OBSERVING_WINDOW_MS = 20 * 60 * 1000;

interface State {
  night: RubinNight | null;
  error: string | null;
  loading: boolean;
}

function readCache(): RubinNight | null {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    return raw ? (JSON.parse(raw) as RubinNight) : null;
  } catch {
    return null;
  }
}

function writeCache(night: RubinNight | null) {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify(night));
  } catch {
    // Storage unavailable; the page still works without the cache.
  }
}

export function isObserving(night: RubinNight | null, now: number) {
  return !!night && now - new Date(night.latest.time).getTime() < OBSERVING_WINDOW_MS;
}

// Fetches only while `enabled`, so a missing permission doesn't count as an error.
export function useRubin(enabled: boolean): State {
  const [state, setState] = useState<State>(() => ({ night: readCache(), error: null, loading: true }));

  const load = useCallback(async () => {
    try {
      const night = await fetchRubinNight();
      writeCache(night);
      setState({ night, error: null, loading: false });
    } catch (e) {
      setState((s) => ({ ...s, error: (e as Error).message, loading: false }));
    }
  }, []);

  useEffect(() => {
    if (enabled) load();
  }, [load, enabled]);

  // Depends on the whole state so a new timer is scheduled after every attempt.
  useEffect(() => {
    if (!enabled) return;
    const delay = isObserving(state.night, Date.now()) ? OBSERVING_REFRESH_MS : IDLE_REFRESH_MS;
    const timer = setTimeout(load, delay);
    return () => clearTimeout(timer);
  }, [state, load, enabled]);

  return state;
}
