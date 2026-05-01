<div align="center">

# solis

**A full-stack web application for tracking live cryptocurrency prices, reading crypto news, and sharing community blog posts.**

[![Live Demo](https://img.shields.io/badge/Live%20Demo-soliscrypto.netlify.app-blue?style=for-the-badge)](https://soliscrypto.netlify.app)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.7-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-19-61DAFB?style=for-the-badge&logo=react&logoColor=black)](https://react.dev/)
[![Vite](https://img.shields.io/badge/Vite-6-646CFF?style=for-the-badge&logo=vite&logoColor=white)](https://vitejs.dev/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind%20CSS-4-06B6D4?style=for-the-badge&logo=tailwindcss&logoColor=white)](https://tailwindcss.com/)

</div>

---

## Overview

solis is a production-grade, full-stack React application that combines real-time cryptocurrency data with a community blogging platform. It was built from the ground up with a focus on performance, type safety, and modern React patterns.

## Demo
<img src="https://github.com/user-attachments/assets/1940b936-5f7f-4bb4-9f7d-f7c4ba8778f0" width="100%" alt="solis" />

---

## Features

| Feature                  | Details                                                               |
| ------------------------ | --------------------------------------------------------------------- |
| **Live Crypto Prices**   | Real-time price tracker for 100+ coins via CoinGecko API              |
| **Coin Detail & Charts** | Interactive multi-timeframe price chart using Lightweight Charts      |
| **Crypto News Feed**     | Latest industry news aggregated from a public news API                |
| **Community Blog**       | Full CRUD — create, read, update, and delete posts with image uploads |
| **Comments**             | Flat commenting with per-post upvoting                                |
| **Image Uploads**        | Unsigned Cloudinary upload (no API key exposed to the client)         |
| **404 & Error Handling** | Custom `ErrorBoundary` class component + `NotFound` route             |
| **Responsive Design**    | Mobile-first layout with DaisyUI accessible components                |

---

## Tech Stack

### Frontend

- **React 19** — latest stable release with concurrent features
- **TypeScript 5.7** — strict mode enabled across the entire codebase
- **React Router 7** — `createBrowserRouter` with nested layouts and route-level lazy loading
- **Tailwind CSS 4 + DaisyUI 5** — utility-first styling with an accessible component library
- **Recharts 2** — composable charting with `ResponsiveContainer` for adaptive layouts
- **Lightweight Charts** — high-performance financial charts for coin details
- **Zod** — TypeScript-first schema validation with static type inference


### Backend & Services

- **Supabase** — PostgreSQL database with a type-safe JS client; Row Level Security (RLS) enabled
- **Cloudinary** — media storage via unsigned upload preset (zero secrets on the client)
- **CoinGecko API** — free-tier crypto price and historical data
- **CryptoCompare API** — ticker, portfolio, converter, and historical chart data
- **RSS2JSON** — free RSS proxy for news aggregation (CoinTelegraph, CoinDesk, Decrypt — no key required)

### Tooling

- **Vite 6** — sub-second HMR and optimised production bundles with native ESM
- **ESLint 9** — flat config with `typescript-eslint`, `react-hooks`, and `react-refresh` plugins

---

## Architecture Highlights

- **Custom hooks** (`useTopCoins`, `useCoinDetail`, `useCoinHistory`, `useCryptoNews`) encapsulate all data-fetching logic with `AbortController` cleanup to prevent memory leaks on unmount.
- **React Context** (`PostsContext`) manages global blog post state, exposing memoised `createPost`, `updatePost`, and `deletePost` actions — no prop drilling.
- **Route-level code splitting** via `React.lazy` + `Suspense` splits the bundle into per-route chunks, reducing initial load time.
- **XSS prevention** — all external API HTML (e.g. coin descriptions) is sanitised with `DOMPurify` before being injected via `dangerouslySetInnerHTML`.
- **Strict TypeScript** — shared interfaces in `src/types/index.ts` enforce consistent data shapes across the entire app.
- **Environment variable validation** — the Supabase client throws a descriptive error at startup if required env vars are missing, preventing silent failures in production.

---

## Project Structure

```
src/
├── components/         # Reusable UI components (CryptoTracker, CoinChart, Post, etc.)
├── context/            # PostsContext — global blog state
├── hooks/              # Custom data-fetching hooks (useTopCoins, useCoinDetail, etc.)
├── lib/                # Supabase client singleton
├── routes/             # Page-level route components (About, DetailView, NotFound)
├── types/              # Shared TypeScript interfaces
├── App.tsx             # Root layout (Navigation + Outlet + Footer)
└── main.tsx            # App entry point — router, providers, ErrorBoundary
```

---

## Getting Started

### Prerequisites

- Node.js 18+
- A [Supabase](https://supabase.com) project with a `solis` table
- A [Cloudinary](https://cloudinary.com) account with an **unsigned** upload preset
- A [CryptoCompare](https://min-api.cryptocompare.com) API key (free tier)

### Installation

```bash
# 1. Clone the repository
git clone https://github.com/isomer04/solis.git
cd solis

# 2. Install dependencies
npm install

# 3. Configure environment variables
cp .env.example .env
# Open .env and fill in all required values (see .env.example for reference)

# 4. Start the development server
npm run dev
```

The app will be available at `http://localhost:5173`.

### Available Scripts

| Command                 | Description                                         |
| ----------------------- | --------------------------------------------------- |
| `npm run dev`           | Start the Vite development server with HMR          |
| `npm run build`         | Type-check with `tsc -b`, then build for production |
| `npm run preview`       | Serve the production build locally                  |
| `npm run lint`          | Run ESLint across the entire codebase               |
| `npm run test`          | Run the Vitest test suite once                      |
| `npm run test:watch`    | Run Vitest in interactive watch mode                |
| `npm run test:coverage` | Collect V8 coverage report                          |

---

## Environment Variables

Copy `.env.example` to `.env` and populate the following:

```env
VITE_SUPABASE_URL=                      # Supabase project URL
VITE_SUPABASE_PUBLISHABLE_DEFAULT_KEY=  # Supabase anon/public key
VITE_APP_API_KEY_CRYPTO=                # CryptoCompare API key
VITE_APP_CLOUDINARY_CLOUD_NAME=         # Cloudinary cloud name (top-left of cloudinary.com/console)
VITE_APP_CLOUDINARY_UPLOAD_PRESET=      # Unsigned upload preset name (see Cloudinary setup below)
```

> **Note:** Never commit your `.env` file. It is listed in `.gitignore`.

### Cloudinary Setup

Image uploads use Cloudinary's **unsigned upload** flow — no API secret is ever sent to the browser.

1. Log in to [cloudinary.com/console](https://cloudinary.com/console) and copy your **Cloud Name** from the top-left.
2. Go to **Settings → Upload → Upload presets → Add upload preset**.
3. Set **Signing mode** to **Unsigned** and save.
4. Copy the preset name into `VITE_APP_CLOUDINARY_UPLOAD_PRESET`.

> Your API Key and API Secret are **not** needed and should never be added to a Vite `.env` — they would be exposed in the browser bundle.

---

## Database Schema

The `solis` table in Supabase has the following structure:

```sql
create table solis (
  id          bigint generated by default as identity primary key,
  title       text        not null,
  content     text        not null,
  image_url   text,
  tag         text        default 'Discussion',
  upvotes     integer     default 0,
  comments    jsonb       default '[]',
  created_at  timestamptz default now()
);

-- Enable Row Level Security (RLS)
-- NOTE: These open policies are intentional for this anonymous demo.
-- In a production app with auth, replace `true` with `auth.uid() = creator_id`.
alter table solis enable row level security;

create policy "Public read"   on solis for select using (true);
create policy "Public insert" on solis for insert with check (true);
create policy "Public update" on solis for update using (true);
create policy "Public delete" on solis for delete using (true);
```

---

## Deployment

The application is continuously deployed to **Netlify** from the `main` branch.

[![Live Demo](https://img.shields.io/badge/View%20Live-soliscrypto.netlify.app-success?style=flat-square)](https://soliscrypto.netlify.app)

To deploy your own instance:

1. Push the repository to GitHub.
2. Connect the repo to [Netlify](https://netlify.com).
3. Set all environment variables from `.env.example` in the Netlify dashboard under **Site Settings → Environment Variables**.
4. Set the build command to `npm run build` and the publish directory to `dist`.

---

## License

Licensed under the [Apache License 2.0](https://www.apache.org/licenses/LICENSE-2.0).

Copyright © 2026 solis
