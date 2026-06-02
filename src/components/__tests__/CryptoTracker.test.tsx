import { render, screen, fireEvent } from "@testing-library/react";
import { describe, expect, it, vi, beforeEach } from "vitest";
import { MemoryRouter } from "react-router-dom";
import CryptoTracker from "../CryptoTracker";
import type { TopCoin } from "../../types";

// ─── Mock hooks ───────────────────────────────────────────────────────────────
vi.mock("../../hooks/useTopCoins");
vi.mock("../../hooks/useWatchlist");

import { useTopCoins } from "../../hooks/useTopCoins";
import { useWatchlist } from "../../hooks/useWatchlist";

const mockUseTopCoins = vi.mocked(useTopCoins);
const mockUseWatchlist = vi.mocked(useWatchlist);

// ─── Fixtures ─────────────────────────────────────────────────────────────────
function makeCoin(
  overrides: Partial<TopCoin> & Pick<TopCoin, "id" | "symbol" | "name">,
): TopCoin {
  return {
    image: "https://example.com/coin.png",
    current_price: 100,
    market_cap: 1_000_000_000,
    market_cap_rank: 1,
    total_volume: 50_000_000,
    high_24h: 110,
    low_24h: 90,
    price_change_percentage_24h: 2.5,
    price_change_percentage_7d_in_currency: 5,
    circulating_supply: 10_000_000,
    total_supply: null,
    max_supply: null,
    ath: 200,
    ath_change_percentage: -50,
    ath_date: "2021-01-01",
    atl: 10,
    sparkline_in_7d: { price: [] },
    ...overrides,
  };
}

const COINS: TopCoin[] = [
  makeCoin({
    id: "bitcoin",
    symbol: "btc",
    name: "Bitcoin",
    market_cap_rank: 1,
    current_price: 60000,
    market_cap: 1_200_000_000_000,
    total_volume: 30_000_000_000,
    price_change_percentage_24h: 1.5,
  }),
  makeCoin({
    id: "ethereum",
    symbol: "eth",
    name: "Ethereum",
    market_cap_rank: 2,
    current_price: 3000,
    market_cap: 360_000_000_000,
    total_volume: 15_000_000_000,
    price_change_percentage_24h: -2.1,
  }),
  makeCoin({
    id: "solana",
    symbol: "sol",
    name: "Solana",
    market_cap_rank: 3,
    current_price: 150,
    market_cap: 60_000_000_000,
    total_volume: 5_000_000_000,
    price_change_percentage_24h: 4.8,
  }),
];

// ─── Default mock state ───────────────────────────────────────────────────────
const defaultWatchlist = {
  watchlist: [] as string[],
  addToWatchlist: vi.fn(),
  removeFromWatchlist: vi.fn(),
  toggleWatchlist: vi.fn(),
  isWatched: vi.fn(() => false),
};

function renderTracker() {
  return render(
    <MemoryRouter>
      <CryptoTracker />
    </MemoryRouter>,
  );
}

beforeEach(() => {
  vi.clearAllMocks();
  mockUseTopCoins.mockReturnValue({ data: COINS, loading: false, error: null });
  mockUseWatchlist.mockReturnValue({ ...defaultWatchlist });
});

// ─── Rendering ────────────────────────────────────────────────────────────────
describe("CryptoTracker rendering", () => {
  it("renders all coin names", () => {
    renderTracker();
    expect(screen.getByText("Bitcoin")).toBeInTheDocument();
    expect(screen.getByText("Ethereum")).toBeInTheDocument();
    expect(screen.getByText("Solana")).toBeInTheDocument();
  });

  it("shows skeleton rows while loading", () => {
    mockUseTopCoins.mockReturnValue({ data: [], loading: true, error: null });
    renderTracker();
    // No coin names should be visible
    expect(screen.queryByText("Bitcoin")).not.toBeInTheDocument();
  });

  it("shows an error alert when fetch fails", () => {
    mockUseTopCoins.mockReturnValue({
      data: [],
      loading: false,
      error: "CoinGecko: HTTP 429",
    });
    renderTracker();
    expect(screen.getByRole("alert")).toHaveTextContent("CoinGecko: HTTP 429");
  });
});

// ─── Search filter ────────────────────────────────────────────────────────────
describe("search filtering", () => {
  it("filters by coin name", () => {
    renderTracker();
    fireEvent.change(screen.getByRole("searchbox"), {
      target: { value: "bit" },
    });
    expect(screen.getByText("Bitcoin")).toBeInTheDocument();
    expect(screen.queryByText("Ethereum")).not.toBeInTheDocument();
    expect(screen.queryByText("Solana")).not.toBeInTheDocument();
  });

  it("filters by symbol (case-insensitive)", () => {
    renderTracker();
    fireEvent.change(screen.getByRole("searchbox"), {
      target: { value: "ETH" },
    });
    expect(screen.getByText("Ethereum")).toBeInTheDocument();
    expect(screen.queryByText("Bitcoin")).not.toBeInTheDocument();
  });

  it("shows empty state when no coins match", () => {
    renderTracker();
    fireEvent.change(screen.getByRole("searchbox"), {
      target: { value: "zzz" },
    });
    expect(screen.getByText(/No coins found.*"zzz"/)).toBeInTheDocument();
  });
});

// ─── Sorting ──────────────────────────────────────────────────────────────────
describe("sorting", () => {
  it("sorts by price descending on first click", () => {
    renderTracker();
    fireEvent.click(screen.getByText(/Price/));
    const rows = screen.getAllByRole("row").slice(1); // skip header
    // Bitcoin ($60,000) should come first
    expect(rows[0]).toHaveTextContent("Bitcoin");
  });

  it("reverses sort direction on second click", () => {
    renderTracker();
    fireEvent.click(screen.getByText(/Price/));
    fireEvent.click(screen.getByText(/Price/));
    const rows = screen.getAllByRole("row").slice(1);
    // Solana ($150) should now be first (ascending)
    expect(rows[0]).toHaveTextContent("Solana");
  });

  it("sorts by 24h % descending on first click", () => {
    renderTracker();
    fireEvent.click(screen.getByText(/24h %/));
    const rows = screen.getAllByRole("row").slice(1);
    // Solana (4.8%) should come first
    expect(rows[0]).toHaveTextContent("Solana");
  });
});

// ─── Watchlist tab ────────────────────────────────────────────────────────────
describe("watchlist tab", () => {
  it("shows empty state when watchlist is empty", () => {
    renderTracker();
    // Use the tab's unique text (★ + "Watchlist" not present in star button aria-labels)
    fireEvent.click(screen.getByText(/★ Watchlist/));
    expect(screen.getByText(/Your watchlist is empty/)).toBeInTheDocument();
  });

  it("shows only watched coins", () => {
    mockUseWatchlist.mockReturnValue({
      ...defaultWatchlist,
      watchlist: ["ethereum"],
      isWatched: (id: string) => id === "ethereum",
    });
    renderTracker();
    fireEvent.click(screen.getByText(/★ Watchlist/));
    expect(screen.getByText("Ethereum")).toBeInTheDocument();
    expect(screen.queryByText("Bitcoin")).not.toBeInTheDocument();
    expect(screen.queryByText("Solana")).not.toBeInTheDocument();
  });

  it("shows watchlist count in tab label", () => {
    mockUseWatchlist.mockReturnValue({
      ...defaultWatchlist,
      watchlist: ["btc", "eth"],
      isWatched: (id: string) => ["btc", "eth"].includes(id),
    });
    renderTracker();
    expect(screen.getByText("★ Watchlist (2)")).toBeInTheDocument();
  });
});

// ─── Watchlist toggle ─────────────────────────────────────────────────────────
describe("watchlist toggle", () => {
  it("calls toggleWatchlist with the coin symbol when star is clicked", () => {
    const toggleWatchlist = vi.fn();
    mockUseWatchlist.mockReturnValue({ ...defaultWatchlist, toggleWatchlist });
    renderTracker();
    const starBtn = screen.getByRole("button", {
      name: /Add Bitcoin to watchlist/i,
    });
    fireEvent.click(starBtn);
    expect(toggleWatchlist).toHaveBeenCalledWith("bitcoin");
  });

  it("shows filled star for watched coins", () => {
    mockUseWatchlist.mockReturnValue({
      ...defaultWatchlist,
      watchlist: ["bitcoin"],
      isWatched: (id: string) => id === "bitcoin",
    });
    renderTracker();
    expect(
      screen.getByRole("button", { name: /Remove Bitcoin from watchlist/i }),
    ).toBeInTheDocument();
  });
});

// ─── Pagination ───────────────────────────────────────────────────────────────
describe("pagination", () => {
  it("previous button is disabled on page 1", () => {
    renderTracker();
    expect(screen.getByRole("button", { name: "«" })).toBeDisabled();
  });

  it("next button is disabled when fewer than 100 coins are returned", () => {
    // COINS fixture has 3 items (< 100)
    renderTracker();
    expect(screen.getByRole("button", { name: "»" })).toBeDisabled();
  });

  it("next button is enabled when exactly 100 coins are returned", () => {
    const hundredCoins = Array.from({ length: 100 }, (_, i) =>
      makeCoin({
        id: `coin-${i}`,
        symbol: `c${i}`,
        name: `Coin ${i}`,
        market_cap_rank: i + 1,
      }),
    );
    mockUseTopCoins.mockReturnValue({
      data: hundredCoins,
      loading: false,
      error: null,
    });
    renderTracker();
    expect(screen.getByRole("button", { name: "»" })).not.toBeDisabled();
  });

  it("pagination is hidden in watchlist tab", () => {
    renderTracker();
    fireEvent.click(screen.getByText(/★ Watchlist/));
    expect(screen.queryByRole("button", { name: "«" })).not.toBeInTheDocument();
  });

  it("pagination is hidden when search is active", () => {
    renderTracker();
    fireEvent.change(screen.getByRole("searchbox"), {
      target: { value: "bit" },
    });
    expect(screen.queryByRole("button", { name: "«" })).not.toBeInTheDocument();
  });
});
