import { z } from "zod";

// ─── Post / Blog ─────────────────────────────────────────────────────────────

export const CommentSchema = z.object({
  id: z.string(),
  text: z.string(),
});

export const PostSchema = z.object({
  id: z.number(),
  title: z.string(),
  content: z.string(),
  image_url: z.string().nullable(),
  upvotes: z.number(),
  created_at: z.string(),
  tag: z.string().optional(),
  /** Stored as JSONB in Supabase; normalise with parseComments() before rendering. */
  comments: z.array(z.unknown()),
});

export const NewPostSchema = PostSchema.omit({
  id: true,
  created_at: true,
  upvotes: true,
});

// ─── Crypto Market Data (CryptoCompare) ──────────────────────────────────────

export const CoinListItemSchema = z.object({
  Symbol: z.string(),
  FullName: z.string(),
  ImageUrl: z.string(),
  PlatformType: z.string(),
});

export const CoinListDataSchema = z.object({
  Data: z.record(z.string(), CoinListItemSchema),
});

export const CoinDisplayDataSchema = z.object({
  IMAGEURL: z.string(),
  FROMSYMBOL: z.string(),
  MARKET: z.string(),
  LASTUPDATE: z.string(),
  PRICE: z.string(),
  VOLUMEDAY: z.string(),
  OPENDAY: z.string(),
  HIGHDAY: z.string(),
  LOWDAY: z.string(),
  CHANGEPCTDAY: z.string(),
  MKTCAP: z.string(),
});

export const CoinTextDataSchema = z.object({
  FullName: z.string(),
  Description: z.string(),
  AssetLaunchDate: z.string().nullable(),
  AssetWebsiteUrl: z.string().nullable(),
  AssetWhitepaperUrl: z.string().nullable(),
});

export const CoinFullDetailsSchema = z.object({
  numbers: z.record(z.string(), z.object({ USD: CoinDisplayDataSchema })),
  textData: z.record(z.string(), CoinTextDataSchema),
});

export const HistoricalDataPointSchema = z.object({
  time: z.number(),
  open: z.number(),
  high: z.number(),
  low: z.number(),
  close: z.number(),
  volumeto: z.number(),
});

// ─── CoinGecko ───────────────────────────────────────────────────────────────

const nullNum = z.number().nullable().transform((v) => v ?? 0);

export const TopCoinSchema = z.object({
  id: z.string(),
  symbol: z.string(),
  name: z.string(),
  image: z.string(),
  current_price: nullNum,
  market_cap: nullNum,
  market_cap_rank: nullNum,
  total_volume: nullNum,
  high_24h: nullNum,
  low_24h: nullNum,
  price_change_percentage_24h: nullNum,
  price_change_percentage_7d_in_currency: nullNum,
  circulating_supply: nullNum,
  total_supply: z.number().nullable(),
  max_supply: z.number().nullable(),
  ath: nullNum,
  ath_change_percentage: nullNum,
  ath_date: z.string().nullable().transform((v) => v ?? ""),
  atl: nullNum,
  sparkline_in_7d: z.object({ price: z.array(z.number()) }),
});

export const GlobalMarketDataSchema = z.object({
  total_market_cap_usd: z.number(),
  total_volume_usd: z.number(),
  btc_dominance: z.number(),
  eth_dominance: z.number(),
  market_cap_change_pct_24h: z.number(),
  active_cryptocurrencies: z.number(),
});

export const FearGreedDataSchema = z.object({
  value: z.number(),
  value_classification: z.string(),
});

export const TrendingCoinCoreSchema = z.object({
  id: z.string(),
  name: z.string(),
  symbol: z.string(),
  thumb: z.string(),
  small: z.string(),
  price_btc: z.number(),
  data: z.object({
    price_change_percentage_24h: z.object({ usd: z.number() }),
  }),
});

export const TrendingCoinItemSchema = z.object({
  item: TrendingCoinCoreSchema,
});

// ─── Portfolio ───────────────────────────────────────────────────────────────

export const PortfolioEntrySchema = z.object({
  id: z.string(),
  symbol: z.string(),
  name: z.string(),
  quantity: z.number(),
  buyPrice: z.number(),
  addedAt: z.string(),
});

// ─── News ────────────────────────────────────────────────────────────────────

export const NewsArticleSchema = z.object({
  id: z.string(),
  title: z.string(),
  body: z.string(),
  url: z.string(),
  imageurl: z.string(),
  source: z.string(),
  published_on: z.number(),
  categories: z.string().optional(),
});

// ─── Derived TypeScript types ─────────────────────────────────────────────────

export type Comment = z.infer<typeof CommentSchema>;
export type Post = z.infer<typeof PostSchema>;
export type NewPost = z.infer<typeof NewPostSchema>;
export type CoinListItem = z.infer<typeof CoinListItemSchema>;
export type CoinListData = z.infer<typeof CoinListDataSchema>;
export type CoinDisplayData = z.infer<typeof CoinDisplayDataSchema>;
export type CoinTextData = z.infer<typeof CoinTextDataSchema>;
export type CoinFullDetails = z.infer<typeof CoinFullDetailsSchema>;
export type HistoricalDataPoint = z.infer<typeof HistoricalDataPointSchema>;
export type TopCoin = z.infer<typeof TopCoinSchema>;
export type GlobalMarketData = z.infer<typeof GlobalMarketDataSchema>;
export type FearGreedData = z.infer<typeof FearGreedDataSchema>;
export type TrendingCoinCore = z.infer<typeof TrendingCoinCoreSchema>;
export type TrendingCoinItem = z.infer<typeof TrendingCoinItemSchema>;
export type PortfolioEntry = z.infer<typeof PortfolioEntrySchema>;
export type NewsArticle = z.infer<typeof NewsArticleSchema>;
