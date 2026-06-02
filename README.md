<div align="center">

# solis

**Track live crypto prices, read the latest news, and share community posts — all in one place.**

[![Live Demo](https://img.shields.io/badge/Live%20Demo-soliscrypto.netlify.app-blue?style=for-the-badge)](https://soliscrypto.netlify.app)
[![License](https://img.shields.io/badge/License-MIT-yellow?style=for-the-badge)](LICENSE)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.7-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-19-61DAFB?style=for-the-badge&logo=react&logoColor=black)](https://react.dev/)
[![Vite](https://img.shields.io/badge/Vite-6-646CFF?style=for-the-badge&logo=vite&logoColor=white)](https://vitejs.dev/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind%20CSS-4-06B6D4?style=for-the-badge&logo=tailwindcss&logoColor=white)](https://tailwindcss.com/)

</div>

---

<img src="https://github.com/user-attachments/assets/1940b936-5f7f-4bb4-9f7d-f7c4ba8778f0" width="100%" alt="solis app screenshot" />

---

## Overview

solis is a production-grade React 19 app that combines real-time cryptocurrency data with a community blogging platform. It is built with TypeScript strict mode, Supabase for persistence, and Cloudinary for image uploads — all wired together with custom hooks, centralised Zod validation, and route-level code splitting.

---

## Features

- **Live price tracker** — top 100 coins via CoinGecko with real-time updates
- **Coin detail & charts** — interactive multi-timeframe charts powered by Lightweight Charts
- **Crypto news feed** — aggregated headlines from CoinTelegraph, CoinDesk, and Decrypt
- **Community blog** — full CRUD posts with image uploads, comments, and upvotes
- **XSS protection** — DOMPurify sanitises all external HTML; `safeHref()` rejects `javascript:` and `data:` URLs
- **Responsive** — mobile-first layout with DaisyUI accessible components

---

## Quick Start

```bash
# 1. Clone
git clone https://github.com/isomer04/solis.git
cd solis

# 2. Install dependencies
npm install

# 3. Configure environment variables
cp .env.example .env
# Fill in the five required values — see docs/configuration.md

# 4. Start the dev server
npm run dev
```

App is available at `http://localhost:5173`.

Key scripts:

| Command | Description |
| ------- | ----------- |
| `npm run dev` | Start Vite dev server with HMR |
| `npm run build` | Type-check + production bundle |
| `npm run test` | Run Vitest suite once |
| `npm run lint` | ESLint across the codebase |

---

## Tech Stack

**Frontend** — React 19, TypeScript 5.7, React Router 7, Tailwind CSS 4 + DaisyUI 5, Recharts, Lightweight Charts, Zod

**Backend / services** — Supabase (PostgreSQL + RLS), Cloudinary (unsigned uploads), CoinGecko API, CryptoCompare API, RSS2JSON

**Tooling** — Vite 6, ESLint 9 (flat config), Vitest

---

## Documentation

| Topic | File |
| ----- | ---- |
| Environment variables & service setup | [docs/configuration.md](docs/configuration.md) |
| API endpoints used by each hook | [docs/api-reference.md](docs/api-reference.md) |
| Database schema and access pattern | [docs/database.md](docs/database.md) |
| Deployment (Netlify + CI pipeline) | [docs/deployment.md](docs/deployment.md) |

---

## Contributing

1. Fork the repo and create a branch from `main`.
2. Make your changes, ensuring `npm run lint` and `npm run test` both pass.
3. Open a pull request with a short description of what changed and why.

---

## License

Licensed under the [MIT License](LICENSE).  
Copyright © 2026 solis
