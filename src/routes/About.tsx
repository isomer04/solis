import { Link } from "react-router-dom";

const FEATURES = [
  {
    icon: "📊",
    title: "Live Market Dashboard",
    desc: "Real-time prices, market cap, volume, and 7-day sparklines for 8,000+ cryptocurrencies powered by CoinGecko.",
  },
  {
    icon: "📈",
    title: "Interactive Charts",
    desc: "Professional candlestick and line charts with 5 timeframes, volume histogram, and zoom powered by lightweight-charts.",
  },
  {
    icon: "🌡️",
    title: "Market Heatmap",
    desc: "Visual 24h price movement overview for the top 100 coins at a glance — colour-coded from deep red to green.",
  },
  {
    icon: "💼",
    title: "Portfolio Tracker",
    desc: "Track your holdings with live P&L, allocation pie chart, and cost-basis analysis — no account required.",
  },
  {
    icon: "🔄",
    title: "Crypto Converter",
    desc: "Instantly convert between any cryptocurrency and fiat currencies using real-time CryptoCompare prices.",
  },
  {
    icon: "📰",
    title: "Crypto News",
    desc: "Aggregated headlines from 100+ sources, filterable by category — Bitcoin, Ethereum, DeFi, NFTs, and more.",
  },
  {
    icon: "💬",
    title: "Community",
    desc: "Post analysis, tutorials, and discussion threads. Upvote content, leave comments, and tag your posts.",
  },
  {
    icon: "😨",
    title: "Fear & Greed Index",
    desc: "Live market sentiment gauge via alternative.me, updated daily alongside BTC dominance and altcoin season signals.",
  },
] as const;

const DATA_SOURCES = [
  "CoinGecko",
  "CryptoCompare",
  "Alternative.me",
  "Supabase",
  "Cloudinary",
  "EmailJS",
] as const;

const TECH_STACK = [
  "React 19",
  "TypeScript",
  "Vite 6",
  "Tailwind CSS v4",
  "DaisyUI v5",
  "Recharts",
  "lightweight-charts",
  "React Router v7",
  "Supabase",
] as const;

const STATS = [
  { value: "8,000+", label: "Cryptocurrencies tracked" },
  { value: "100+", label: "News sources aggregated" },
  { value: "5", label: "Chart timeframes" },
  { value: "Free", label: "No account required" },
] as const;

export default function About() {
  return (
    <div className="container mx-auto max-w-5xl px-4 pt-8 pb-16">
      <title>About — Solis</title>
      {/* ── Hero ── */}
      <div className="rounded-box bg-linear-to-br from-primary/20 to-secondary/10 px-8 py-14 mb-12 text-center">
        <h1 className="text-4xl sm:text-5xl font-extrabold mb-4 leading-tight">
          Your All-in-One
          <span className="text-primary block mt-1">
            Crypto Intelligence Hub
          </span>
        </h1>
        <p className="text-base-content/70 text-lg max-w-xl mx-auto mb-8">
          Real-time prices, news, portfolio tracking, a market heatmap, and a
          thriving community — everything a crypto enthusiast needs in one
          place.
        </p>
        <div className="flex flex-wrap gap-3 justify-center">
          <Link to="/" className="btn btn-primary btn-lg">
            Explore Markets
          </Link>
          <Link to="/heatmap" className="btn btn-outline btn-lg">
            View Heatmap
          </Link>
          <Link to="/portfolio" className="btn btn-ghost btn-lg">
            Track Portfolio
          </Link>
        </div>
      </div>

      {/* ── Feature Cards ── */}
      <section className="mb-12">
        <h2 className="text-2xl font-bold mb-2 text-center">
          What Solis Offers
        </h2>
        <p className="text-center text-base-content/60 text-sm mb-6">
          Built by traders, for traders.
        </p>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {FEATURES.map(({ icon, title, desc }) => (
            <div
              key={title}
              className="card bg-base-100 shadow hover:shadow-md transition-shadow"
            >
              <div className="card-body p-5">
                <div className="text-4xl mb-3">{icon}</div>
                <h3 className="font-bold text-sm mb-2">{title}</h3>
                <p className="text-xs text-base-content/70 leading-relaxed">
                  {desc}
                </p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── Stats strip ── */}
      <section className="rounded-box bg-base-100 shadow p-6 mb-12">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 text-center">
          {STATS.map(({ value, label }) => (
            <div key={label}>
              <p className="text-2xl font-extrabold text-primary">{value}</p>
              <p className="text-xs text-base-content/60 mt-1">{label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Data Sources ── */}
      <section className="mb-12">
        <h2 className="text-2xl font-bold mb-2 text-center">Data Sources</h2>
        <p className="text-center text-base-content/60 text-sm mb-6">
          Solis aggregates data from trusted, industry-leading providers.
        </p>
        <div className="flex flex-wrap gap-3 justify-center">
          {DATA_SOURCES.map((src) => (
            <span
              key={src}
              className="badge badge-lg badge-outline font-medium px-4 py-3"
            >
              {src}
            </span>
          ))}
        </div>
      </section>

      {/* ── Tech Stack ── */}
      <section>
        <h2 className="text-2xl font-bold mb-4 text-center">Built With</h2>
        <div className="flex flex-wrap gap-2 justify-center">
          {TECH_STACK.map((tech) => (
            <span
              key={tech}
              className="badge badge-primary badge-outline px-3 py-2 text-xs font-mono"
            >
              {tech}
            </span>
          ))}
        </div>
      </section>

      {/* ── Disclaimer ── */}
      <p className="mt-12 text-center text-xs text-base-content/40 max-w-lg mx-auto">
        Solis is for informational purposes only. Nothing on this site
        constitutes financial advice. Always do your own research before
        investing.
      </p>
    </div>
  );
}
