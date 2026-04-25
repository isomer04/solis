import { useEffect, useState } from "react";
import { getErrorMessage } from "../lib/getErrorMessage";
import type { CoinFullDetails } from "../types";

// vite-env.d.ts types this as string — no `as string` cast needed
const API_KEY = import.meta.env.VITE_APP_API_KEY;

export interface UseCoinDetailResult {
  data: CoinFullDetails | null;
  loading: boolean;
  error: string | null;
}

export function useCoinDetail(symbol: string): UseCoinDetailResult {
  const [data, setData] = useState<CoinFullDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!symbol) {
      setData(null);
      setError(null);
      setLoading(false);
      return;
    }
    const controller = new AbortController();

    // Set loading synchronously before the async boundary
    setLoading(true);
    setError(null);

    async function fetchDetail(): Promise<void> {
      try {
        const [priceRes, listRes] = await Promise.all([
          fetch(
            `https://min-api.cryptocompare.com/data/pricemultifull?fsyms=${symbol}&tsyms=USD&api_key=${API_KEY}`,
            { signal: controller.signal },
          ),
          fetch(
            `https://min-api.cryptocompare.com/data/all/coinlist?fsym=${symbol}&api_key=${API_KEY}`,
            { signal: controller.signal },
          ),
        ]);

        if (!priceRes.ok || !listRes.ok)
          throw new Error(
            `API request failed (price: ${priceRes.status}, list: ${listRes.status})`,
          );

        // Parse both JSON payloads in parallel — they're independent
        const [priceJson, listJson]: [
          { DISPLAY: CoinFullDetails["numbers"] },
          { Data: CoinFullDetails["textData"] },
        ] = await Promise.all([priceRes.json(), listRes.json()]);

        if (!controller.signal.aborted) {
          setData({
            numbers: priceJson.DISPLAY,
            textData: listJson.Data,
          });
        }
      } catch (err) {
        if (!controller.signal.aborted) {
          setError(getErrorMessage(err));
        }
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }

    void fetchDetail();
    return () => controller.abort();
  }, [symbol]);

  return { data, loading, error };
}
