import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { supabase } from "../lib/supabase";
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
    const { data, error: fetchError } = await supabase
      .from(TABLE)
      .select("*")
      .order("created_at", { ascending: false });

    if (fetchError) {
      setError(fetchError.message);
    } else {
      const posts: Post[] = data ?? [];
      setPosts(posts);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function load(): Promise<void> {
      setLoading(true);
      setError(null);
      const { data, error: fetchError } = await supabase
        .from(TABLE)
        .select("*")
        .order("created_at", { ascending: false });

      if (cancelled) return;

      if (fetchError) {
        setError(fetchError.message);
      } else {
        const posts: Post[] = data ?? [];
        setPosts(posts);
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

    const { data, error: insertError } = await supabase
      .from(TABLE)
      .insert({ ...newPost, upvotes: 0, comments: [] })
      .select()
      .single();

    if (insertError) {
      // Surface mutation error in global state for UI consumers, then rethrow
      setError(insertError.message);
      throw new Error(insertError.message);
    }
    if (data) {
      const post: Post = data;
      setPosts((prev) => [post, ...prev]);
    }
  }, []);

  const updatePost = useCallback(async (updatedPost: Post): Promise<void> => {
    // Clear any previous global error before starting this mutation
    setError(null);

    const { data, error: updateError } = await supabase
      .from(TABLE)
      .update(updatedPost)
      .eq("id", updatedPost.id)
      .select()
      .single();

    if (updateError) {
      // Surface mutation error in global state for UI consumers, then rethrow
      setError(updateError.message);
      throw new Error(updateError.message);
    }
    if (data) {
      const updated: Post = data;
      setPosts((prev) => prev.map((p) => (p.id === updated.id ? updated : p)));
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