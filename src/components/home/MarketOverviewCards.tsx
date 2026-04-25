import type { GlobalMarketData } from "../../types";

function fmt(n: number): string {
  if (n >= 1e12) return `$${(n / 1e12).toFixed(2)}T`;
  if (n >= 1e9) return `$${(n / 1e9).toFixed(2)}B`;
  return `$${n.toLocaleString()}`;
}

interface Card {
  label: string;
  value: string;
  sub?: string;
  subUp?: boolean;
}

interface Props {
  data: GlobalMarketData;
}

export default function MarketOverviewCards({ data }: Props) {
  const cards: Card[] = [
    {
      label: "Market Cap",
      value: fmt(data.total_market_cap_usd),
      sub: `${data.market_cap_change_pct_24h >= 0 ? "+" : ""}${data.market_cap_change_pct_24h.toFixed(2)}% 24h`,
      subUp: data.market_cap_change_pct_24h >= 0,
    },
    {
      label: "24h Volume",
      value: fmt(data.total_volume_usd),
    },
    {
      label: "BTC Dominance",
      value: `${data.btc_dominance.toFixed(1)}%`,
    },
    {
      label: "Active Cryptos",
      value: data.active_cryptocurrencies.toLocaleString(),
    },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {cards.map((card) => (
        <div
          key={card.label}
          className="stat bg-base-100 rounded-box shadow p-4"
        >
          <div className="stat-title text-xs">{card.label}</div>
          <div className="stat-value text-xl font-bold tabular-nums">
            {card.value}
          </div>
          {card.sub && (
            <div
              className={`stat-desc text-xs mt-1 font-medium ${card.subUp ? "text-success" : "text-error"}`}
            >
              {card.sub}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
