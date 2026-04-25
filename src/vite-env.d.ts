/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_APP_API_KEY: string;
  readonly VITE_SUPABASE_URL: string;
  readonly VITE_SUPABASE_PUBLISHABLE_DEFAULT_KEY: string;
  readonly VITE_APP_CLOUDINARY_UPLOAD_PRESET: string;
  readonly VITE_APP_CLOUDINARY_CLOUD_NAME: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
