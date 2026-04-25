import { memo, useCallback, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { LineChart, Line, ResponsiveContainer } from "recharts";
import { useTopCoins } from "../hooks/useTopCoins";
import { useWatchlist } from "../hooks/useWatchlist";
import type { TopCoin } from "../types";

// ─── Mini Sparkline ───────────────────────────────────────────────────────────
function Sparkline({ prices, up }: { prices: number[]; up: boolean }) {
  // Downsample to 20 points for performance
  const step = Math.max(1, Math.floor(prices.length / 20));
  const sampled = prices.filter((_, i) => i % step === 0);
  const chartData = sampled.map((v) => ({ v }));
  return (
    <ResponsiveContainer width={80} height={32}>
      <LineChart data={chartData}>
        <Line
          type="monotone"
          dot={false}
          dataKey="v"
          stroke={up ? "#22c55e" : "#ef4444"}
          strokeWidth={1.5}
          isAnimationActive={false}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}

// ─── Sort helpers ─────────────────────────────────────────────────────────────
type SortKey =
  | "market_cap_rank"
  | "current_price"
  | "price_change_percentage_24h"
  | "total_volume"
  | "market_cap";
type SortDir = "asc" | "desc";

function sortCoins(coins: TopCoin[], key: SortKey, dir: SortDir): TopCoin[] {
  return [...coins].sort((a, b) => {
    const va = a[key] ?? 0;
    const vb = b[key] ?? 0;
    return dir === "asc" ? va - vb : vb - va;
  });
}

function SortIcon({ active, dir }: { active: boolean; dir: SortDir }) {
  if (!active) return <span className="ml-1 opacity-30">↕</span>;
  return <span className="ml-1 text-primary">{dir === "asc" ? "↑" : "↓"}</span>;
}

function ThHeader({
  label,
  sk,
  className = "",
  sortKey,
  sortDir,
  onSort,
}: {
  label: string;
  sk: SortKey;
  className?: string;
  sortKey: SortKey;
  sortDir: SortDir;
  onSort: (key: SortKey) => void;
}) {
  return (
    <th
      className={`cursor-pointer select-none text-right hover:text-primary transition-colors ${className}`}
      onClick={() => onSort(sk)}
    >
      {label}
      <SortIcon active={sortKey === sk} dir={sortDir} />
    </th>
  );
}

// ─── Category tabs ────────────────────────────────────────────────────────────
const CATEGORIES = [
  { id: "all", label: "All" },
  { id: "defi", label: "DeFi" },
  { id: "layer-1", label: "Layer 1" },
  { id: "layer-2", label: "Layer 2" },
  { id: "stablecoins", label: "Stablecoins" },
  { id: "meme", label: "Meme" },
] as const;

type Category = (typeof CATEGORIES)[number]["id"];

// ─── Coin row ─────────────────────────────────────────────────────────────────
const CoinRow = memo(function CoinRow({
  coin,
  watchlistId,
  watched,
  onToggle,
}: {
  coin: TopCoin;
  watchlistId: string;
  watched: boolean;
  onToggle: (id: string) => void;
}) {
  const pct24h = coin.price_change_percentage_24h;
  const up = pct24h >= 0;
  const sparkline = coin.sparkline_in_7d?.price ?? [];
  const sparkUp =
    sparkline.length > 1 ? sparkline[sparkline.length - 1] >= sparkline[0] : up;

  return (
    <tr className="hover:bg-base-200/40 transition-colors">
      {/* Rank */}
      <td className="pr-2 text-base-content/40 tabular-nums text-sm">
        {coin.market_cap_rank}
      </td>

      {/* Star + coin */}
      <td className="py-2">
        <div className="flex items-center gap-2">
          <button
            onClick={() => onToggle(watchlistId)}
            aria-label={
              watched
                ? `Remove ${coin.name} from watchlist`
                : `Add ${coin.name} to watchlist`
            }
            className={`text-lg leading-none transition-colors ${watched ? "text-warning" : "text-base-content/20 hover:text-warning"}`}
          >
            {watched ? "★" : "☆"}
          </button>
          <Link
            to={`/coinDetails/${coin.symbol.toUpperCase()}`}
            className="flex items-center gap-2 hover:text-primary transition-colors"
          >
            <img
              src={coin.image}
              alt={coin.name}
              className="h-7 w-7 rounded-full shrink-0"
              loading="lazy"
            />
            <div>
              <p className="font-semibold text-sm leading-none">{coin.name}</p>
              <p className="text-xs text-base-content/50 uppercase leading-none mt-0.5">
                {coin.symbol}
              </p>
            </div>
          </Link>
        </div>
      </td>

      {/* Price */}
      <td className="tabular-nums text-sm text-right">
        $
        {coin.current_price < 0.01
          ? coin.current_price.toPrecision(4)
          : coin.current_price.toLocaleString(undefined, {
              maximumFractionDigits: 2,
            })}
      </td>

      {/* 24h % */}
      <td
        className={`tabular-nums text-sm text-right font-medium ${up ? "text-success" : "text-error"}`}
      >
        {up ? "▲" : "▼"} {Math.abs(pct24h).toFixed(2)}%
      </td>

      {/* Market Cap */}
      <td className="tabular-nums text-sm text-right text-base-content/70 hidden md:table-cell">
        {coin.market_cap >= 1e9
          ? `$${(coin.market_cap / 1e9).toFixed(2)}B`
          : `$${(coin.market_cap / 1e6).toFixed(2)}M`}
      </td>

      {/* Volume */}
      <td className="tabular-nums text-sm text-right text-base-content/70 hidden lg:table-cell">
        {coin.total_volume >= 1e9
          ? `$${(coin.total_volume / 1e9).toFixed(2)}B`
          : `$${(coin.total_volume / 1e6).toFixed(2)}M`}
      </td>

      {/* 7d Sparkline */}
      <td className="hidden xl:table-cell pl-2">
        {sparkline.length > 1 && <Sparkline prices={sparkline} up={sparkUp} />}
      </td>
    </tr>
  );
});

// ─── Skeleton rows ────────────────────────────────────────────────────────────
function SkeletonRows() {
  return (
    <>
      {Array.from({ length: 10 }).map((_, i) => (
        <tr key={i}>
          <td>
            <div className="skeleton h-4 w-6 rounded" />
          </td>
          <td>
            <div className="flex items-center gap-2 py-2">
              <div className="skeleton h-7 w-7 rounded-full" />
              <div className="space-y-1">
                <div className="skeleton h-3 w-20 rounded" />
                <div className="skeleton h-2 w-12 rounded" />
              </div>
            </div>
          </td>
          <td>
            <div className="skeleton h-4 w-20 rounded ml-auto" />
          </td>
          <td>
            <div className="skeleton h-4 w-14 rounded ml-auto" />
          </td>
          <td className="hidden md:table-cell">
            <div className="skeleton h-4 w-20 rounded ml-auto" />
          </td>
          <td className="hidden lg:table-cell">
            <div className="skeleton h-4 w-20 rounded ml-auto" />
          </td>
          <td className="hidden xl:table-cell">
            <div className="skeleton h-8 w-20 rounded" />
          </td>
        </tr>
      ))}
    </>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────
export default function CryptoTracker() {
  const [page, setPage] = useState(1);
  const [category, setCategory] = useState<Category>("all");
  const [search, setSearch] = useState("");
  const [tab, setTab] = useState<"market" | "watchlist">("market");
  const [sortKey, setSortKey] = useState<SortKey>("market_cap_rank");
  const [sortDir, setSortDir] = useState<SortDir>("asc");

  const { data: coins, loading, error } = useTopCoins(page, category);
  const { watchlist, toggleWatchlist, isWatched } = useWatchlist();

  const handleSort = useCallback(
    (key: SortKey) => {
      if (sortKey === key) {
        setSortDir((d) => (d === "asc" ? "desc" : "asc"));
      } else {
        setSortKey(key);
        setSortDir(key === "market_cap_rank" ? "asc" : "desc");
      }
    },
    [sortKey],
  );

  const handleCategoryChange = useCallback((id: Category) => {
    setCategory(id);
    setPage(1);
  }, []);

  const allCoins = useMemo(
    () => sortCoins(coins, sortKey, sortDir),
    [coins, sortKey, sortDir],
  );

  const displayed = useMemo(
    () =>
      allCoins.filter((c) => {
        if (tab === "watchlist" && !watchlist.includes(c.id)) return false;
        if (search) {
          const q = search.toLowerCase();
          return (
            c.name.toLowerCase().includes(q) ||
            c.symbol.toLowerCase().includes(q)
          );
        }
        return true;
      }),
    [allCoins, tab, watchlist, search],
  );

  return (
    <div className="container mx-auto max-w-7xl px-4 pt-4 pb-12">
      <title>Crypto Tracker — Solis</title>
      <h1 className="mb-4 text-3xl font-bold">Crypto Tracker</h1>

      {/* Tabs */}
      <div className="tabs tabs-bordered mb-4">
        <button
          className={`tab ${tab === "market" ? "tab-active" : ""}`}
          onClick={() => setTab("market")}
        >
          Market
        </button>
        <button
          className={`tab ${tab === "watchlist" ? "tab-active" : ""}`}
          onClick={() => setTab("watchlist")}
        >
          ★ Watchlist{watchlist.length > 0 && ` (${watchlist.length})`}
        </button>
      </div>

      {/* Category + Search */}
      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <div className="flex flex-wrap gap-1">
          {CATEGORIES.map((cat) => (
            <button
              key={cat.id}
              className={`btn btn-xs ${category === cat.id ? "btn-primary" : "btn-ghost"}`}
              onClick={() => handleCategoryChange(cat.id)}
            >
              {cat.label}
            </button>
          ))}
        </div>
        <div className="sm:ml-auto">
          <label htmlFor="coin-search" className="sr-only">
            Search cryptocurrencies
          </label>
          <input
            id="coin-search"
            type="search"
            className="input input-bordered input-sm w-full sm:w-56"
            placeholder="Search coins…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="alert alert-error mb-4" role="alert">
          <span>Failed to load: {error}</span>
        </div>
      )}

      {/* Table */}
      <div className="overflow-x-auto rounded-box bg-base-100 shadow">
        <table className="table table-sm w-full">
          <thead>
            <tr className="border-b border-base-300 text-base-content/60 text-xs">
              <th className="w-10">#</th>
              <th>Coin</th>
              <ThHeader
                label="Price"
                sk="current_price"
                sortKey={sortKey}
                sortDir={sortDir}
                onSort={handleSort}
              />
              <ThHeader
                label="24h %"
                sk="price_change_percentage_24h"
                sortKey={sortKey}
                sortDir={sortDir}
                onSort={handleSort}
              />
              <ThHeader
                label="Market Cap"
                sk="market_cap"
                className="hidden md:table-cell"
                sortKey={sortKey}
                sortDir={sortDir}
                onSort={handleSort}
              />
              <ThHeader
                label="Volume 24h"
                sk="total_volume"
                className="hidden lg:table-cell"
                sortKey={sortKey}
                sortDir={sortDir}
                onSort={handleSort}
              />
              <th className="hidden xl:table-cell">7d Chart</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-base-200">
            {loading ? (
              <SkeletonRows />
            ) : displayed.length === 0 ? (
              <tr>
                <td
                  colSpan={7}
                  className="py-16 text-center text-base-content/50"
                >
                  {tab === "watchlist"
                    ? "Your watchlist is empty. Star coins to track them here."
                    : `No coins found${search ? ` for "${search}"` : ""}.`}
                </td>
              </tr>
            ) : (
              displayed.map((coin) => (
                <CoinRow
                  key={coin.id}
                  coin={coin}
                  watchlistId={coin.id}
                  watched={isWatched(coin.id)}
                  onToggle={toggleWatchlist}
                />
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination — only in market tab */}
      {tab === "market" && !search && (
        <div className="join mt-4 flex justify-center">
          <button
            className="join-item btn btn-sm"
            disabled={page === 1}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
          >
            «
          </button>
          <button className="join-item btn btn-sm btn-disabled">
            Page {page}
          </button>
          <button
            className="join-item btn btn-sm"
            disabled={coins.length < 100}
            onClick={() => setPage((p) => p + 1)}
          >
            »
          </button>
        </div>
      )}

      <p className="text-xs text-base-content/40 text-center mt-3">
        Data from CoinGecko &bull; Refreshes every 60s
      </p>
    </div>
  );
}
