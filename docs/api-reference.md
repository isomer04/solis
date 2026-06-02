# API Reference

solis consumes three public APIs. All calls are made from the browser — no backend proxy is required.

---

## CoinGecko

Base URL: `https://api.coingecko.com/api/v3`

| Hook | Endpoint | Description |
| ---- | -------- | ----------- |
| `useTopCoins` | `GET /coins/markets` | Top 100 coins by market cap (USD, page 1) |
| `useCoinDetail` | `GET /coins/{id}` | Full coin metadata including description and links |
| `useCoinHistory` | `GET /coins/{id}/market_chart` | OHLCV history — `days` param drives timeframe selector |

All hooks use an `AbortController` to cancel in-flight requests on component unmount.

---

## CryptoCompare

Base URL: `https://min-api.cryptocompare.com/data`

| Hook / Component | Endpoint | Description |
| ---------------- | -------- | ----------- |
| `PriceTicker` | `GET /pricemultifull` | Multi-symbol full price data for the ticker banner |
| `MarketOverviewCards` | `GET /pricemultifull` | BTC / ETH / BNB overview cards |
| Portfolio page | `GET /histoday` | Daily historical data for portfolio chart |
| Converter | `GET /price` | Single price lookup for the currency converter |

Requires `VITE_APP_API_KEY_CRYPTO` — see [configuration.md](./configuration.md).

---

## RSS2JSON (News)

Base URL: `https://api.rss2json.com/v1/api.json`

Used by `useCryptoNews`. Proxies RSS feeds from CoinTelegraph, CoinDesk, and Decrypt into JSON. No API key required on the free tier.

Query params passed: `rss_url`, `api_key` (optional), `count`.
