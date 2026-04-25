import { Link } from "react-router-dom";
import type { TopCoin } from "../../types";

interface Props {
  coins: TopCoin[];
}

function CoinRow({ coin, rank }: { coin: TopCoin; rank: number }) {
  const pct = coin.price_change_percentage_24h;
  const up = pct >= 0;
  return (
    <tr className="hover:bg-base-200/50 transition-colors">
      <td className="py-2 px-3 text-base-content/50 text-xs w-6">{rank}</td>
      <td className="py-2 px-1">
        <Link
          to={`/coinDetails/${coin.symbol.toUpperCase()}`}
          className="flex items-center gap-2 hover:text-primary transition-colors"
        >
          <img
            src={coin.image}
            alt={coin.name}
            className="h-6 w-6 rounded-full shrink-0"
            loading="lazy"
          />
          <div>
            <p className="font-semibold text-sm leading-none">
              {coin.symbol.toUpperCase()}
            </p>
            <p className="text-xs text-base-content/50 leading-none mt-0.5">
              {coin.name}
            </p>
          </div>
        </Link>
      </td>
      <td className="py-2 px-3 text-right tabular-nums text-sm">
        $
        {coin.current_price < 1
          ? coin.current_price.toPrecision(4)
          : coin.current_price.toLocaleString(undefined, {
              maximumFractionDigits: 2,
            })}
      </td>
      <td
        className={`py-2 px-3 text-right text-sm font-medium tabular-nums ${up ? "text-success" : "text-error"}`}
      >
        {up ? "▲" : "▼"} {Math.abs(pct).toFixed(2)}%
      </td>
    </tr>
  );
}

function CoinsTable({
  title,
  rows,
  icon,
}: {
  title: string;
  rows: TopCoin[];
  icon: string;
}) {
  return (
    <div className="card bg-base-100 shadow flex-1">
      <div className="card-body p-4">
        <h3 className="card-title text-base">
          <span>{icon}</span> {title}
        </h3>
        <table className="table table-xs w-full">
          <thead>
            <tr className="text-base-content/50">
              <th className="w-6">#</th>
              <th>Coin</th>
              <th className="text-right">Price</th>
              <th className="text-right">24h</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((coin, i) => (
              <CoinRow key={coin.id} coin={coin} rank={i + 1} />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default function TopGainersLosers({ coins }: Props) {
  const sorted = [...coins].sort(
    (a, b) => b.price_change_percentage_24h - a.price_change_percentage_24h,
  );
  const gainers = sorted.slice(0, 5);
  const losers = sorted.slice(-5).reverse();

  return (
    <div className="flex flex-col lg:flex-row gap-4">
      <CoinsTable title="Top Gainers" rows={gainers} icon="🚀" />
      <CoinsTable title="Top Losers" rows={losers} icon="📉" />
    </div>
  );
}
