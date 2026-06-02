import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { usePosts } from "../context/PostsContext";
import type { Post } from "../types";

const TAG_COLORS: Record<string, string> = {
  Discussion: "badge-info",
  Analysis: "badge-warning",
  Tutorial: "badge-success",
  News: "badge-primary",
};

type SortType = "created_at" | "upvotes";
type ViewType = "list" | "grid";

function timeAgo(isoString: string): string {
  const ms = Date.now() - Date.parse(isoString);
  const h = Math.floor(ms / 3_600_000);
  const d = Math.floor(ms / 86_400_000);
  const w = Math.floor(ms / 604_800_000);
  if (h < 1) return "Just now";
  if (h < 24) return `${h}h ago`;
  if (d < 7) return `${d}d ago`;
  return `${w}w ago`;
}

function truncate(text: string, max: number): string {
  return text.length > max ? `${text.slice(0, max)}\u2026` : text;
}

function TagBadge({ tag }: { tag?: string }) {
  if (!tag) return null;
  return (
    <span className={`badge badge-xs ${TAG_COLORS[tag] ?? "badge-ghost"}`}>
      {tag}
    </span>
  );
}

export default function PostList() {
  const { posts, loading, error } = usePosts();
  const [sortType, setSortType] = useState<SortType>("created_at");
  const [searchTerm, setSearchTerm] = useState("");
  const [view, setView] = useState<ViewType>("list");

  const sorted = useMemo(
    () =>
      [...posts].sort((a, b) =>
        sortType === "upvotes"
          ? b.upvotes - a.upvotes
          : Date.parse(b.created_at) - Date.parse(a.created_at),
      ),
    [posts, sortType],
  );

  const filtered = useMemo(
    () =>
      sorted.filter((p) =>
        p.title.toLowerCase().includes(searchTerm.toLowerCase()),
      ),
    [sorted, searchTerm],
  );

  // Highest-upvoted post shown as hero (only when not searching)
  const featured = useMemo<Post | null>(
    () =>
      !searchTerm && posts.length > 0
        ? [...posts].sort((a, b) => b.upvotes - a.upvotes)[0]
        : null,
    [posts, searchTerm],
  );

  const listToRender = useMemo(
    () =>
      featured && !searchTerm
        ? filtered.filter((p) => p.id !== featured.id)
        : filtered,
    [filtered, featured, searchTerm],
  );

  return (
    <div className="container mx-auto max-w-4xl px-4 pt-6 pb-12">
      {/* Page header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold">Community</h1>
          <p className="text-base-content/60 text-sm mt-1">
            Share insights, analysis, and ideas with fellow traders
          </p>
        </div>
        <Link to="/create" className="btn btn-primary">
          + New Post
        </Link>
      </div>

      {/* Sort + view controls */}
      <div className="flex flex-wrap items-center gap-2 mb-4">
        <button
          className={`btn btn-sm ${sortType === "created_at" ? "btn-primary" : "btn-outline"}`}
          onClick={() => setSortType("created_at")}
        >
          Newest
        </button>
        <button
          className={`btn btn-sm ${sortType === "upvotes" ? "btn-primary" : "btn-outline"}`}
          onClick={() => setSortType("upvotes")}
        >
          Top
        </button>
        <div className="ml-auto flex gap-1">
          <button
            aria-label="List view"
            title="List view"
            className={`btn btn-sm btn-square ${view === "list" ? "btn-primary" : "btn-ghost"}`}
            onClick={() => setView("list")}
          >
            &#9776;
          </button>
          <button
            aria-label="Grid view"
            title="Grid view"
            className={`btn btn-sm btn-square ${view === "grid" ? "btn-primary" : "btn-ghost"}`}
            onClick={() => setView("grid")}
          >
            &#8862;
          </button>
        </div>
      </div>

      {/* Search */}
      <label htmlFor="post-search" className="sr-only">
        Search posts
      </label>
      <input
        id="post-search"
        type="search"
        className="input input-bordered w-full mb-6"
        placeholder="Search posts..."
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
      />

      {error && (
        <div className="alert alert-error mb-4" role="alert">
          <span>Failed to load posts: {error}</span>
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-16">
          <span className="loading loading-spinner loading-lg text-primary" />
        </div>
      ) : posts.length === 0 ? (
        <div className="py-16 text-center text-base-content/60">
          <p className="text-5xl mb-4">&#9997;</p>
          <h2 className="text-xl font-semibold mb-2">No posts yet</h2>
          <p className="mb-4">Be the first to share your crypto insights!</p>
          <Link to="/create" className="btn btn-primary">
            Create First Post
          </Link>
        </div>
      ) : (
        <>
          {/* Featured top post */}
          {featured && !searchTerm && (
            <div className="mb-6">
              <p className="text-xs font-semibold text-primary uppercase tracking-wider mb-2">
                &#127942; Top Post
              </p>
              <Link
                to={`/post/${featured.id}`}
                className="card bg-base-100 shadow-md hover:shadow-lg transition-shadow border-l-4 border-warning block"
              >
                <div className="card-body py-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <TagBadge tag={featured.tag} />
                        <span className="text-xs text-base-content/60">
                          {timeAgo(featured.created_at)}
                        </span>
                      </div>
                      <h2 className="font-bold text-lg leading-snug">
                        {featured.title}
                      </h2>
                      <p className="text-sm text-base-content/70 mt-1 line-clamp-2">
                        {truncate(featured.content, 200)}
                      </p>
                    </div>
                    {featured.image_url && (
                      <img
                        src={featured.image_url}
                        alt={featured.title}
                        className="w-20 h-16 object-cover rounded-box shrink-0"
                      />
                    )}
                  </div>
                  <div className="flex items-center gap-1 mt-2 text-sm text-base-content/70">
                    <span>&#128077;</span>
                    <span className="font-medium">{featured.upvotes}</span>
                    <span>{featured.upvotes === 1 ? "upvote" : "upvotes"}</span>
                  </div>
                </div>
              </Link>
            </div>
          )}

          {filtered.length === 0 && searchTerm ? (
            <div className="py-8 text-center text-base-content/60">
              No posts found for &ldquo;{searchTerm}&rdquo;
            </div>
          ) : listToRender.length === 0 &&
            featured &&
            !searchTerm ? null : view === "list" ? (
            <ul className="space-y-3">
              {listToRender.map((post) => (
                <li
                  key={post.id}
                  className="card bg-base-100 shadow-sm hover:shadow-md transition-shadow border-l-4 border-primary"
                >
                  <div className="card-body py-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <TagBadge tag={post.tag} />
                          <span className="text-xs text-base-content/60">
                            {timeAgo(post.created_at)}
                          </span>
                        </div>
                        <Link
                          to={`/post/${post.id}`}
                          className="text-base font-semibold hover:text-primary transition-colors"
                        >
                          {post.title}
                        </Link>
                        <p className="text-sm text-base-content/60 mt-1 line-clamp-1">
                          {truncate(post.content, 100)}
                        </p>
                      </div>
                      {post.image_url && (
                        <img
                          src={post.image_url}
                          alt={post.title}
                          className="w-16 h-12 object-cover rounded-box shrink-0"
                        />
                      )}
                    </div>
                    <div className="flex items-center gap-1 mt-1 text-sm text-base-content/70">
                      <span>&#128077;</span>
                      <span>{post.upvotes}</span>
                      <span>{post.upvotes === 1 ? "upvote" : "upvotes"}</span>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2">
              {listToRender.map((post) => (
                <Link
                  key={post.id}
                  to={`/post/${post.id}`}
                  className="card bg-base-100 shadow hover:shadow-lg transition-shadow"
                >
                  {post.image_url && (
                    <figure className="h-36 overflow-hidden">
                      <img
                        src={post.image_url}
                        alt={post.title}
                        className="h-full w-full object-cover"
                        loading="lazy"
                      />
                    </figure>
                  )}
                  <div className="card-body py-3 px-4">
                    <div className="flex items-center gap-2 mb-1">
                      <TagBadge tag={post.tag} />
                      <span className="text-xs text-base-content/60">
                        {timeAgo(post.created_at)}
                      </span>
                    </div>
                    <h3 className="font-semibold text-sm line-clamp-2">
                      {post.title}
                    </h3>
                    <p className="text-xs text-base-content/60 line-clamp-2 mt-1">
                      {truncate(post.content, 100)}
                    </p>
                    <div className="flex items-center gap-1 mt-2 text-xs text-base-content/70">
                      <span>&#128077;</span>
                      <span>{post.upvotes}</span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
