import { useEffect, useMemo, useState } from "react";
import { z } from "zod";
import { getErrorMessage } from "../lib/getErrorMessage";
import { TopCoinSchema } from "../schemas";
import type { TopCoin } from "../types";

const COINGECKO = "https://api.coingecko.com/api/v3";

const CATEGORY_IDS = {
  all: "",
  defi: "decentralized-finance-defi",
  "layer-1": "layer-1",
  "layer-2": "layer-2",
  stablecoins: "stablecoins",
  meme: "meme-token",
} as const;

/** Union of valid category keys — use this type for category props/params. */
export type CoinCategory = keyof typeof CATEGORY_IDS;

export interface UseTopCoinsResult {
  data: TopCoin[];
  loading: boolean;
  error: string | null;
}

export function useTopCoins(
  page = 1,
  category: CoinCategory = "all",
): UseTopCoinsResult {
  const [data, setData] = useState<TopCoin[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Build the URL outside the effect so it's stable across renders
  const url = useMemo(() => {
    const catParam = CATEGORY_IDS[category]
      ? `&category=${CATEGORY_IDS[category]}`
      : "";
    return (
      `${COINGECKO}/coins/markets?vs_currency=usd&order=market_cap_desc` +
      `&per_page=100&page=${page}&sparkline=true` +
      `&price_change_percentage=24h,7d${catParam}`
    );
  }, [page, category]);

  useEffect(() => {
    // Use a `cancelled` flag rather than a shared AbortController so that
    // setInterval callbacks (which create their own controllers) are not
    // accidentally aborted when the effect cleans up.
    let cancelled = false;

    async function fetchCoins(isBackground: boolean): Promise<void> {
      // Each request gets its own controller so they can be aborted independently
      const controller = new AbortController();

      if (!isBackground) setLoading(true);
      setError(null);

      try {
        const res = await fetch(url, { signal: controller.signal });
        if (!res.ok) throw new Error(`CoinGecko: HTTP ${res.status}`);

        const raw: unknown = await res.json();
        const parseResult = z.array(TopCoinSchema).safeParse(raw);
        if (!parseResult.success) {
          throw new Error(
            `CoinGecko returned unexpected shape: ${parseResult.error.issues[0]?.message}`,
          );
        }

        if (!cancelled) setData(parseResult.data);
      } catch (err) {
        if (!cancelled) setError(getErrorMessage(err));
      } finally {
        if (!cancelled && !isBackground) setLoading(false);
      }
    }

    void fetchCoins(false);

    // Refresh every 60 s silently — keep existing data visible during background updates
    const interval = setInterval(() => void fetchCoins(true), 60 * 1000);

    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [url]);

  return { data, loading, error };
}
