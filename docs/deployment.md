# Deployment

solis is continuously deployed to **Netlify** from the `main` branch via the CI/CD pipeline in `.github/workflows/ci-cd.yml`.

---

## Netlify (recommended)

1. Push the repository to GitHub.
2. Connect the repo in the [Netlify dashboard](https://netlify.com) (**Add new site → Import an existing project**).
3. Set the following build settings:
   - **Build command:** `npm run build`
   - **Publish directory:** `dist`
4. Add every variable from `.env.example` under **Site Settings → Environment Variables**.
5. The `public/_redirects` file already handles client-side routing — no extra config needed.

> The live instance is at **[soliscrypto.netlify.app](https://soliscrypto.netlify.app)**.

---

## Other Hosts

The output of `npm run build` is a standard static bundle in `dist/`. It can be served from any static host (Vercel, GitHub Pages, Cloudflare Pages, S3 + CloudFront, etc.) with the following requirements:

- All routes must fall back to `index.html` (SPA routing).
- All five environment variables must be injected at build time as `VITE_*` vars.

---

## Build Commands

| Command | Description |
| ------- | ----------- |
| `npm run build` | Type-check with `tsc -b`, then bundle for production |
| `npm run preview` | Serve the production build locally on port 4173 |

---

## CI Pipeline

The GitHub Actions workflow (`.github/workflows/ci-cd.yml`) runs on every push to `main` and on pull requests:

1. Install dependencies (`npm ci`)
2. Lint (`npm run lint:ci`)
3. Type-check (`npm run typecheck`)
4. Test (`npm run test`)
5. Build (`npm run build`)
