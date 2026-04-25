import { render, screen, waitFor, act } from "@testing-library/react";
import { describe, expect, it, vi, beforeEach } from "vitest";
import React from "react";
import { PostsProvider, usePosts } from "../PostsContext";

// ─── Mock Supabase ────────────────────────────────────────────────────────────
// Path is relative to THIS test file: ../../lib/supabase
vi.mock("../../lib/supabase", () => {
  const single = vi.fn();
  const order = vi.fn();
  const eq = vi.fn(() => ({ select: () => ({ single }), single }));
  const select = vi.fn(() => ({ order, single }));
  const insert = vi.fn(() => ({ select: () => ({ single }) }));
  const update = vi.fn(() => ({ eq }));
  const del = vi.fn(() => ({ eq: vi.fn().mockResolvedValue({ error: null }) }));

  return {
    supabase: {
      from: vi.fn(() => ({
        select,
        insert,
        update,
        delete: del,
      })),
      _mocks: { single, order, eq, select, insert, update, del },
    },
  };
});

// Helper to grab the internal mocks without importing supabase directly
async function getMocks() {
  const { supabase } = await import("../../lib/supabase");
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (supabase as any)._mocks as {
    single: ReturnType<typeof vi.fn>;
    order: ReturnType<typeof vi.fn>;
    eq: ReturnType<typeof vi.fn>;
    select: ReturnType<typeof vi.fn>;
    insert: ReturnType<typeof vi.fn>;
    update: ReturnType<typeof vi.fn>;
    del: ReturnType<typeof vi.fn>;
  };
}

// ─── Helper component ─────────────────────────────────────────────────────────
function Consumer({
  onReady,
}: {
  onReady: (ctx: ReturnType<typeof usePosts>) => void;
}) {
  const ctx = usePosts();
  React.useEffect(() => {
    if (!ctx.loading) onReady(ctx);
  }, [ctx, onReady]);
  return (
    <div>
      <span data-testid="loading">{ctx.loading ? "loading" : "done"}</span>
      <span data-testid="error">{ctx.error ?? ""}</span>
      <span data-testid="count">{ctx.posts.length}</span>
    </div>
  );
}

function renderWithProvider(
  onReady: (ctx: ReturnType<typeof usePosts>) => void = () => {},
) {
  return render(
    <PostsProvider>
      <Consumer onReady={onReady} />
    </PostsProvider>,
  );
}

// ─── Tests ────────────────────────────────────────────────────────────────────
describe("PostsContext", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("fetches posts on mount and displays them", async () => {
    const mocks = await getMocks();
    const fakePosts = [
      {
        id: 1,
        title: "Hello",
        content: "World",
        upvotes: 0,
        comments: [],
        created_at: new Date().toISOString(),
      },
    ];
    mocks.order.mockResolvedValueOnce({ data: fakePosts, error: null });

    renderWithProvider();
    expect(screen.getByTestId("loading").textContent).toBe("loading");

    await waitFor(() =>
      expect(screen.getByTestId("loading").textContent).toBe("done"),
    );
    expect(screen.getByTestId("count").textContent).toBe("1");
    expect(screen.getByTestId("error").textContent).toBe("");
  });

  it("sets error when fetch fails", async () => {
    const mocks = await getMocks();
    mocks.order.mockResolvedValueOnce({
      data: null,
      error: { message: "fetch failed" },
    });

    renderWithProvider();

    await waitFor(() =>
      expect(screen.getByTestId("error").textContent).toBe("fetch failed"),
    );
  });

  it("addToWatchlist clears a previous error before a new createPost", async () => {
    const mocks = await getMocks();
    // Initial fetch returns no posts
    mocks.order.mockResolvedValueOnce({ data: [], error: null });
    // updatePost fails first
    mocks.single.mockResolvedValueOnce({
      data: null,
      error: { message: "update error" },
    });

    let capturedCtx: ReturnType<typeof usePosts> | null = null;
    renderWithProvider((ctx) => {
      capturedCtx = ctx;
    });

    await waitFor(() =>
      expect(screen.getByTestId("loading").textContent).toBe("done"),
    );

    // Trigger a failed updatePost to set the error
    await act(async () => {
      try {
        await capturedCtx!.updatePost({
          id: 99,
          title: "x",
          content: "x",
          upvotes: 0,
          comments: [],
          created_at: "",
          image_url: null,
          tag: "Discussion",
        });
      } catch { /* expected */ }
    });
    expect(screen.getByTestId("error").textContent).toBe("update error");

    // createPost should clear the error even if it then fails itself
    mocks.single.mockResolvedValueOnce({
      data: null,
      error: { message: "create error" },
    });
    await act(async () => {
      try {
        await capturedCtx!.createPost({
          title: "New",
          content: "Post",
          image_url: null,
          tag: "Discussion",
          comments: [],
        });
      } catch { /* expected */ }
    });
    // The error is now from createPost, not the old updatePost error
    expect(screen.getByTestId("error").textContent).toBe("create error");
  });

  it("throws when usePosts is used outside PostsProvider", () => {
    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    expect(() => render(<Consumer onReady={() => {}} />)).toThrow(
      "usePosts must be used inside <PostsProvider>",
    );
    consoleSpy.mockRestore();
  });
});
