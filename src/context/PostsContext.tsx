import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { z } from "zod";
import { supabase } from "../lib/supabase";
import { PostSchema } from "../schemas";
import type { NewPost, Post } from "../types";

// ─── Table name ──────────────────────────────────────────────────────────────
const TABLE = "solis" as const;

// ─── Context shape ───────────────────────────────────────────────────────────
interface PostsContextValue {
  posts: Post[];
  loading: boolean;
  error: string | null;
  fetchPosts: () => Promise<void>;
  createPost: (newPost: NewPost) => Promise<void>;
  updatePost: (updatedPost: Post) => Promise<void>;
  deletePost: (postId: number) => Promise<void>;
}

const PostsContext = createContext<PostsContextValue | null>(null);

// ─── Provider ────────────────────────────────────────────────────────────────
interface PostsProviderProps {
  children: React.ReactNode;
}

export function PostsProvider({
  children,
}: PostsProviderProps): React.ReactElement {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchPosts = useCallback(async (): Promise<void> => {
    setLoading(true);
    setError(null);
    // Cast the result to unknown first so Zod can safely validate the data
    const result = (await supabase
      .from(TABLE)
      .select("*")
      .order("created_at", { ascending: false })) as {
      data: unknown;
      error: { message: string } | null;
    };

    if (result.error) {
      setError(result.error.message);
    } else {
      const parseResult = z.array(PostSchema).safeParse(result.data ?? []);
      if (parseResult.success) {
        setPosts(parseResult.data);
      } else {
        setError("Received unexpected data shape from server.");
      }
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function load(): Promise<void> {
      setLoading(true);
      setError(null);
      // Cast the result to unknown first so Zod can safely validate the data
      const result = (await supabase
        .from(TABLE)
        .select("*")
        .order("created_at", { ascending: false })) as {
        data: unknown;
        error: { message: string } | null;
      };

      if (cancelled) return;

      if (result.error) {
        setError(result.error.message);
      } else {
        const parseResult = z.array(PostSchema).safeParse(result.data ?? []);
        if (parseResult.success) {
          setPosts(parseResult.data);
        } else {
          setError("Received unexpected data shape from server.");
        }
      }
      setLoading(false);
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, []);

  // Mutations throw errors to callers so they can handle them locally
  // (e.g. display in a form). Additionally, set global error state for
  // mutation failures and clear previous errors before starting a mutation.
  const createPost = useCallback(async (newPost: NewPost): Promise<void> => {
    // Clear any previous global error before starting this mutation
    setError(null);

    type MutationResult = { data: unknown; error: { message: string } | null };
    const insertResult = (await supabase
      .from(TABLE)
      .insert({ ...newPost, upvotes: 0, comments: [] })
      .select()
      .single()) as MutationResult;

    if (insertResult.error) {
      setError(insertResult.error.message);
      throw new Error(insertResult.error.message);
    }
    if (insertResult.data) {
      const parseResult = PostSchema.safeParse(insertResult.data);
      if (!parseResult.success) {
        const message = `Server returned invalid post shape after insert: ${parseResult.error.message}`;
        setError(message);
        throw new Error(message);
      }
      setPosts((prev) => [parseResult.data, ...prev]);
    }
  }, []);

  const updatePost = useCallback(async (updatedPost: Post): Promise<void> => {
    // Clear any previous global error before starting this mutation
    setError(null);

    type MutationResult = { data: unknown; error: { message: string } | null };
    // Only send mutable fields — never let callers overwrite id or created_at
    const updateResult = (await supabase
      .from(TABLE)
      .update({
        title: updatedPost.title,
        content: updatedPost.content,
        image_url: updatedPost.image_url,
        upvotes: updatedPost.upvotes,
        comments: updatedPost.comments,
        tag: updatedPost.tag,
      })
      .eq("id", updatedPost.id)
      .select()
      .single()) as MutationResult;

    if (updateResult.error) {
      setError(updateResult.error.message);
      throw new Error(updateResult.error.message);
    }
    if (updateResult.data) {
      const parseResult = PostSchema.safeParse(updateResult.data);
      if (!parseResult.success) {
        const message = `Server returned invalid post shape after update: ${parseResult.error.message}`;
        setError(message);
        throw new Error(message);
      }
      setPosts((prev) =>
        prev.map((p) => (p.id === parseResult.data.id ? parseResult.data : p)),
      );
    }
  }, []);

  const deletePost = useCallback(async (postId: number): Promise<void> => {
    // Clear any previous global error before starting this mutation
    setError(null);

    const { error: deleteError } = await supabase
      .from(TABLE)
      .delete()
      .eq("id", postId);

    if (deleteError) {
      // Surface mutation error in global state for UI consumers, then rethrow
      setError(deleteError.message);
      throw new Error(deleteError.message);
    }
    setPosts((prev) => prev.filter((p) => p.id !== postId));
  }, []);

  const value = useMemo(
    () => ({
      posts,
      loading,
      error,
      fetchPosts,
      createPost,
      updatePost,
      deletePost,
    }),
    [posts, loading, error, fetchPosts, createPost, updatePost, deletePost],
  );

  return (
    <PostsContext value={value}>{children}</PostsContext>
  );
}

// ─── Hook ────────────────────────────────────────────────────────────────────
// eslint-disable-next-line react-refresh/only-export-components
export function usePosts(): PostsContextValue {
  const ctx = useContext(PostsContext);
  if (!ctx) {
    throw new Error("usePosts must be used inside <PostsProvider>");
  }
  return ctx;
}