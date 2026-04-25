import { useEffect, useState } from "react";
import { getErrorMessage } from "../lib/getErrorMessage";
import type { NewsArticle } from "../types";

// Free RSS feeds via rss2json — no API key, no count param (free tier restriction)
const RSS_FEEDS: { url: string; source: string }[] = [
  {
    url: "https://api.rss2json.com/v1/api.json?rss_url=https%3A%2F%2Fcointelegraph.com%2Frss",
    source: "CoinTelegraph",
  },
  {
    url: "https://api.rss2json.com/v1/api.json?rss_url=https%3A%2F%2Fwww.coindesk.com%2Farc%2Foutboundfeeds%2Frss%2F",
    source: "CoinDesk",
  },
  {
    url: "https://api.rss2json.com/v1/api.json?rss_url=https%3A%2F%2Fdecrypt.co%2Ffeed",
    source: "Decrypt",
  },
];

// Reflects the actual RSS2JSON API response — thumbnail can be absent or null
interface RssItem {
  title: string;
  pubDate: string;
  link: string;
  description: string;
  thumbnail?: string | null;
  author?: string;
}

// Typed shape of the RSS2JSON API response
interface Rss2JsonResponse {
  status: "ok" | "error";
  items: RssItem[];
}

// Regex constants at module scope to avoid re-creation on every call
const BTC_RE = /\bbtc\b/i;
const ETH_RE = /\beth\b/i;

function stripHtml(html: string): string {
  return html.replace(/<[^>]*>/g, "").trim();
}

function inferCategories(title: string): string {
  const t = title.toLowerCase();
  const cats: string[] = [];
  if (t.includes("bitcoin") || BTC_RE.test(t)) cats.push("BTC");
  if (t.includes("ethereum") || ETH_RE.test(t)) cats.push("ETH");
  if (t.includes("defi") || t.includes("decentralized finance"))
    cats.push("DeFi");
  if (t.includes("nft")) cats.push("NFT");
  if (t.includes("trading") || t.includes(" trade ")) cats.push("Trading");
  return cats.join(",");
}

function safeTimestamp(pubDate: string): number {
  const ts = new Date(pubDate).getTime();
  // Guard against Invalid Date producing NaN
  return Number.isFinite(ts) ? Math.floor(ts / 1000) : 0;
}

function toNewsArticle(source: string) {
  return (item: RssItem): NewsArticle => ({
    id: item.link,
    title: item.title,
    body: stripHtml(item.description),
    url: item.link,
    // thumbnail can be null/undefined from the API — fall back to empty string
    imageurl: item.thumbnail ?? "",
    source,
    published_on: safeTimestamp(item.pubDate),
    categories: inferCategories(item.title),
  });
}

export interface UseCryptoNewsResult {
  data: NewsArticle[];
  loading: boolean;
  error: string | null;
}

export function useCryptoNews(): UseCryptoNewsResult {
  const [data, setData] = useState<NewsArticle[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const controller = new AbortController();

    async function fetchNews(): Promise<void> {
      try {
        const results = await Promise.allSettled(
          RSS_FEEDS.map(({ url, source }) =>
            fetch(url, { signal: controller.signal })
              .then((r) => r.json())
              .then((json: Rss2JsonResponse) =>
                json.status === "ok" && Array.isArray(json.items)
                  ? json.items.map(toNewsArticle(source))
                  : [],
              ),
          ),
        );

        const articles = results
          .filter(
            (r): r is PromiseFulfilledResult<NewsArticle[]> =>
              r.status === "fulfilled",
          )
          .flatMap((r) => r.value)
          .sort((a, b) => b.published_on - a.published_on);

        if (articles.length === 0)
          throw new Error("No news articles could be loaded");
        setData(articles);
      } catch (err) {
        if (!controller.signal.aborted) {
          setError(getErrorMessage(err));
        }
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }

    void fetchNews();
    return () => controller.abort();
  }, []);

  return { data, loading, error };
}
