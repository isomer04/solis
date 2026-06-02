import { createClient } from "@supabase/supabase-js";

// vite-env.d.ts types these as string (non-optional) — no `as string` cast needed.
// The runtime guard below ensures we fail fast with a clear message if they are missing.
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_DEFAULT_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    "Missing Supabase environment variables. " +
      "Ensure VITE_SUPABASE_URL and VITE_SUPABASE_PUBLISHABLE_DEFAULT_KEY " +
      "are set in your .env file.",
  );
}

// Validate URL format early to surface typos at startup
try {
  new URL(supabaseUrl);
} catch {
  throw new Error(
    `VITE_SUPABASE_URL is not a valid URL: "${supabaseUrl}". Check your .env file.`,
  );
}

// NOTE: To get full type safety on all .from() queries, generate the Database
// type from the Supabase CLI and pass it as a generic:
//   npx supabase gen types typescript --project-id <id> > src/types/database.types.ts
//   createClient<Database>(supabaseUrl, supabaseAnonKey)
export const supabase = createClient(supabaseUrl, supabaseAnonKey);
