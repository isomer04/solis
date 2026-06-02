# Configuration

All runtime configuration is supplied through environment variables.  
Copy `.env.example` to `.env` and fill in each value before starting the dev server.

```bash
cp .env.example .env
```

---

## Environment Variables

| Variable | Required | Description |
| -------- | -------- | ----------- |
| `VITE_SUPABASE_URL` | ✅ | Supabase project URL (e.g. `https://xxxx.supabase.co`) |
| `VITE_SUPABASE_PUBLISHABLE_DEFAULT_KEY` | ✅ | Supabase anon / public key |
| `VITE_APP_API_KEY_CRYPTO` | ✅ | CryptoCompare API key (free tier at [min-api.cryptocompare.com](https://min-api.cryptocompare.com)) |
| `VITE_APP_CLOUDINARY_CLOUD_NAME` | ✅ | Cloudinary cloud name (top-left of the Cloudinary console) |
| `VITE_APP_CLOUDINARY_UPLOAD_PRESET` | ✅ | Name of an **unsigned** upload preset |

> **Never commit `.env`.** It is listed in `.gitignore`.  
> The Supabase client validates these at startup and throws a descriptive error if any are missing.

---

## Cloudinary Setup (unsigned uploads)

Image uploads use Cloudinary's unsigned upload flow — no API secret is ever sent to the browser.

1. Log in to [cloudinary.com/console](https://cloudinary.com/console) and copy your **Cloud Name** from the top-left.
2. Go to **Settings → Upload → Upload presets → Add upload preset**.
3. Set **Signing mode** to **Unsigned** and save.
4. Copy the preset name into `VITE_APP_CLOUDINARY_UPLOAD_PRESET`.

Your API Key and API Secret are **not** needed and must not be added to a Vite `.env` — they would be exposed in the browser bundle.

---

## Supabase Setup

1. Create a free project at [supabase.com](https://supabase.com).
2. Run the schema from [docs/database.md](./database.md) in the SQL editor.
3. Copy the **Project URL** and **anon public key** from **Settings → API** into `.env`.
