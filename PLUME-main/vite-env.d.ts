/// <reference types="vite/client" />

interface ImportMetaEnv {
    readonly VITE_SUPABASE_URL: string;
    readonly VITE_SUPABASE_ANON_KEY: string;
    readonly GEMINI_API_KEY: string;
    readonly VITE_SENTRY_DSN?: string;
    readonly VITE_GA_TRACKING_ID?: string;
    readonly VITE_ENABLE_VOICE_RECORDING?: string;
    readonly VITE_ENABLE_PHOTO_ANALYSIS?: string;
    readonly VITE_ENABLE_DIGITAL_MEMORY_IMPORT?: string;
    readonly DEV: boolean;
    readonly PROD: boolean;
    readonly MODE: string;
}

interface ImportMeta {
    readonly env: ImportMetaEnv;
}
