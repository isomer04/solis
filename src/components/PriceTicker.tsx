import { useTopCoins } from "../hooks/useTopCoins";

function Pct({ v }: { v: number }) {
  const up = v >= 0;
  return (
    <span className={up ? "text-success" : "text-error"}>
      {up ? "▲" : "▼"} {Math.abs(v).toFixed(2)}%
    </span>
  );
}

export default function PriceTicker() {
  const { data } = useTopCoins(1, "all");

  // Need at least 1 coin; show nothing until data arrives
  if (!data.length) return null;

  // Top 15 coins for the ticker
  const coins = data.slice(0, 15);

  // Duplicate for seamless loop
  const items = [...coins, ...coins];

  return (
    <div
      className="bg-base-100 border-b border-base-300 ticker-wrapper overflow-hidden py-1"
      aria-label="Live price ticker"
    >
      <div className="ticker-track gap-8 px-4">
        {items.map((coin, i) => (
          <span
            key={`${coin.id}-${i}`}
            aria-hidden={i >= coins.length}
            className="inline-flex items-center gap-1.5 whitespace-nowrap text-xs"
          >
            <img
              src={coin.image}
              alt={coin.symbol}
              className="h-4 w-4 rounded-full"
              loading="lazy"
            />
            <span className="font-semibold uppercase">{coin.symbol}</span>
            <span className="text-base-content/80">
              $
              {coin.current_price < 1
                ? coin.current_price.toPrecision(4)
                : coin.current_price.toLocaleString(undefined, {
                    maximumFractionDigits: 2,
                  })}
            </span>
            <Pct v={coin.price_change_percentage_24h} />
          </span>
        ))}
      </div>
    </div>
  );
}
