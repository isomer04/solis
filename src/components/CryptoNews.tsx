import { useCallback, useMemo, useState } from "react";
import { useCryptoNews } from "../hooks/useCryptoNews";
import type { NewsArticle } from "../types";

const CATEGORIES = [
  { label: "All", key: "all" },
  { label: "Bitcoin", key: "BTC" },
  { label: "Ethereum", key: "ETH" },
  { label: "DeFi", key: "DeFi" },
  { label: "NFT", key: "NFT" },
  { label: "Trading", key: "Trading" },
  { label: "Altcoins", key: "Altcoin" },
] as const;

function timeAgo(unixSecs: number): string {
  const ms = Date.now() - unixSecs * 1000;
  const mins = Math.floor(ms / 60_000);
  const hrs = Math.floor(ms / 3_600_000);
  const days = Math.floor(ms / 86_400_000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins}m ago`;
  if (hrs < 24) return `${hrs}h ago`;
  return `${days}d ago`;
}

function isHot(): boolean {
  // upvotes field removed from NewsArticle type — hot badge feature disabled
  return false;
}

function matchesCategory(article: NewsArticle, key: string): boolean {
  if (key === "all") return true;
  const cats = (article.categories ?? "").toLowerCase();
  if (key === "Altcoin") return !cats.includes("btc") && !cats.includes("eth");
  return cats.includes(key.toLowerCase());
}

function truncate(text: string, max: number): string {
  return text.length > max ? `${text.slice(0, max)}\u2026` : text;
}

/** Deterministic hue (0-360) from a string so the same source always maps to the same colour. */
function sourceHue(source: string): number {
  let hash = 0;
  for (let i = 0; i < source.length; i++) {
    hash = (hash * 31 + source.charCodeAt(i)) & 0xffffffff;
  }
  return Math.abs(hash) % 360;
}

function categoryIcon(categories: string | undefined): string {
  const cats = (categories ?? "").toLowerCase();
  if (cats.includes("btc") || cats.includes("bitcoin")) return "₿";
  if (cats.includes("eth") || cats.includes("ethereum")) return "Ξ";
  if (cats.includes("defi")) return "🏦";
  if (cats.includes("nft")) return "🎨";
  if (cats.includes("trading") || cats.includes("market")) return "📈";
  if (cats.includes("regulation") || cats.includes("legal")) return "⚖️";
  if (cats.includes("mining")) return "⛏️";
  if (cats.includes("technology") || cats.includes("tech")) return "⚡";
  return "🌐";
}

interface ImagePlaceholderProps {
  article: NewsArticle;
  className?: string;
}

function ImagePlaceholder({ article, className = "" }: ImagePlaceholderProps) {
  const hue = sourceHue(article.source);
  const hue2 = (hue + 40) % 360;
  const icon = categoryIcon(article.categories);
  const initials = article.source.split(/[\s.]/)[0].slice(0, 4).toUpperCase();

  return (
    <div
      className={`h-full w-full flex flex-col items-center justify-center gap-2 select-none ${className}`}
      style={{
        background: `linear-gradient(135deg, hsl(${hue},65%,22%) 0%, hsl(${hue2},55%,16%) 100%)`,
      }}
    >
      {/* Subtle dot-grid texture */}
      <div
        aria-hidden="true"
        className="absolute inset-0 opacity-10"
        style={{
          backgroundImage: `radial-gradient(circle, hsl(${hue},80%,70%) 1px, transparent 1px)`,
          backgroundSize: "18px 18px",
        }}
      />
      <span
        className="relative text-3xl leading-none"
        role="img"
        aria-label="category icon"
      >
        {icon}
      </span>
      <span
        className="relative font-bold tracking-widest text-xs px-2 py-0.5 rounded"
        style={{
          color: `hsl(${hue},80%,80%)`,
          background: `hsl(${hue},50%,12%)`,
          letterSpacing: "0.15em",
        }}
      >
        {initials}
      </span>
    </div>
  );
}

export default function CryptoNews() {
  const { data: newsList, loading, error } = useCryptoNews();
  const [activeCategory, setActiveCategory] = useState("all");
  const [search, setSearch] = useState("");
  const [brokenImages, setBrokenImages] = useState<Set<string>>(new Set());

  const markBroken = useCallback((id: string) => {
    setBrokenImages((prev) => new Set(prev).add(id));
  }, []);

  const filtered = useMemo(() => {
    let list = newsList;
    if (activeCategory !== "all") {
      list = list.filter((a) => matchesCategory(a, activeCategory));
    }
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      list = list.filter((a) => a.title.toLowerCase().includes(q));
    }
    return list;
  }, [newsList, activeCategory, search]);

  const [hero, ...rest] = filtered;

  return (
    <div className="container mx-auto max-w-7xl px-4 pt-6 pb-12">
      <title>Crypto News — Solis</title>
      <h1 className="mb-1 text-3xl font-bold">Crypto News</h1>
      <p className="text-base-content/60 text-sm mb-5">
        Latest headlines from the crypto world &bull; Updated in real time
      </p>

      {/* Category tabs */}
      <div className="flex flex-wrap gap-2 mb-4">
        {CATEGORIES.map(({ label, key }) => (
          <button
            key={key}
            className={`btn btn-sm rounded-full ${
              activeCategory === key ? "btn-primary" : "btn-outline"
            }`}
            onClick={() => setActiveCategory(key)}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Search bar */}
      <div className="mb-6">
        <label htmlFor="news-search" className="sr-only">
          Search news
        </label>
        <input
          id="news-search"
          type="search"
          className="input input-bordered w-full max-w-md"
          placeholder="Search headlines\u2026"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {error && (
        <div className="alert alert-error mb-6" role="alert">
          <span>Failed to load news: {error}</span>
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-16">
          <span className="loading loading-spinner loading-lg text-primary" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="py-16 text-center text-base-content/60">
          <p className="text-4xl mb-4">📰</p>
          <p>
            No news found
            {search ? ` for "${search}"` : " in this category"}.
          </p>
        </div>
      ) : (
        <>
          {/* Hero featured article */}
          {hero && (
            <a
              href={hero.url}
              target="_blank"
              rel="noopener noreferrer"
              className="block mb-8 card bg-base-100 shadow-lg hover:shadow-xl transition-shadow overflow-hidden"
            >
              <div className="lg:flex">
                <figure className="relative lg:w-2/5 h-56 lg:h-auto overflow-hidden shrink-0">
                  {hero.imageurl && !brokenImages.has(hero.id) ? (
                    <img
                      src={hero.imageurl}
                      alt={hero.title}
                      className="h-full w-full object-cover"
                      loading="eager"
                      onError={() => markBroken(hero.id)}
                    />
                  ) : (
                    <ImagePlaceholder article={hero} />
                  )}
                </figure>
                <div className="card-body lg:w-3/5 p-6">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="badge badge-primary badge-sm">
                      Featured
                    </span>
                    {isHot() && (
                      <span className="badge badge-warning badge-sm">
                        🔥 Hot
                      </span>
                    )}
                  </div>
                  <h2 className="text-xl font-bold leading-snug mb-3">
                    {hero.title}
                  </h2>
                  <p className="text-base-content/70 text-sm mb-4 line-clamp-3">
                    {truncate(hero.body, 300)}
                  </p>
                  <div className="flex items-center gap-3 text-xs text-base-content/60">
                    <span className="font-medium badge badge-outline badge-sm">
                      {hero.source}
                    </span>
                    <span>&bull;</span>
                    <span>{timeAgo(hero.published_on)}</span>
                  </div>
                </div>
              </div>
            </a>
          )}

          {/* Article grid */}
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {rest.map((article) => (
              <a
                key={article.id}
                href={article.url}
                target="_blank"
                rel="noopener noreferrer"
                className="card bg-base-100 shadow hover:shadow-lg transition-shadow overflow-hidden group"
              >
                <figure className="relative h-44 overflow-hidden shrink-0">
                  {article.imageurl && !brokenImages.has(article.id) ? (
                    <img
                      src={article.imageurl}
                      alt={article.title}
                      className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-300"
                      loading="lazy"
                      onError={() => markBroken(article.id)}
                    />
                  ) : (
                    <ImagePlaceholder
                      article={article}
                      className="group-hover:brightness-110 transition-all duration-300"
                    />
                  )}
                </figure>
                <div className="card-body p-4">
                  {isHot() && (
                    <span className="badge badge-warning badge-xs mb-1">
                      🔥 Hot
                    </span>
                  )}
                  <h3 className="card-title text-sm font-semibold line-clamp-2 leading-snug">
                    {article.title}
                  </h3>
                  <p className="text-xs text-base-content/60 mt-1 line-clamp-2">
                    {truncate(article.body, 120)}
                  </p>
                  <div className="flex items-center justify-between mt-3 text-xs text-base-content/50">
                    <span className="font-medium badge badge-ghost badge-xs">
                      {article.source}
                    </span>
                    <span>{timeAgo(article.published_on)}</span>
                  </div>
                </div>
              </a>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
