import { useEffect, useState } from "react";
import { z } from "zod";
import { Link } from "react-router-dom";
import { TrendingCoinItemSchema } from "../../schemas";
import type { TrendingCoinItem } from "../../types";

export default function TrendingCoins() {
  const [coins, setCoins] = useState<TrendingCoinItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    const controller = new AbortController();
    fetch("https://api.coingecko.com/api/v3/search/trending", {
      signal: controller.signal,
    })
      .then((r) => r.json())
      .then((json: unknown) => {
        const rawCoins = (json as Record<string, unknown>)?.coins;
        const result = z.array(TrendingCoinItemSchema).safeParse(
          Array.isArray(rawCoins) ? rawCoins.slice(0, 6) : [],
        );
        setCoins(result.success ? result.data : []);
        setLoading(false);
      })
      .catch((err: unknown) => {
        if (err instanceof Error && err.name === "AbortError") return;
        setError(true);
        setLoading(false);
      });
    return () => controller.abort();
  }, []);

  if (loading) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div
            key={i}
            className="card bg-base-100 shadow p-4 flex flex-col items-center gap-2"
          >
            <div className="skeleton h-10 w-10 rounded-full" />
            <div className="skeleton h-3 w-16 rounded" />
            <div className="skeleton h-3 w-10 rounded" />
          </div>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="alert alert-warning text-sm py-2" role="alert">
        <span>
          Unable to load trending coins. Check your connection and try again.
        </span>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
      {coins.map(({ item }, index) => {
        const pct24h = item.data?.price_change_percentage_24h?.usd;
        const up = pct24h >= 0;
        return (
          <Link
            key={item.id}
            to={`/coinDetails/${item.symbol.toUpperCase()}`}
            className="card bg-base-100 shadow hover:shadow-md transition-shadow p-4 flex flex-col items-center gap-2 text-center hover:border-primary border border-transparent"
          >
            <span className="badge badge-sm badge-ghost">#{index + 1}</span>
            <img
              src={item.small}
              alt={item.name}
              className="h-10 w-10 rounded-full"
              loading="lazy"
            />
            <div>
              <p className="font-semibold text-sm leading-tight">{item.name}</p>
              <p className="text-xs text-base-content/60 uppercase">
                {item.symbol}
              </p>
            </div>
            {pct24h !== undefined && (
              <span
                className={`text-xs font-medium ${up ? "text-success" : "text-error"}`}
              >
                {up ? "▲" : "▼"} {Math.abs(pct24h).toFixed(2)}%
              </span>
            )}
          </Link>
        );
      })}
    </div>
  );
}
