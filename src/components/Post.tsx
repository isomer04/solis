import { useMemo, useOptimistic, useReducer, useState, useTransition } from "react";
import { Link, Navigate, useNavigate, useParams } from "react-router-dom";
import { usePosts } from "../context/PostsContext";
import { getErrorMessage } from "../lib/getErrorMessage";
import type { Comment, Post as PostType } from "../types";

function isObjectWithText(v: unknown): v is { id?: unknown; text: unknown } {
  return typeof v === "object" && v !== null && "text" in v;
}

function parseComments(raw: unknown[]): Comment[] {
  return raw.flatMap((item, index) => {
    if (isObjectWithText(item)) {
      return [
        {
          id: typeof item.id === "string" ? item.id : `comment-${index}`,
          text: String(item.text),
        },
      ];
    }
    if (typeof item === "string") {
      try {
        const parsed: { id?: string; text?: string } | null = JSON.parse(item);
        if (parsed?.text)
          return [{ id: parsed.id ?? `comment-${index}`, text: parsed.text }];
      } catch {
        // malformed — skip silently
      }
    }
    return [];
  });
}

// ── UI state reducer ──────────────────────────────────────────────────────────

type PostUI = {
  showEditForm: boolean;
  confirmDelete: boolean;
  isDeleting: boolean;
};

type PostAction =
  | { type: "TOGGLE_EDIT" }
  | { type: "CLOSE_EDIT" }
  | { type: "CONFIRM_DELETE" }
  | { type: "CANCEL_DELETE" }
  | { type: "DELETE_START" }
  | { type: "DELETE_FAIL" };

const initialUI: PostUI = {
  showEditForm: false,
  confirmDelete: false,
  isDeleting: false,
};

function postUIReducer(state: PostUI, action: PostAction): PostUI {
  switch (action.type) {
    case "TOGGLE_EDIT":
      return { ...state, showEditForm: !state.showEditForm };
    case "CLOSE_EDIT":
      return { ...state, showEditForm: false };
    case "CONFIRM_DELETE":
      return { ...state, confirmDelete: true };
    case "CANCEL_DELETE":
      return { ...state, confirmDelete: false };
    case "DELETE_START":
      return { ...state, isDeleting: true };
    case "DELETE_FAIL":
      return { ...state, isDeleting: false, confirmDelete: false };
  }
}

// ── Edit form — owns its own derived state, reset via key prop ────────────────

function EditPostForm({
  post,
  onClose,
  onUpdate,
}: {
  post: PostType;
  onClose: () => void;
  onUpdate: (updated: PostType) => Promise<void>;
}) {
  const [title, setTitle] = useState(post.title);
  const [content, setContent] = useState(post.content);
  const [imageUrl, setImageUrl] = useState(post.image_url ?? "");
  const [fieldError, setFieldError] = useState<string | null>(null);
  const [isUpdating, startUpdateTransition] = useTransition();

  const handleUpdate = (e: React.SyntheticEvent<HTMLFormElement, SubmitEvent>) => {
    e.preventDefault();
    setFieldError(null);
    const trimTitle = title.trim();
    const trimContent = content.trim();
    if (!trimTitle) {
      setFieldError("Title is required.");
      return;
    }
    if (!trimContent) {
      setFieldError("Content is required.");
      return;
    }
    startUpdateTransition(async () => {
      try {
        await onUpdate({
          ...post,
          title: trimTitle,
          content: trimContent,
          image_url: imageUrl.trim() || null,
        });
        onClose();
      } catch (err) {
        setFieldError(getErrorMessage(err) ?? "Failed to save changes.");
      }
    });
  };

  return (
    <div className="card bg-base-100 shadow-md">
      <div className="card-body gap-4">
        <h2 className="card-title">Edit Post</h2>
        {fieldError && (
          <div className="alert alert-error py-2 text-sm" role="alert">
            {fieldError}
          </div>
        )}
        <form
          onSubmit={handleUpdate}
          noValidate
          className="flex flex-col gap-4"
        >
          <div className="flex flex-col gap-1">
            <label className="fieldset-label font-semibold" htmlFor="edit-title">
              Title
            </label>
            <input
              id="edit-title"
              type="text"
              className="input w-full"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              maxLength={200}
              required
            />
          </div>
          <div className="flex flex-col gap-1">
            <label className="fieldset-label font-semibold" htmlFor="edit-content">
              Content
            </label>
            <textarea
              id="edit-content"
              className="textarea w-full h-40"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              maxLength={5000}
              required
            />
          </div>
          <div className="flex flex-col gap-1">
            <label className="fieldset-label font-semibold" htmlFor="edit-image">
              Image URL (optional)
            </label>
            <input
              id="edit-image"
              type="url"
              className="input w-full"
              value={imageUrl}
              onChange={(e) => setImageUrl(e.target.value)}
            />
          </div>
          <div className="flex gap-2 mt-2">
            <button
              type="submit"
              className="btn btn-primary btn-sm"
              disabled={isUpdating}
            >
              {isUpdating ? (
                <>
                  <span className="loading loading-spinner loading-xs" />{" "}
                  Saving…
                </>
              ) : (
                "Save Changes"
              )}
            </button>
            <button
              type="button"
              className="btn btn-ghost btn-sm"
              onClick={onClose}
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── Main Post component ───────────────────────────────────────────────────────

export default function Post() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { posts, loading, updatePost, deletePost } = usePosts();

  const currentPost = posts.find((p) => p.id === Number(id));

  const [ui, dispatch] = useReducer(postUIReducer, initialUI);
  const [commentText, setCommentText] = useState("");


  const [optimisticUpvotes, addOptimisticUpvote] = useOptimistic(
    currentPost?.upvotes ?? 0,
    (current: number, amount: number) => current + amount,
  );

  const [isUpvotePending, startUpvoteTransition] = useTransition();

  const comments = useMemo(
    () => (currentPost ? parseComments(currentPost.comments) : []),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [currentPost?.comments],
  );

  const [optimisticComments, addOptimisticComment] = useOptimistic(
    comments,
    (current: Comment[], newComment: Comment) => [...current, newComment],
  );

  const [isCommentPending, startCommentTransition] = useTransition();

  // Redirect only after loading completes — avoids false redirect while posts fetch
  if (!loading && !currentPost) {
    return <Navigate to="/community" replace />;
  }

  if (!currentPost) {
    return (
      <div className="flex justify-center py-16">
        <span className="loading loading-spinner loading-lg text-primary" />
      </div>
    );
  }

  // ── Handlers ────────────────────────────────────────────────────────────────

  const handleUpvote = () => {

    startUpvoteTransition(async () => {
      // Step 1: immediately show +1 on screen (no server round-trip yet)
      addOptimisticUpvote(1);
      // Step 2: persist to Supabase in the background
      // If this throws, React auto-reverts optimisticUpvotes to the real value
      await updatePost({ ...currentPost, upvotes: currentPost.upvotes + 1 });
    });
  };

  const handleDelete = async () => {
    if (ui.isDeleting) return;
    dispatch({ type: "DELETE_START" });
    try {
      await deletePost(currentPost.id);
      navigate("/community");
    } catch {
      dispatch({ type: "DELETE_FAIL" });
    }
  };

  const handleComment = (e: React.SyntheticEvent<HTMLFormElement, SubmitEvent>) => {
    e.preventDefault();
    const trimmed = commentText.trim();
    if (!trimmed || isCommentPending) return;

    const newComment: Comment = { id: crypto.randomUUID(), text: trimmed };
    setCommentText("");

    startCommentTransition(async () => {
      addOptimisticComment(newComment);
      await updatePost({
        ...currentPost,
        comments: [...(currentPost.comments ?? []), newComment],
      });
    });
  };

  // ── Render ──────────────────────────────────────────────────────────────────

  return (
    <div className="container mx-auto max-w-3xl px-4 pt-6 pb-12 space-y-6">
      <title>{currentPost.title} — Solis</title>

      {/* ── Post card ── */}
      <div className="card bg-base-100 shadow-md">
        <div className="card-body">
          <p className="text-xs text-base-content/60">
            Posted on {new Date(currentPost.created_at).toLocaleString()}
          </p>
          <h1 className="card-title text-2xl">{currentPost.title}</h1>
          <p className="mt-2 whitespace-pre-wrap">{currentPost.content}</p>

          <div className="flex items-center gap-1 mt-2 text-sm">
            <span>👍</span>
            <span className="font-medium">{optimisticUpvotes}</span>
            <span className="text-base-content/60">
              {optimisticUpvotes === 1 ? "upvote" : "upvotes"}
            </span>
          </div>

          {currentPost.image_url && (
            <img
              src={currentPost.image_url}
              alt={currentPost.title}
              className="mt-4 max-w-md rounded-box"
            />
          )}

          <div className="card-actions mt-4 gap-2">
            <button
              className="btn btn-outline btn-sm"
              onClick={handleUpvote}
              disabled={isUpvotePending}
            >
              {isUpvotePending ? (
                <span className="loading loading-spinner loading-xs" />
              ) : (
                "👍"
              )}{" "}
              Upvote
            </button>
            <button
              className="btn btn-outline btn-sm"
              onClick={() => dispatch({ type: "TOGGLE_EDIT" })}
            >
              {ui.showEditForm ? "Cancel Edit" : "Edit"}
            </button>
            {ui.confirmDelete ? (
              <>
                <span className="self-center text-sm text-error font-medium">
                  Are you sure?
                </span>
                <button
                  className="btn btn-error btn-sm"
                  onClick={handleDelete}
                  disabled={ui.isDeleting}
                >
                  {ui.isDeleting ? (
                    <span className="loading loading-spinner loading-xs" />
                  ) : (
                    "Yes, delete"
                  )}
                </button>
                <button
                  className="btn btn-ghost btn-sm"
                  onClick={() => dispatch({ type: "CANCEL_DELETE" })}
                >
                  Cancel
                </button>
              </>
            ) : (
              <button
                className="btn btn-error btn-sm"
                onClick={() => dispatch({ type: "CONFIRM_DELETE" })}
              >
                Delete
              </button>
            )}
          </div>
        </div>
      </div>

      {/* ── Edit form — keyed by post ID so state resets when post changes ── */}
      {ui.showEditForm && (
        <EditPostForm
          key={currentPost.id}
          post={currentPost}
          onClose={() => dispatch({ type: "CLOSE_EDIT" })}
          onUpdate={updatePost}
        />
      )}

      {/* ── Comments ── */}
      <div className="card bg-base-100 shadow-md">
        <div className="card-body">
          <h2 className="card-title text-lg">Comments ({optimisticComments.length})</h2>

          {optimisticComments.length === 0 && (
            <p className="text-sm text-base-content/60">
              No comments yet. Be the first!
            </p>
          )}

          <ul className="space-y-3 mt-2">
            {optimisticComments.map((c) => (
              <li
                key={c.id}
                className="rounded-box bg-base-200 px-4 py-3 text-sm"
              >
                {c.text}
              </li>
            ))}
          </ul>

          <form onSubmit={handleComment} className="mt-4 flex gap-2">
            <input
              type="text"
              className="input input-bordered flex-1"
              placeholder="Add a comment…"
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              maxLength={500}
              aria-label="Comment text"
            />
            <button
              type="submit"
              className="btn btn-primary"
              disabled={isCommentPending}
            >
              {isCommentPending ? (
                <span className="loading loading-spinner loading-xs" />
              ) : (
                "Post"
              )}
            </button>
          </form>
        </div>
      </div>

      <Link to="/community" className="btn btn-ghost btn-sm">
        ← Back to Community
      </Link>
    </div>
  );
}
