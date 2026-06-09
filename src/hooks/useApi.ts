import { useCallback, useState } from 'react';

// A tiny data-fetching hook: it wraps an async function and tracks the states
// every screen needs (data / loading / error / when it last succeeded), plus a
// `reload` to re-run it. Each section gets its OWN useApi instance, which is how
// we get independent loading/error states per section.
//
// It does NOT auto-run on mount — the caller decides when (we trigger `reload`
// from useFocusEffect so the data refreshes every time the tab is focused).
//
// Note on the AI endpoints: they return HTTP 200 even when Claude is degraded
// (with a fallback sentence), so `data` holds that text and `error` only trips
// on a real network/HTTP failure — exactly the behavior the Insights screen wants.
export interface UseApiResult<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
  lastUpdated: number | null; // Date.now() of the last successful fetch (the API sends none)
  reload: () => Promise<void>;
}

export function useApi<T>(fetcher: () => Promise<T>): UseApiResult<T> {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<number | null>(null);

  const reload = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setData(await fetcher());
      setLastUpdated(Date.now());
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Something went wrong');
    } finally {
      setLoading(false);
    }
  }, [fetcher]);

  return { data, loading, error, lastUpdated, reload };
}
