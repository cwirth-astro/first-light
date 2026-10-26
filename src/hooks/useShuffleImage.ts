import { useCallback, useEffect, useState } from "react";
import { fetchShufflePool, type BackgroundImage } from "../api/spaceImages";

const POOL_KEY = "shufflePool";
const LAST_KEY = "shuffleLast";
// The archives add a few images a week; refreshing the pool daily is plenty.
const MAX_AGE_MS = 24 * 60 * 60 * 1000;

interface CachedPool {
  images: BackgroundImage[];
  fetchedAt: number;
}

function readPool(): CachedPool | null {
  try {
    const raw = localStorage.getItem(POOL_KEY);
    return raw ? (JSON.parse(raw) as CachedPool) : null;
  } catch {
    return null;
  }
}

function writePool(images: BackgroundImage[]) {
  try {
    localStorage.setItem(POOL_KEY, JSON.stringify({ images, fetchedAt: Date.now() }));
  } catch {
    // Storage unavailable; the pool is refetched next time.
  }
}

function readLast(): string | null {
  try {
    return localStorage.getItem(LAST_KEY);
  } catch {
    return null;
  }
}

function writeLast(id: string) {
  try {
    localStorage.setItem(LAST_KEY, id);
  } catch {
    // Only used to avoid showing the same picture twice in a row.
  }
}

function pickRandom(images: BackgroundImage[], avoidId: string | null): string {
  const choices = images.length > 1 ? images.filter((i) => i.id !== avoidId) : images;
  return choices[Math.floor(Math.random() * choices.length)].id;
}

// A random Webb or Hubble picture for each new tab, plus `next` to reshuffle.
export function useShuffleImage(enabled: boolean) {
  const [cached] = useState(readPool);
  const [pool, setPool] = useState<BackgroundImage[]>(cached?.images ?? []);
  const [currentId, setCurrentId] = useState<string | null>(null);

  useEffect(() => {
    if (!enabled) return;
    if (cached && Date.now() - cached.fetchedAt < MAX_AGE_MS) return;
    fetchShufflePool()
      .then((images) => {
        writePool(images);
        setPool(images);
      })
      // Keep the cached pool (or the starfield) if the feeds are unreachable.
      .catch(() => {});
  }, [enabled, cached]);

  const current = pool.find((i) => i.id === currentId) ?? null;

  useEffect(() => {
    if (enabled && pool.length && !current) setCurrentId(pickRandom(pool, readLast()));
  }, [enabled, pool, current]);

  useEffect(() => {
    if (currentId) writeLast(currentId);
  }, [currentId]);

  const next = useCallback(() => {
    if (pool.length) setCurrentId(pickRandom(pool, currentId));
  }, [pool, currentId]);

  return { image: enabled ? current : null, next };
}
