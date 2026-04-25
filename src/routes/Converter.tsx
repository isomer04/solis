import { useEffect, useState } from "react";
import { getErrorMessage } from "../lib/getErrorMessage";

// vite-env.d.ts types this as string — no `as string` cast needed
const CC_API_KEY = import.meta.env.VITE_APP_API_KEY;

const POPULAR = [
  "BTC",
  "ETH",
  "BNB",
  "SOL",
  "XRP",
  "USDT",
  "USDC",
  "ADA",
  "DOGE",
  "AVAX",
  "DOT",
  "LINK",
  "TRX",
  "MATIC",
  "LTC",
  "UNI",
  "ATOM",
  "ETC",
  "XLM",
  "NEAR",
  "EUR",
  "GBP",
  "JPY",
];

function fmtResult(n: number): string {
  if (n < 0.001) return n.toPrecision(6);
  if (n < 1) return n.toFixed(6);
  if (n < 1000) return n.toFixed(4);
  return n.toLocaleString(undefined, { maximumFractionDigits: 2 });
}

export default function Converter() {
  const [amount, setAmount] = useState("1");
  const [debouncedAmount, setDebouncedAmount] = useState("1");
  const [from, setFrom] = useState("BTC");
  const [to, setTo] = useState("USD");
  const [result, setResult] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Debounce the amount input by 300ms to avoid firing an API call on every keystroke
  useEffect(() => {
    const id = setTimeout(() => setDebouncedAmount(amount), 300);
    return () => clearTimeout(id);
  }, [amount]);

  useEffect(() => {
    const parsed = parseFloat(debouncedAmount);
    if (!from || !to || isNaN(parsed) || parsed <= 0) {
      setResult(null);
      return;
    }
    if (from === to) {
      setResult(parsed);
      return;
    }

    const controller = new AbortController();
    setLoading(true);
    setError(null);

    fetch(
      `https://min-api.cryptocompare.com/data/price?fsym=${from}&tsyms=${to}&api_key=${CC_API_KEY}`,
      { signal: controller.signal },
    )
      .then((r) => r.json())
      .then((json: Record<string, unknown>) => {
        const rate = json[to];
        if (typeof rate === "number") {
          setResult(rate * parsed);
        } else {
          setError("Pair not found. Check your symbols.");
          setResult(null);
        }
      })
      .catch((err) => {
        if (!controller.signal.aborted) setError(getErrorMessage(err));
      })
      .finally(() => {
        // Only update loading state if the request wasn't cancelled
        if (!controller.signal.aborted) setLoading(false);
      });

    return () => controller.abort();
  }, [debouncedAmount, from, to]);

  function swap() {
    setFrom(to);
    setTo(from);
  }

  return (
    <div className="container mx-auto max-w-md px-4 py-10">
      <title>Crypto Converter — Solis</title>
      <h1 className="text-3xl font-bold mb-2">Crypto Converter</h1>
      <p className="text-base-content/60 text-sm mb-8">
        Convert between any crypto or fiat pair instantly.
      </p>

      <div className="card bg-base-100 shadow-lg">
        <div className="card-body gap-4">
          {/* Amount */}
          <div className="form-control">
            <label
              className="label label-text font-medium"
              htmlFor="conv-amount"
            >
              Amount
            </label>
            <input
              id="conv-amount"
              type="number"
              min="0"
              step="any"
              className="input input-bordered w-full text-lg"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
            />
          </div>

          {/* From / Swap / To */}
          <div className="flex items-end gap-2">
            <div className="form-control flex-1">
              <label
                className="label label-text font-medium"
                htmlFor="conv-from"
              >
                From
              </label>
              <select
                id="conv-from"
                className="select select-bordered w-full"
                value={from}
                onChange={(e) => setFrom(e.target.value)}
              >
                {POPULAR.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>

            <button
              className="btn btn-circle btn-ghost text-xl mb-1"
              aria-label="Swap currencies"
              onClick={swap}
            >
              ⇄
            </button>

            <div className="form-control flex-1">
              <label className="label label-text font-medium" htmlFor="conv-to">
                To
              </label>
              <select
                id="conv-to"
                className="select select-bordered w-full"
                value={to}
                onChange={(e) => setTo(e.target.value)}
              >
                {POPULAR.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Custom symbol inputs */}
          <div className="flex gap-2">
            <div className="form-control flex-1">
              <label
                className="label label-text text-xs"
                htmlFor="conv-custom-from"
              >
                Or type custom symbol (From)
              </label>
              <input
                id="conv-custom-from"
                className="input input-bordered input-sm w-full uppercase"
                placeholder="e.g. ETH"
                value={from}
                onChange={(e) => setFrom(e.target.value.toUpperCase())}
              />
            </div>
            <div className="form-control flex-1">
              <label
                className="label label-text text-xs"
                htmlFor="conv-custom-to"
              >
                Custom symbol (To)
              </label>
              <input
                id="conv-custom-to"
                className="input input-bordered input-sm w-full uppercase"
                placeholder="e.g. GBP"
                value={to}
                onChange={(e) => setTo(e.target.value.toUpperCase())}
              />
            </div>
          </div>

          {/* Result */}
          <div className="rounded-box bg-base-200 p-5 text-center">
            {loading && (
              <span className="loading loading-spinner loading-md text-primary" />
            )}
            {error && !loading && <p className="text-error text-sm">{error}</p>}
            {!loading && !error && result !== null && (
              <>
                <p className="text-3xl font-bold tabular-nums text-primary">
                  {fmtResult(result)} {to}
                </p>
                <p className="text-sm text-base-content/60 mt-1">
                  {debouncedAmount} {from} = {fmtResult(result)} {to}
                </p>
              </>
            )}
            {!loading && !error && result === null && (
              <p className="text-base-content/40">
                Enter an amount to convert.
              </p>
            )}
          </div>

          <p className="text-xs text-base-content/40 text-center">
            Data from CryptoCompare. Rates update automatically.
          </p>
        </div>
      </div>
    </div>
  );
}
