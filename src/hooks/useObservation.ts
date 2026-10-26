import { useCallback, useEffect, useState } from "react";
import { fetchCurrent, type Observation, type Telescope } from "../api/telescopes";

const MAX_REFRESH_MS = 10 * 60 * 1000;

interface State {
  observation: Observation | null;
  error: string | null;
  loading: boolean;
}

// Bump the version when the Observation shape changes so old caches are ignored.
function cacheKey(telescope: Telescope) {
  return `observation:v2:${telescope}`;
}

function readCache(telescope: Telescope): Observation | null {
  try {
    const raw = localStorage.getItem(cacheKey(telescope));
    return raw ? (JSON.parse(raw) as Observation) : null;
  } catch {
    return null;
  }
}

function writeCache(observation: Observation) {
  try {
    localStorage.setItem(cacheKey(observation.telescope), JSON.stringify(observation));
  } catch {
    // Storage unavailable; the page still works without the cache.
  }
}

export function useObservation(telescope: Telescope): State {
  const [state, setState] = useState<State>(() => ({
    observation: readCache(telescope),
    error: null,
    loading: true,
  }));

  const load = useCallback(async () => {
    try {
      const observation = await fetchCurrent(telescope);
      writeCache(observation);
      setState({ observation, error: null, loading: false });
    } catch (e) {
      setState((s) => ({ ...s, error: (e as Error).message, loading: false }));
    }
  }, [telescope]);

  useEffect(() => {
    load();
  }, [load]);

  // Refetch when the current observation ends, and at least every 10 minutes.
  // Depends on the whole state so a new timer is scheduled after every attempt.
  useEffect(() => {
    const end = state.observation?.end;
    const untilEnd = end ? new Date(end).getTime() - Date.now() + 5000 : MAX_REFRESH_MS;
    const delay = Math.min(Math.max(untilEnd, 30_000), MAX_REFRESH_MS);
    const timer = setTimeout(load, delay);
    return () => clearTimeout(timer);
  }, [state, load]);

  return state;
}
