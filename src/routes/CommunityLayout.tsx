import { Outlet } from "react-router-dom";
import { PostsProvider } from "../context/PostsContext";

/**
 * Layout route that scopes PostsProvider to community pages only.
 * This prevents the Supabase query from firing on every page load.
 */
export default function CommunityLayout() {
  return (
    <PostsProvider>
      <Outlet />
    </PostsProvider>
  );
}
