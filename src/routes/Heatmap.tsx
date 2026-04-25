import { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useTopCoins } from "../hooks/useTopCoins";
import type { TopCoin } from "../types";

/** HSL colour interpolated from the 24h % change */
function getPctColor(pct: number | null): string {
  if (pct === null) return "hsl(220, 15%, 22%)";
  const clamped = Math.max(-15, Math.min(15, pct));
  if (clamped === 0) return "hsl(220, 15%, 22%)";
  if (clamped < 0) {
    const intensity = Math.abs(clamped) / 15;
    return `hsl(0, ${60 + intensity * 25}%, ${44 - intensity * 14}%)`;
  }
  const intensity = clamped / 15;
  return `hsl(142, ${55 + intensity * 25}%, ${36 - intensity * 10}%)`;
}

/** Tile dimensions based on market-cap rank */
function getTileSize(rank: number): {
  width: number;
  height: number;
  symFz: number;
  pctFz: number;
} {
  if (rank <= 5) return { width: 140, height: 110, symFz: 16, pctFz: 12 };
  if (rank <= 15) return { width: 110, height: 88, symFz: 13, pctFz: 10 };
  if (rank <= 30) return { width: 90, height: 74, symFz: 11, pctFz: 9 };
  if (rank <= 60) return { width: 76, height: 62, symFz: 10, pctFz: 8 };
  return { width: 62, height: 52, symFz: 9, pctFz: 7 };
}

const LEGEND_STEPS = [-10, -6, -3, -1, 0, 1, 3, 6, 10];

interface HoverState {
  coin: TopCoin;
  x: number;
  y: number;
}

export default function Heatmap() {
  const navigate = useNavigate();
  const { data: coins, loading, error } = useTopCoins(1, "all");
  const [hover, setHover] = useState<HoverState | null>(null);
  const rafRef = useRef<number | null>(null);

  return (
    <div className="container mx-auto max-w-7xl px-4 pt-6 pb-12">
      <title>Market Heatmap — Solis</title>
      <h1 className="text-3xl font-bold mb-1">Market Heatmap</h1>
      <p className="text-base-content/60 text-sm mb-5">
        24h price change for top 100 cryptocurrencies &bull; Click any tile to
        view details
      </p>

      {/* Colour scale legend */}
      <div className="flex items-center gap-3 mb-6 text-xs text-base-content/60">
        <span className="whitespace-nowrap">&minus;10%+</span>
        <div
          className="flex h-4 rounded overflow-hidden"
          style={{ width: 180 }}
        >
          {LEGEND_STEPS.map((v) => (
            <div key={v} style={{ backgroundColor: getPctColor(v), flex: 1 }} />
          ))}
        </div>
        <span className="whitespace-nowrap">+10%+</span>
      </div>

      {error && (
        <div className="alert alert-error mb-6" role="alert">
          <span>Failed to load heatmap data: {error}</span>
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-24">
          <span className="loading loading-spinner loading-lg text-primary" />
        </div>
      ) : (
        <div className="flex flex-wrap gap-1.5">
          {coins.map((coin) => {
            const pct = coin.price_change_percentage_24h;
            const { width, height, symFz, pctFz } = getTileSize(
              coin.market_cap_rank,
            );
            const bg = getPctColor(pct);
            const pctLabel =
              pct !== null ? `${pct >= 0 ? "+" : ""}${pct.toFixed(2)}%` : "N/A";

            return (
              <button
                key={coin.id}
                style={{
                  width,
                  height,
                  backgroundColor: bg,
                  borderRadius: 6,
                  border: "1px solid rgba(255,255,255,0.07)",
                  color: "#fff",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  cursor: "pointer",
                  padding: 4,
                  overflow: "hidden",
                }}
                onMouseEnter={(e) =>
                  setHover({ coin, x: e.clientX, y: e.clientY })
                }
                onMouseMove={(e) => {
                  if (rafRef.current !== null)
                    cancelAnimationFrame(rafRef.current);
                  const clientX = e.clientX;
                  const clientY = e.clientY;
                  rafRef.current = requestAnimationFrame(() => {
                    setHover((h) =>
                      h ? { ...h, x: clientX, y: clientY } : null,
                    );
                    rafRef.current = null;
                  });
                }}
                onMouseLeave={() => setHover(null)}
                onClick={() =>
                  navigate(`/coinDetails/${coin.symbol.toUpperCase()}`)
                }
              >
                <span
                  style={{
                    fontSize: symFz,
                    fontWeight: 700,
                    lineHeight: 1.2,
                    maxWidth: "100%",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                  }}
                >
                  {coin.symbol.toUpperCase()}
                </span>
                <span
                  style={{
                    fontSize: pctFz,
                    opacity: 0.9,
                    lineHeight: 1.2,
                  }}
                >
                  {pctLabel}
                </span>
              </button>
            );
          })}
        </div>
      )}

      {/* Floating tooltip */}
      {hover && (
        <div
          className="fixed z-50 pointer-events-none bg-base-100 border border-base-300 rounded-box shadow-xl px-3 py-2 text-sm"
          style={{
            left: Math.max(8, Math.min(hover.x + 14, window.innerWidth - 200)),
            top: Math.max(hover.y - 70, 8),
            minWidth: 170,
          }}
        >
          <div className="flex items-center gap-2 mb-1">
            <img
              src={hover.coin.image}
              alt={hover.coin.name}
              className="w-5 h-5 rounded-full"
            />
            <p className="font-bold">{hover.coin.name}</p>
          </div>
          <p className="text-base-content/70 tabular-nums">
            $
            {hover.coin.current_price.toLocaleString(undefined, {
              maximumFractionDigits: 6,
            })}
          </p>
          <p
            className={
              (hover.coin.price_change_percentage_24h ?? 0) >= 0
                ? "text-success font-medium"
                : "text-error font-medium"
            }
          >
            {(hover.coin.price_change_percentage_24h ?? 0) >= 0 ? "+" : ""}
            {hover.coin.price_change_percentage_24h?.toFixed(2)}% (24h)
          </p>
          <p className="text-xs text-base-content/50 mt-0.5">
            Rank #{hover.coin.market_cap_rank}
          </p>
        </div>
      )}
    </div>
  );
}
