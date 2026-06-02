import { useGlobalStats } from "../hooks/useGlobalStats";

function fmt(n: number, decimals = 2): string {
  if (n >= 1e12) return `$${(n / 1e12).toFixed(decimals)}T`;
  if (n >= 1e9) return `$${(n / 1e9).toFixed(decimals)}B`;
  if (n >= 1e6) return `$${(n / 1e6).toFixed(decimals)}M`;
  return `$${n.toLocaleString()}`;
}

function FgiLabel({ value }: { value: number }) {
  let label = "Neutral";
  let cls = "text-warning";
  if (value <= 25) {
    label = "Extreme Fear";
    cls = "text-error";
  } else if (value <= 45) {
    label = "Fear";
    cls = "text-error/80";
  } else if (value <= 55) {
    label = "Neutral";
    cls = "text-warning";
  } else if (value <= 75) {
    label = "Greed";
    cls = "text-success";
  } else {
    label = "Extreme Greed";
    cls = "text-success";
  }
  return (
    <span className={cls}>
      {value} &mdash; {label}
    </span>
  );
}

export default function MarketStatsBanner() {
  const { data, loading, error } = useGlobalStats();

  if (loading || !data.market) {
    return (
      <div className="bg-base-300 text-base-content/60 text-xs py-1 px-4 flex gap-4 overflow-x-auto">
        <span className="skeleton h-3 w-32 rounded" />
        <span className="skeleton h-3 w-24 rounded" />
        <span className="skeleton h-3 w-28 rounded" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-base-300 text-error text-xs py-1 px-4">
        <span>Failed to load market stats.</span>
      </div>
    );
  }

  const m = data.market;
  const fgi = data.fearGreed;
  const changeUp = m.market_cap_change_pct_24h >= 0;

  return (
    <div className="bg-base-300 text-base-content/70 text-xs py-1 px-4 overflow-x-auto">
      <div
        className="flex items-center gap-4 min-w-max"
        role="status"
        aria-live="polite"
      >
        <span>
          Cryptos:{" "}
          <span className="text-base-content font-medium">
            {m.active_cryptocurrencies.toLocaleString()}
          </span>
        </span>

        <span className="opacity-30" aria-hidden="true">
          |
        </span>

        <span>
          Market Cap:{" "}
          <span className="text-base-content font-medium">
            {fmt(m.total_market_cap_usd)}
          </span>{" "}
          <span className={changeUp ? "text-success" : "text-error"}>
            {changeUp ? "▲" : "▼"}
            {Math.abs(m.market_cap_change_pct_24h).toFixed(2)}%
          </span>
        </span>

        <span className="opacity-30" aria-hidden="true">
          |
        </span>

        <span>
          24h Vol:{" "}
          <span className="text-base-content font-medium">
            {fmt(m.total_volume_usd)}
          </span>
        </span>

        <span className="opacity-30" aria-hidden="true">
          |
        </span>

        <span>
          Dominance:{" "}
          <span className="text-base-content font-medium">
            BTC {m.btc_dominance.toFixed(1)}%
          </span>{" "}
          <span className="text-base-content font-medium">
            ETH {m.eth_dominance.toFixed(1)}%
          </span>
        </span>

        {fgi && (
          <>
            <span className="opacity-30" aria-hidden="true">
              |
            </span>
            <span>
              Fear &amp; Greed: <FgiLabel value={fgi.value} />
            </span>
          </>
        )}
      </div>
    </div>
  );
}
