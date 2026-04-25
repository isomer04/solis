import { useMemo } from "react";
import { useParams } from "react-router-dom";
import DOMPurify from "dompurify";
import CoinChart from "./CoinChart";
import { useCoinDetail } from "../hooks/useCoinDetail";
import { useWatchlist } from "../hooks/useWatchlist";

export default function CoinDetail() {
  const { symbol = "" } = useParams<{ symbol: string }>();
  const { data, loading, error } = useCoinDetail(symbol);
  const { isWatched, toggleWatchlist } = useWatchlist();

  const coinId = symbol.toLowerCase();
  const watched = isWatched(coinId);

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <span className="loading loading-spinner loading-lg text-primary" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="container mx-auto max-w-3xl px-4 pt-8">
        <div className="alert alert-error" role="alert">
          <span>{error ?? "Failed to load coin details."}</span>
        </div>
      </div>
    );
  }

  const numbers = data.numbers[symbol]?.USD;
  const text = data.textData[symbol];

  if (!numbers || !text) {
    return (
      <div className="container mx-auto max-w-3xl px-4 pt-8">
        <div className="alert alert-warning" role="alert">
          <span>No data found for &ldquo;{symbol}&rdquo;.</span>
        </div>
      </div>
    );
  }

  return (
    <CoinDetailContent
      symbol={symbol}
      numbers={numbers}
      text={text}
      coinId={coinId}
      watched={watched}
      onToggleWatchlist={toggleWatchlist}
    />
  );
}

// Extracted to a separate component so hooks (useMemo) can be called unconditionally
function CoinDetailContent({
  symbol,
  numbers,
  text,
  coinId,
  watched,
  onToggleWatchlist,
}: {
  symbol: string;
  numbers: NonNullable<
    ReturnType<typeof useCoinDetail>["data"]
  >["numbers"][string]["USD"];
  text: NonNullable<
    ReturnType<typeof useCoinDetail>["data"]
  >["textData"][string];
  coinId: string;
  watched: boolean;
  onToggleWatchlist: (id: string) => void;
}) {
  // Memoize expensive sanitization — only re-run when description changes
  const safeDescription = useMemo(
    () => DOMPurify.sanitize(text.Description ?? ""),
    [text.Description],
  );

  // Memoize stats array — only changes when numbers or text change
  const stats = useMemo(
    (): [string, string | null | undefined][] => [
      ["Launch Date", text.AssetLaunchDate],
      ["Monetary Symbol", numbers.FROMSYMBOL],
      ["Market", numbers.MARKET],
      ["Last Updated", numbers.LASTUPDATE],
      ["Price", numbers.PRICE],
      ["Volume (Day)", numbers.VOLUMEDAY],
      ["Today's Open", numbers.OPENDAY],
      ["Day High", numbers.HIGHDAY],
      ["Day Low", numbers.LOWDAY],
      ["Change % (Day)", numbers.CHANGEPCTDAY],
      ["Market Cap", numbers.MKTCAP],
    ],
    [text, numbers],
  );

  return (
    <div className="container mx-auto max-w-4xl px-4 pt-6 pb-12">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <img
          className="h-16 w-16 rounded-full object-cover shadow"
          src={`https://www.cryptocompare.com${numbers.IMAGEURL}`}
          alt={`${symbol} logo`}
          onError={(e) => {
            // Hide broken coin images gracefully
            e.currentTarget.style.display = "none";
          }}
        />
        <div className="flex-1">
          <h1 className="text-3xl font-bold">{text.FullName}</h1>
          <p className="text-base-content/50 text-sm">{symbol}</p>
        </div>
        <button
          onClick={() => onToggleWatchlist(coinId)}
          aria-label={watched ? "Remove from watchlist" : "Add to watchlist"}
          className={`btn btn-circle btn-ghost text-2xl ${watched ? "text-warning" : "text-base-content/30 hover:text-warning"}`}
        >
          {watched ? "★" : "☆"}
        </button>
      </div>

      {/* Description */}
      {safeDescription && (
        <div
          className="prose prose-sm prose-invert max-w-none mb-6"
          dangerouslySetInnerHTML={{ __html: safeDescription }}
        />
      )}

      {/* Stats table */}
      <div className="overflow-x-auto mb-8">
        <table className="table w-full">
          <tbody>
            {stats.map(([label, value]) => (
              <tr key={label}>
                <th className="w-44 font-semibold">{label}</th>
                <td>{value || "\u2014"}</td>
              </tr>
            ))}
            <tr>
              <th className="font-semibold">Website</th>
              <td>
                {text.AssetWebsiteUrl ? (
                  <a
                    href={text.AssetWebsiteUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="link link-primary"
                  >
                    {text.AssetWebsiteUrl}
                  </a>
                ) : (
                  "\u2014"
                )}
              </td>
            </tr>
            <tr>
              <th className="font-semibold">Whitepaper</th>
              <td>
                {text.AssetWhitepaperUrl ? (
                  <a
                    href={text.AssetWhitepaperUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="link link-primary"
                  >
                    {text.AssetWhitepaperUrl}
                  </a>
                ) : (
                  "\u2014"
                )}
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <CoinChart symbol={symbol} market={numbers.MARKET} />
    </div>
  );
}
