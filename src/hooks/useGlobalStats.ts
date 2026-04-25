import { useEffect, useState } from "react";
import { z } from "zod";
import type { GlobalMarketData, FearGreedData } from "../types";

export interface GlobalStats {
  market: GlobalMarketData | null;
  fearGreed: FearGreedData | null;
}

export interface UseGlobalStatsResult {
  data: GlobalStats;
  loading: boolean;
  error: string | null;
}

const CoinGeckoEnvelopeSchema = z.object({
  data: z.object({
    total_market_cap: z.record(z.string(), z.number()),
    total_volume: z.record(z.string(), z.number()),
    market_cap_percentage: z.record(z.string(), z.number()),
    market_cap_change_percentage_24h_usd: z.number(),
    active_cryptocurrencies: z.number(),
  }),
});

const FgiResponseSchema = z.object({
  data: z.array(
    z.object({
      value: z.string(),
      value_classification: z.string(),
    }),
  ),
});

export function useGlobalStats(): UseGlobalStatsResult {
  const [data, setData] = useState<GlobalStats>({
    market: null,
    fearGreed: null,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function fetchAll(): Promise<void> {
      // Use Promise.allSettled so a failure in one API doesn't kill the other
      const [geckoResult, fgiResult] = await Promise.allSettled([
        fetch("https://api.coingecko.com/api/v3/global"),
        fetch("https://api.alternative.me/fng/?limit=1"),
      ]);

      if (cancelled) return;

      const errors: string[] = [];
      let market: GlobalMarketData | null = null;
      let fearGreed: FearGreedData | null = null;

      // Process CoinGecko market data
      if (geckoResult.status === "fulfilled" && geckoResult.value.ok) {
        try {
          const geckoJson: unknown = await geckoResult.value.json();
          const parsed = CoinGeckoEnvelopeSchema.safeParse(geckoJson);
          if (!parsed.success) {
            errors.push("Failed to parse market data");
          } else {
            const d = parsed.data.data;
            market = {
              total_market_cap_usd: d.total_market_cap["usd"] ?? 0,
              total_volume_usd: d.total_volume["usd"] ?? 0,
              btc_dominance: d.market_cap_percentage["btc"] ?? 0,
              eth_dominance: d.market_cap_percentage["eth"] ?? 0,
              market_cap_change_pct_24h:
                d.market_cap_change_percentage_24h_usd ?? 0,
              active_cryptocurrencies: d.active_cryptocurrencies ?? 0,
            };
          }
        } catch {
          errors.push("Failed to parse market data");
        }
      } else {
        const status =
          geckoResult.status === "fulfilled"
            ? geckoResult.value.status
            : "network error";
        errors.push(`CoinGecko API error: ${status}`);
      }

      // Process Fear & Greed data
      if (fgiResult.status === "fulfilled" && fgiResult.value.ok) {
        try {
          const fgiJson: unknown = await fgiResult.value.json();
          const parsed = FgiResponseSchema.safeParse(fgiJson);
          if (!parsed.success) {
            errors.push("Failed to parse Fear & Greed data");
          } else {
            const entry = parsed.data.data[0];
            if (entry) {
              fearGreed = {
                value: Number(entry.value),
                value_classification: entry.value_classification,
              };
            }
          }
        } catch {
          errors.push("Failed to parse Fear & Greed data");
        }
      } else {
        errors.push("Fear & Greed API unavailable");
      }

      if (!cancelled) {
        setData({ market, fearGreed });
        setLoading(false);
        const nextError =
          errors.length > 0 && !market && !fearGreed
            ? errors.join(" · ")
            : null;
        setError(nextError);
      }
    }

    void fetchAll();

    // Refresh every 5 minutes
    const interval = setInterval(() => void fetchAll(), 5 * 60 * 1000);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, []);

  return { data, loading, error };
}
