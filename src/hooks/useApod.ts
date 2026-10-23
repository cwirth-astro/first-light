import { useEffect, useState } from "react";
import { fetchApod, type Apod } from "../api/apod";

const CACHE_KEY = "apod";
// APOD changes once a day; checking hourly picks up the new one without
// fetching the feed on every new tab.
const MAX_AGE_MS = 60 * 60 * 1000;

interface Cached {
  apod: Apod;
  fetchedAt: number;
}

function readCache(): Cached | null {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    return raw ? (JSON.parse(raw) as Cached) : null;
  } catch {
    return null;
  }
}

function writeCache(apod: Apod) {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify({ apod, fetchedAt: Date.now() }));
  } catch {
    // Storage unavailable; the page still works without the cache.
  }
}

export function useApod(): Apod | null {
  const [cached] = useState(readCache);
  const [apod, setApod] = useState<Apod | null>(cached?.apod ?? null);

  useEffect(() => {
    if (cached && Date.now() - cached.fetchedAt < MAX_AGE_MS) return;
    fetchApod()
      .then((fresh) => {
        writeCache(fresh);
        setApod(fresh);
      })
      // Keep the cached picture (or the starfield) if the feed is unreachable.
      .catch(() => {});
  }, [cached]);

  return apod;
}
