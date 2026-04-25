import { renderHook, act } from "@testing-library/react";
import { beforeEach, describe, expect, it } from "vitest";
import { useWatchlist } from "../useWatchlist";

const STORAGE_KEY = "solis_watchlist";

beforeEach(() => {
  localStorage.clear();
});

describe("useWatchlist", () => {
  it("starts with an empty watchlist when localStorage is empty", () => {
    const { result } = renderHook(() => useWatchlist());
    expect(result.current.watchlist).toEqual([]);
  });

  it("loads an existing watchlist from localStorage", () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(["btc", "eth"]));
    const { result } = renderHook(() => useWatchlist());
    expect(result.current.watchlist).toEqual(["btc", "eth"]);
  });

  it("addToWatchlist adds a new id", () => {
    const { result } = renderHook(() => useWatchlist());
    act(() => result.current.addToWatchlist("btc"));
    expect(result.current.watchlist).toContain("btc");
  });

  it("addToWatchlist does not add duplicates", () => {
    const { result } = renderHook(() => useWatchlist());
    act(() => result.current.addToWatchlist("btc"));
    act(() => result.current.addToWatchlist("btc"));
    expect(result.current.watchlist.filter((id) => id === "btc")).toHaveLength(
      1,
    );
  });

  it("removeFromWatchlist removes an existing id", () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(["btc", "eth"]));
    const { result } = renderHook(() => useWatchlist());
    act(() => result.current.removeFromWatchlist("btc"));
    expect(result.current.watchlist).not.toContain("btc");
    expect(result.current.watchlist).toContain("eth");
  });

  it("toggleWatchlist adds when not present", () => {
    const { result } = renderHook(() => useWatchlist());
    act(() => result.current.toggleWatchlist("sol"));
    expect(result.current.watchlist).toContain("sol");
  });

  it("toggleWatchlist removes when already present", () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(["sol"]));
    const { result } = renderHook(() => useWatchlist());
    act(() => result.current.toggleWatchlist("sol"));
    expect(result.current.watchlist).not.toContain("sol");
  });

  it("isWatched returns true for a watched id", () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(["eth"]));
    const { result } = renderHook(() => useWatchlist());
    expect(result.current.isWatched("eth")).toBe(true);
  });

  it("isWatched returns false for an unwatched id", () => {
    const { result } = renderHook(() => useWatchlist());
    expect(result.current.isWatched("unknown")).toBe(false);
  });

  it("persists changes to localStorage", () => {
    const { result } = renderHook(() => useWatchlist());
    act(() => result.current.addToWatchlist("doge"));
    const stored = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "[]");
    expect(stored).toContain("doge");
  });

  it("returns an empty watchlist when localStorage contains invalid JSON", () => {
    localStorage.setItem(STORAGE_KEY, "not-json");
    const { result } = renderHook(() => useWatchlist());
    expect(result.current.watchlist).toEqual([]);
  });
});
