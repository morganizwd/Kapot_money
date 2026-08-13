const FALLBACK_SUPABASE_URL = "https://example.supabase.co";
const FALLBACK_SUPABASE_KEY = "public-development-placeholder";

export function getSupabaseUrl() {
  return process.env.NEXT_PUBLIC_SUPABASE_URL || FALLBACK_SUPABASE_URL;
}

export function getSupabasePublishableKey() {
  return (
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    FALLBACK_SUPABASE_KEY
  );
}

export function isSupabaseConfigured() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  return Boolean(url && key);
}

export function getSiteUrl() {
  const configuredUrl = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  const vercelUrl = process.env.NEXT_PUBLIC_VERCEL_URL?.trim() || process.env.VERCEL_URL?.trim();
  const rawUrl = configuredUrl || vercelUrl || "http://localhost:3000";
  const url = rawUrl.startsWith("http") ? rawUrl : `https://${rawUrl}`;

  return url.replace(/\/$/, "");
}
