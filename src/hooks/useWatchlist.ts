import { useCallback, useEffect, useMemo, useState } from "react";

const STORAGE_KEY = "solis_watchlist";

function loadWatchlist(): string[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    // Validate shape — localStorage could be corrupted or from an old app version
    if (
      Array.isArray(parsed) &&
      parsed.every((item): item is string => typeof item === "string")
    ) {
      return parsed;
    }
    return [];
  } catch {
    return [];
  }
}

function saveWatchlist(list: string[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
}

export interface UseWatchlistResult {
  watchlist: string[];
  addToWatchlist: (id: string) => void;
  removeFromWatchlist: (id: string) => void;
  toggleWatchlist: (id: string) => void;
  isWatched: (id: string) => boolean;
}

export function useWatchlist(): UseWatchlistResult {
  const [watchlist, setWatchlist] = useState<string[]>(loadWatchlist);

  // Persist on every change — the write is idempotent so no need to skip the
  // first render. The previous isFirstRender ref guard was broken under
  // React StrictMode (effects run twice, flipping the ref prematurely).
  useEffect(() => {
    saveWatchlist(watchlist);
  }, [watchlist]);

  const addToWatchlist = useCallback((id: string) => {
    setWatchlist((prev) => (prev.includes(id) ? prev : [...prev, id]));
  }, []);

  const removeFromWatchlist = useCallback((id: string) => {
    setWatchlist((prev) => prev.filter((item) => item !== id));
  }, []);

  const toggleWatchlist = useCallback((id: string) => {
    setWatchlist((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id],
    );
  }, []);

  // Derive a Set for O(1) lookups instead of O(n) Array.includes
  const watchlistSet = useMemo(() => new Set(watchlist), [watchlist]);

  const isWatched = useCallback(
    (id: string) => watchlistSet.has(id),
    [watchlistSet],
  );

  return {
    watchlist,
    addToWatchlist,
    removeFromWatchlist,
    toggleWatchlist,
    isWatched,
  };
}
