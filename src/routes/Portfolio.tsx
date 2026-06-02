import { useEffect, useMemo, useState } from "react";
import { z } from "zod";
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { PortfolioEntrySchema } from "../schemas";
import type { PortfolioEntry } from "../types";

const STORAGE_KEY = "solis_portfolio";
const CC_API_KEY = import.meta.env.VITE_APP_API_KEY;

const PIE_COLORS = [
  "#6419e6",
  "#1d9bf0",
  "#f59e0b",
  "#10b981",
  "#ef4444",
  "#8b5cf6",
  "#f97316",
  "#14b8a6",
  "#e11d48",
  "#0ea5e9",
];

function loadEntries(): PortfolioEntry[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const result = z.array(PortfolioEntrySchema).safeParse(JSON.parse(raw));
    return result.success ? result.data : [];
  } catch {
    return [];
  }
}

function fmt(n: number) {
  return n.toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

function fmtPct(n: number) {
  return `${n >= 0 ? "+" : ""}${n.toFixed(2)}%`;
}

export default function Portfolio() {
  const [entries, setEntries] = useState<PortfolioEntry[]>(loadEntries);
  const [prices, setPrices] = useState<Record<string, number>>({});
  const [priceLoading, setPriceLoading] = useState(false);
  const [priceError, setPriceError] = useState<string | null>(null);

  // Form state
  const [symbol, setSymbol] = useState("");
  const [name, setName] = useState("");
  const [qty, setQty] = useState("");
  const [buyPrice, setBuyPrice] = useState("");
  const [formError, setFormError] = useState("");

  // Persist to localStorage
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
  }, [entries]);

  // Derive a stable key from the unique sorted set of symbols
  const symbolsKey = useMemo(
    () =>
      [...new Set(entries.map((e) => e.symbol.toUpperCase()))].sort().join(","),
    [entries],
  );

  // Fetch live prices — only re-runs when the set of symbols changes
  useEffect(() => {
    if (!symbolsKey) {
      setPrices({});
      setPriceError(null);
      setPriceLoading(false);
      return;
    }
    const controller = new AbortController();
    setPriceLoading(true);
    setPriceError(null);
    fetch(
      `https://min-api.cryptocompare.com/data/pricemulti?fsyms=${symbolsKey}&tsyms=USD&api_key=${CC_API_KEY}`,
      { signal: controller.signal },
    )
      .then((r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.json() as Promise<Record<string, { USD?: number }>>;
      })
      .then((json) => {
        const map: Record<string, number> = {};
        for (const sym of Object.keys(json)) {
          map[sym.toUpperCase()] = json[sym]?.USD ?? 0;
        }
        if (!controller.signal.aborted) setPrices(map);
      })
      .catch((err: unknown) => {
        if (err instanceof Error && err.name === "AbortError") return;
        if (import.meta.env.DEV) {
          console.error("[Portfolio] price fetch failed:", err);
        }
        if (!controller.signal.aborted)
          setPriceError("Live prices unavailable — showing cost basis only.");
      })
      .finally(() => {
        if (!controller.signal.aborted) setPriceLoading(false);
      });
    return () => controller.abort();
  }, [symbolsKey]);

  function addEntry(e: React.SyntheticEvent<HTMLFormElement, SubmitEvent>) {
    e.preventDefault();
    setFormError("");
    const symUp = symbol.trim().toUpperCase();
    const parsedQty = parseFloat(qty);
    const parsedBuy = parseFloat(buyPrice);
    if (!symUp || !name.trim()) {
      setFormError("Symbol and name are required.");
      return;
    }
    if (isNaN(parsedQty) || parsedQty <= 0) {
      setFormError("Quantity must be a positive number.");
      return;
    }
    if (isNaN(parsedBuy) || parsedBuy < 0) {
      setFormError("Buy price must be a non-negative number.");
      return;
    }
    const entry: PortfolioEntry = {
      id: crypto.randomUUID(),
      symbol: symUp,
      name: name.trim(),
      quantity: parsedQty,
      buyPrice: parsedBuy,
      addedAt: new Date().toISOString(),
    };
    setEntries((prev) => [...prev, entry]);
    setSymbol("");
    setName("");
    setQty("");
    setBuyPrice("");
  }

  function removeEntry(id: string) {
    setEntries((prev) => prev.filter((e) => e.id !== id));
  }

  const pieData = useMemo(
    () =>
      entries
        .filter((e) => (prices[e.symbol] ?? 0) > 0)
        .map((e) => ({
          name: e.symbol,
          value: parseFloat((e.quantity * (prices[e.symbol] ?? 0)).toFixed(2)),
        })),
    [entries, prices],
  );
  const showPie = entries.length >= 2 && !priceLoading && pieData.length >= 2;

  const { totalInvested, totalCurrent, totalPnl, totalPnlPct } = useMemo(() => {
    const totalInvested = entries.reduce(
      (sum, e) => sum + e.quantity * e.buyPrice,
      0,
    );
    const totalCurrent = entries.reduce(
      (sum, e) => sum + e.quantity * (prices[e.symbol] ?? e.buyPrice),
      0,
    );
    const totalPnl = totalCurrent - totalInvested;
    const totalPnlPct =
      totalInvested > 0 ? (totalPnl / totalInvested) * 100 : 0;
    return { totalInvested, totalCurrent, totalPnl, totalPnlPct };
  }, [entries, prices]);

  return (
    <div className="container mx-auto max-w-5xl px-4 py-6">
      <title>Portfolio Tracker — Solis</title>
      <h1 className="text-3xl font-bold mb-2">Portfolio Tracker</h1>
      <p className="text-base-content/60 text-sm mb-6">
        Stored locally in your browser. No account needed.
      </p>

      {/* Add form */}
      <div className="card bg-base-100 shadow mb-6">
        <div className="card-body p-5">
          <h2 className="card-title text-base mb-3">Add Position</h2>
          <form
            onSubmit={addEntry}
            className="grid grid-cols-2 sm:grid-cols-4 gap-3"
          >
            <div>
              <label className="label label-text text-xs">Symbol</label>
              <input
                className="input input-bordered input-sm w-full uppercase"
                placeholder="BTC"
                value={symbol}
                onChange={(e) => setSymbol(e.target.value)}
              />
            </div>
            <div>
              <label className="label label-text text-xs">Name</label>
              <input
                className="input input-bordered input-sm w-full"
                placeholder="Bitcoin"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>
            <div>
              <label className="label label-text text-xs">Quantity</label>
              <input
                className="input input-bordered input-sm w-full"
                type="number"
                step="any"
                min="0"
                placeholder="0.5"
                value={qty}
                onChange={(e) => setQty(e.target.value)}
              />
            </div>
            <div>
              <label className="label label-text text-xs">
                Buy Price (USD)
              </label>
              <input
                className="input input-bordered input-sm w-full"
                type="number"
                step="any"
                min="0"
                placeholder="60000"
                value={buyPrice}
                onChange={(e) => setBuyPrice(e.target.value)}
              />
            </div>
            {formError && (
              <p className="col-span-full text-error text-xs">{formError}</p>
            )}
            <div className="col-span-full">
              <button type="submit" className="btn btn-primary btn-sm">
                + Add Position
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Summary cards */}
      {entries.length > 0 && (
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="stat bg-base-100 rounded-box shadow p-4">
            <div className="stat-title text-xs">Total Invested</div>
            <div className="stat-value text-lg tabular-nums">
              ${fmt(totalInvested)}
            </div>
          </div>
          <div className="stat bg-base-100 rounded-box shadow p-4">
            <div className="stat-title text-xs">Current Value</div>
            <div className="stat-value text-lg tabular-nums">
              {priceLoading ? (
                <span className="loading loading-xs" />
              ) : (
                `$${fmt(totalCurrent)}`
              )}
            </div>
          </div>
          <div className="stat bg-base-100 rounded-box shadow p-4">
            <div className="stat-title text-xs">Total P&amp;L</div>
            <div
              className={`stat-value text-lg tabular-nums ${totalPnl >= 0 ? "text-success" : "text-error"}`}
            >
              {priceLoading ? (
                <span className="loading loading-xs" />
              ) : (
                `${totalPnl >= 0 ? "+" : ""}$${fmt(totalPnl)}`
              )}
            </div>
            <div
              className={`stat-desc font-medium ${totalPnlPct >= 0 ? "text-success" : "text-error"}`}
            >
              {fmtPct(totalPnlPct)}
            </div>
          </div>
        </div>
      )}

      {/* Price error notice */}
      {priceError && (
        <div className="alert alert-warning py-2 text-sm mb-4" role="alert">
          <span>{priceError}</span>
        </div>
      )}

      {/* Positions table */}
      {entries.length === 0 ? (
        <div className="text-center py-16 text-base-content/40">
          <p className="text-5xl mb-4">💼</p>
          <p>No positions yet. Add your first holding above.</p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-box bg-base-100 shadow">
          <table className="table table-sm w-full">
            <thead>
              <tr className="text-xs text-base-content/60">
                <th>Coin</th>
                <th className="text-right">Qty</th>
                <th className="text-right">Buy Price</th>
                <th className="text-right">Current</th>
                <th className="text-right">Value</th>
                <th className="text-right">P&amp;L</th>
                <th className="text-right">P&amp;L%</th>
                <th />
              </tr>
            </thead>
            <tbody className="divide-y divide-base-200">
              {entries.map((entry) => {
                const current = prices[entry.symbol] ?? 0;
                const value = entry.quantity * current;
                const invested = entry.quantity * entry.buyPrice;
                const pnl = current > 0 ? value - invested : null;
                const pnlPct =
                  invested > 0 && current > 0
                    ? ((current - entry.buyPrice) / entry.buyPrice) * 100
                    : null;
                const up = pnl !== null && pnl >= 0;
                return (
                  <tr key={entry.id} className="hover:bg-base-200/40">
                    <td className="py-2">
                      <p className="font-semibold text-sm">{entry.symbol}</p>
                      <p className="text-xs text-base-content/50">
                        {entry.name}
                      </p>
                    </td>
                    <td className="text-right tabular-nums text-sm">
                      {entry.quantity}
                    </td>
                    <td className="text-right tabular-nums text-sm">
                      ${fmt(entry.buyPrice)}
                    </td>
                    <td className="text-right tabular-nums text-sm">
                      {priceLoading
                        ? "…"
                        : current > 0
                          ? `$${fmt(current)}`
                          : "—"}
                    </td>
                    <td className="text-right tabular-nums text-sm">
                      {priceLoading || !current ? "—" : `$${fmt(value)}`}
                    </td>
                    <td
                      className={`text-right tabular-nums text-sm font-medium ${pnl !== null ? (up ? "text-success" : "text-error") : ""}`}
                    >
                      {pnl !== null ? `${up ? "+" : ""}$${fmt(pnl)}` : "—"}
                    </td>
                    <td
                      className={`text-right tabular-nums text-sm font-medium ${pnlPct !== null ? (up ? "text-success" : "text-error") : ""}`}
                    >
                      {pnlPct !== null ? fmtPct(pnlPct) : "—"}
                    </td>
                    <td className="text-right">
                      <button
                        onClick={() => removeEntry(entry.id)}
                        aria-label={`Remove ${entry.name}`}
                        className="btn btn-ghost btn-xs text-error"
                      >
                        ✕
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Allocation pie chart — shown when ≥2 positions have live prices */}
      {showPie && (
        <div className="card bg-base-100 shadow mt-6">
          <div className="card-body p-5">
            <h2 className="card-title text-base mb-2">Allocation Breakdown</h2>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={75}
                  outerRadius={115}
                  paddingAngle={2}
                  dataKey="value"
                >
                  {pieData.map((entry, index) => (
                    <Cell
                      key={entry.name}
                      fill={PIE_COLORS[index % PIE_COLORS.length]}
                    />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(value: number) => [`$${fmt(value)}`, "Value"]}
                />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}
    </div>
  );
}
