import { useEffect, useState } from "react";
import { z } from "zod";
import { getErrorMessage } from "../lib/getErrorMessage";
import { HistoricalDataPointSchema } from "../schemas";
import type { HistoricalDataPoint } from "../types";

// vite-env.d.ts types this as string — no `as string` cast needed
const API_KEY = import.meta.env.VITE_APP_API_KEY;

export type Timeframe = "1D" | "1W" | "1M" | "3M" | "1Y";

type CryptoCompareEndpoint = "histohour" | "histoday";

const TIMEFRAME_CONFIG: Record<
  Timeframe,
  { endpoint: CryptoCompareEndpoint; limit: number }
> = {
  "1D": { endpoint: "histohour", limit: 24 },
  "1W": { endpoint: "histohour", limit: 168 },
  "1M": { endpoint: "histoday", limit: 30 },
  "3M": { endpoint: "histoday", limit: 90 },
  "1Y": { endpoint: "histoday", limit: 365 },
};

export interface UseCoinHistoryResult {
  data: HistoricalDataPoint[] | null;
  loading: boolean;
  error: string | null;
}

export function useCoinHistory(
  symbol: string,
  market: string,
  timeframe: Timeframe = "1M",
): UseCoinHistoryResult {
  const [data, setData] = useState<HistoricalDataPoint[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!symbol || !market) return;
    const controller = new AbortController();
    const { endpoint, limit } = TIMEFRAME_CONFIG[timeframe];

    // Set loading synchronously before the async boundary to avoid flash
    setLoading(true);
    setError(null);

    async function fetchHistory(): Promise<void> {
      try {
        const res = await fetch(
          `https://min-api.cryptocompare.com/data/v2/${endpoint}?fsym=${symbol}&tsym=USD&e=${market}&limit=${limit}&api_key=${API_KEY}`,
          { signal: controller.signal },
        );
        if (!res.ok) throw new Error(`HTTP ${res.status}`);

        const json: unknown = await res.json();

        if (typeof json !== "object" || json === null) {
          throw new Error("Unexpected API response shape from CryptoCompare");
        }
        const outerData = (json as Record<string, unknown>)["Data"];
        if (typeof outerData !== "object" || outerData === null) {
          throw new Error("Unexpected API response shape from CryptoCompare");
        }
        const innerData = (outerData as Record<string, unknown>)["Data"];

        const parseResult = z.array(HistoricalDataPointSchema).safeParse(innerData);
        if (!parseResult.success) {
          throw new Error("Unexpected data point shape from CryptoCompare");
        }

        if (!controller.signal.aborted) {
          setData(parseResult.data);
        }
      } catch (err) {
        if (!controller.signal.aborted) {
          setError(getErrorMessage(err));
        }
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }

    void fetchHistory();
    return () => controller.abort();
  }, [symbol, market, timeframe]);

  return { data, loading, error };
}
