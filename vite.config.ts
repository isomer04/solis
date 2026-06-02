import path from "path";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

// Security headers applied to both dev server and preview
const securityHeaders: Record<string, string> = {
  "X-Content-Type-Options": "nosniff",
  "X-Frame-Options": "DENY",
  "X-XSS-Protection": "1; mode=block",
  "Referrer-Policy": "strict-origin-when-cross-origin",
};

export default defineConfig({
  plugins: [react(), tailwindcss()],

  resolve: {
    alias: {
      "@": path.resolve(__dirname, "src"),
    },
  },

  build: {
    target: "es2022",
    // Upload sourcemaps to your error tracker; never ship without them
    sourcemap: true,
    // Raise limit because recharts + lightweight-charts are large
    chunkSizeWarningLimit: 700,
    rollupOptions: {
      output: {
        manualChunks: {
          // Separate vendor chunks reduce main bundle size and improve caching
          "vendor-react": ["react", "react-dom", "react-router-dom"],
          "vendor-charts": ["recharts", "lightweight-charts"],
          "vendor-supabase": ["@supabase/supabase-js"],
        },
      },
    },
  },

  server: {
    headers: securityHeaders,
  },

  preview: {
    headers: securityHeaders,
  },
});
