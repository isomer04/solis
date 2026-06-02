import React from "react";
import ReactDOM from "react-dom/client";
import { createBrowserRouter, RouterProvider } from "react-router-dom";
import { lazy } from "react";
import { ErrorBoundary } from "./components/ErrorBoundary";
import App from "./App";
import CommunityLayout from "./routes/CommunityLayout";
import "./index.css";

// Route-level code splitting — each lazy import becomes its own JS chunk.
// Suspense is handled inside App.tsx so the shell stays visible during loading.
const MarketHome = lazy(() => import("./routes/MarketHome"));
const Community = lazy(() => import("./routes/Community"));
const Post = lazy(() => import("./components/Post"));
const PostForm = lazy(() => import("./components/PostForm"));
const CryptoTracker = lazy(() => import("./components/CryptoTracker"));
const CryptoNews = lazy(() => import("./components/CryptoNews"));
const DetailView = lazy(() => import("./routes/DetailView"));
const Portfolio = lazy(() => import("./routes/Portfolio"));
const Converter = lazy(() => import("./routes/Converter"));
const About = lazy(() => import("./routes/About"));
const Heatmap = lazy(() => import("./routes/Heatmap"));
const NotFound = lazy(() => import("./routes/NotFound"));

const router = createBrowserRouter([
  {
    path: "/",
    element: <App />,
    children: [
      { index: true, element: <MarketHome /> },
      // Community routes — scoped PostsProvider so Supabase only loads here
      {
        element: <CommunityLayout />,
        children: [
          { path: "community", element: <Community /> },
          { path: "post/:id", element: <Post /> },
          { path: "create", element: <PostForm /> },
        ],
      },
      // Crypto tools
      { path: "cryptotracker", element: <CryptoTracker /> },
      { path: "coin-details/:symbol", element: <DetailView /> },
      { path: "cryptonews", element: <CryptoNews /> },
      // Portfolio & conversion
      { path: "portfolio", element: <Portfolio /> },
      { path: "converter", element: <Converter /> },
      // Static pages
      { path: "heatmap", element: <Heatmap /> },
      { path: "about", element: <About /> },
      { path: "*", element: <NotFound /> },
    ],
  },
]);

const rootElement = document.getElementById("root");
if (!rootElement) throw new Error("Root element #root not found in index.html");

ReactDOM.createRoot(rootElement).render(
  <React.StrictMode>
    <ErrorBoundary>
      <RouterProvider router={router} />
    </ErrorBoundary>
  </React.StrictMode>,
);
