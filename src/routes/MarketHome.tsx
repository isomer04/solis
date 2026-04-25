import { Link } from "react-router-dom";
import { useGlobalStats } from "../hooks/useGlobalStats";
import { useTopCoins } from "../hooks/useTopCoins";
import { useCryptoNews } from "../hooks/useCryptoNews";
import MarketOverviewCards from "../components/home/MarketOverviewCards";
import TrendingCoins from "../components/home/TrendingCoins";
import TopGainersLosers from "../components/home/TopGainersLosers";
import FearGreedGauge from "../components/home/FearGreedGauge";

function SectionHeader({
  title,
  to,
  linkLabel,
}: {
  title: string;
  to?: string;
  linkLabel?: string;
}) {
  return (
    <div className="flex items-center justify-between mb-3">
      <h2 className="text-xl font-bold">{title}</h2>
      {to && linkLabel && (
        <Link to={to} className="btn btn-ghost btn-xs text-primary">
          {linkLabel} →
        </Link>
      )}
    </div>
  );
}

function DominanceBadge({ dominance }: { dominance: number }) {
  if (dominance < 50) {
    return (
      <div className="badge badge-success badge-lg font-semibold py-3 px-4">
        🚀 Altcoin Season &mdash; BTC Dominance {dominance.toFixed(1)}%
      </div>
    );
  }
  if (dominance > 55) {
    return (
      <div className="badge badge-warning badge-lg font-semibold py-3 px-4">
        ₿ Bitcoin Season &mdash; BTC Dominance {dominance.toFixed(1)}%
      </div>
    );
  }
  return (
    <div className="badge badge-neutral badge-lg font-semibold py-3 px-4">
      ⚖️ Transition Zone &mdash; BTC Dominance {dominance.toFixed(1)}%
    </div>
  );
}

export default function MarketHome() {
  const { data: globalData, loading: globalLoading } = useGlobalStats();
  const { data: coins, loading: coinsLoading } = useTopCoins(1, "all");
  const { data: news, loading: newsLoading } = useCryptoNews();

  return (
    <div className="container mx-auto max-w-7xl px-4 py-6 space-y-10">
      <title>Market Dashboard — Solis</title>
      {/* Hero */}
      <div>
        <h1 className="text-3xl font-extrabold mb-1">Crypto Market Overview</h1>
        <p className="text-base-content/60 text-sm">
          Live data from CoinGecko &bull; Updates every minute
        </p>
      </div>

      {/* Global Stats Cards */}
      {globalLoading || !globalData.market ? (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="stat bg-base-100 rounded-box shadow p-4">
              <div className="skeleton h-3 w-24 rounded mb-2" />
              <div className="skeleton h-7 w-32 rounded" />
            </div>
          ))}
        </div>
      ) : (
        <>
          <MarketOverviewCards data={globalData.market} />
          {/* Altcoin Season / Bitcoin Season indicator */}
          <div className="flex justify-center mt-3">
            <DominanceBadge dominance={globalData.market.btc_dominance} />
          </div>
        </>
      )}

      {/* Trending + Fear & Greed side by side */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <SectionHeader
            title="🔥 Trending Coins"
            to="/cryptotracker"
            linkLabel="See all"
          />
          <TrendingCoins />
        </div>
        <div>
          <SectionHeader title="😨 Fear &amp; Greed Index" />
          <div className="card bg-base-100 shadow p-6 flex items-center justify-center min-h-50">
            {globalData.fearGreed ? (
              <FearGreedGauge
                value={globalData.fearGreed.value}
                classification={globalData.fearGreed.value_classification}
              />
            ) : (
              <span className="loading loading-spinner loading-md text-primary" />
            )}
          </div>
        </div>
      </div>

      {/* Top Gainers & Losers */}
      <div>
        <SectionHeader
          title="📊 Top Movers (24h)"
          to="/cryptotracker"
          linkLabel="Full market"
        />
        {coinsLoading ? (
          <div className="flex justify-center py-8">
            <span className="loading loading-spinner loading-lg text-primary" />
          </div>
        ) : (
          <TopGainersLosers coins={coins} />
        )}
      </div>

      {/* Latest News */}
      <div>
        <SectionHeader
          title="📰 Latest News"
          to="/cryptonews"
          linkLabel="All news"
        />
        {newsLoading ? (
          <div className="grid gap-4 sm:grid-cols-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="card bg-base-100 shadow">
                <div className="skeleton h-40 w-full rounded-t-box" />
                <div className="card-body gap-2">
                  <div className="skeleton h-4 w-3/4 rounded" />
                  <div className="skeleton h-3 w-full rounded" />
                  <div className="skeleton h-3 w-2/3 rounded" />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-3">
            {news
              .filter((a) => Boolean(a.imageurl))
              .slice(0, 3)
              .map((article) => (
                <div
                  key={article.id}
                  className="card bg-base-100 shadow hover:shadow-md transition-shadow"
                >
                  <figure className="h-40 overflow-hidden">
                    <img
                      src={article.imageurl}
                      alt={article.title}
                      className="h-full w-full object-cover"
                      loading="lazy"
                      onError={(e) => {
                        e.currentTarget.closest("figure")?.classList.add("hidden");
                      }}
                    />
                  </figure>
                  <div className="card-body p-4">
                    <h3 className="font-semibold text-sm line-clamp-2 leading-snug">
                      {article.title}
                    </h3>
                    <p className="text-xs text-base-content/60 mt-1">
                      {article.source} &bull;{" "}
                      {new Date(
                        article.published_on * 1000,
                      ).toLocaleDateString()}
                    </p>
                    <div className="card-actions mt-2">
                      <a
                        href={article.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="btn btn-primary btn-xs"
                      >
                        Read More
                      </a>
                    </div>
                  </div>
                </div>
              ))}
          </div>
        )}
      </div>
    </div>
  );
}
