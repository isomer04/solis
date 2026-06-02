import { useCallback, useEffect, useRef, useState } from "react";
import { createChart, type IChartApi, type Time } from "lightweight-charts";
import { useCoinHistory, type Timeframe } from "../hooks/useCoinHistory";

function useTheme(): string {
  const [theme, setTheme] = useState(
    () => document.documentElement.getAttribute("data-theme") ?? "rh",
  );
  useEffect(() => {
    const observer = new MutationObserver(() => {
      setTheme(document.documentElement.getAttribute("data-theme") ?? "rh");
    });
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["data-theme"],
    });
    return () => observer.disconnect();
  }, []);
  return theme;
}

interface Props {
  symbol: string;
  market: string;
}

type ChartMode = "line" | "candlestick";

const TIMEFRAMES: Timeframe[] = ["1D", "1W", "1M", "3M", "1Y"];

export default function CoinChart({ symbol, market }: Props) {
  const [timeframe, setTimeframe] = useState<Timeframe>("1M");
  const [mode, setMode] = useState<ChartMode>("line");
  const { data, loading, error } = useCoinHistory(symbol, market, timeframe);
  const theme = useTheme();
  const isDark = theme !== "rh-light";

  const containerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);

  // Stable handlers so button elements don't get new function refs on every render
  const handleSetLine = useCallback(() => setMode("line"), []);
  const handleSetCandlestick = useCallback(() => setMode("candlestick"), []);

  useEffect(() => {
    if (!containerRef.current || !data || data.length === 0) return;

    // Remove old chart instance
    chartRef.current?.remove();
    chartRef.current = null;

    const bgColor = isDark ? "#111111" : "#ffffff";
    const textColor = isDark ? "#888888" : "#555555";
    const gridColor = isDark ? "#1e1e1e" : "#e5e7eb";
    const borderColor = isDark ? "#333333" : "#d1d5db";

    const chart = createChart(containerRef.current, {
      autoSize: true,
      height: 360,
      layout: {
        background: { color: bgColor },
        textColor,
      },
      grid: {
        vertLines: { color: gridColor },
        horzLines: { color: gridColor },
      },
      crosshair: { mode: 1 },
      rightPriceScale: { borderColor },
      timeScale: {
        borderColor,
        timeVisible: timeframe === "1D" || timeframe === "1W",
      },
    });

    chartRef.current = chart;

    const toTime = (t: number): Time =>
      timeframe === "1D" || timeframe === "1W"
        ? (t as Time)
        : new Date(t * 1000).toISOString().slice(0, 10);

    const seriesData = data
      .filter((d) => d.open > 0 || d.close > 0)
      .map((d) => ({ ...d, t: toTime(d.time) }));

    if (mode === "candlestick") {
      const candleSeries = chart.addCandlestickSeries({
        upColor: "#22c55e",
        downColor: "#ef4444",
        borderUpColor: "#22c55e",
        borderDownColor: "#ef4444",
        wickUpColor: "#22c55e",
        wickDownColor: "#ef4444",
      });
      candleSeries.setData(
        seriesData.map((d) => ({
          time: d.t,
          open: d.open,
          high: d.high,
          low: d.low,
          close: d.close,
        })),
      );
    } else {
      const lineSeries = chart.addLineSeries({
        color: isDark ? "#00d4ff" : "#2563eb",
        lineWidth: 2,
        priceLineVisible: true,
      });
      lineSeries.setData(
        seriesData.map((d) => ({ time: d.t, value: d.close || d.open })),
      );
    }

    if (seriesData.some((d) => d.volumeto > 0)) {
      const volumeSeries = chart.addHistogramSeries({
        color: isDark ? "#00d4ff22" : "#2563eb22",
        priceFormat: { type: "volume" },
        priceScaleId: "volume",
      });
      volumeSeries.priceScale().applyOptions({
        scaleMargins: { top: 0.85, bottom: 0 },
      });
      volumeSeries.setData(
        seriesData.map((d) => ({
          time: d.t,
          value: d.volumeto,
          color:
            (d.close || d.open) >= d.open
              ? isDark
                ? "#22c55e30"
                : "#22c55e50"
              : isDark
                ? "#ef444430"
                : "#ef444450",
        })),
      );
    }

    chart.timeScale().fitContent();

    return () => {
      chart.remove();
      chartRef.current = null;
    };
  }, [data, mode, timeframe, isDark]);

  return (
    <div className="rounded-box bg-base-100 p-4 shadow">
      {/* Controls */}
      <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
        <h2 className="text-xl font-semibold">{symbol} &mdash; Price Chart</h2>

        <div className="flex gap-2 flex-wrap">
          {/* Timeframe */}
          <div className="join" role="group" aria-label="Chart timeframe">
            {TIMEFRAMES.map((tf) => (
              <button
                key={tf}
                className={`join-item btn btn-xs ${timeframe === tf ? "btn-primary" : "btn-ghost"}`}
                aria-pressed={timeframe === tf}
                onClick={() => setTimeframe(tf)}
              >
                {tf}
              </button>
            ))}
          </div>

          {/* Mode toggle */}
          <div className="join" role="group" aria-label="Chart type">
            <button
              className={`join-item btn btn-xs ${mode === "line" ? "btn-primary" : "btn-ghost"}`}
              aria-pressed={mode === "line"}
              aria-label="Line chart"
              title="Line chart"
              onClick={handleSetLine}
            >
              〰
            </button>
            <button
              className={`join-item btn btn-xs ${mode === "candlestick" ? "btn-primary" : "btn-ghost"}`}
              aria-pressed={mode === "candlestick"}
              aria-label="Candlestick chart"
              title="Candlestick chart"
              onClick={handleSetCandlestick}
            >
              ☶
            </button>
          </div>
        </div>
      </div>

      {error && (
        <div className="alert alert-error mb-2" role="alert">
          <span>Could not load chart data.</span>
        </div>
      )}

      <div className="relative">
        {loading && (
          <div className="absolute inset-0 flex items-center justify-center bg-base-100/70 z-10 rounded">
            <span className="loading loading-spinner loading-lg text-primary" />
          </div>
        )}
        <div
          ref={containerRef}
          className="w-full rounded"
          style={{ minHeight: 360 }}
        />
      </div>

      <p className="text-xs text-base-content/40 mt-2 text-right">
        Data: CryptoCompare &bull; OHLCV
      </p>
    </div>
  );
}
