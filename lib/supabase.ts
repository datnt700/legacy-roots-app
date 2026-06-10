import { createClient } from "@supabase/supabase-js";

function normalizeSupabaseUrl(rawUrl: string) {
  return rawUrl
    .trim()
    .replace(/\/+$/, "")
    .replace(/\/rest\/v1$/i, "")
    .replace(/\/storage\/v1$/i, "");
}

export function getSupabaseStorageBucket() {
  return (
    process.env.SUPABASE_STORAGE_BUCKET ??
    process.env.NEXT_PUBLIC_SUPABASE_STORAGE_BUCKET ??
    "timeline-media"
  );
}

export function getSupabaseProjectUrl() {
  const rawSupabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;

  if (!rawSupabaseUrl) {
    throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL.");
  }

  return normalizeSupabaseUrl(rawSupabaseUrl);
}

export function getSupabase() {
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseKey) {
    throw new Error(
      "Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY.",
    );
  }

  const supabaseUrl = getSupabaseProjectUrl();

  if (!supabaseUrl.startsWith("http://") && !supabaseUrl.startsWith("https://")) {
    throw new Error("SUPABASE_URL must be a valid HTTP or HTTPS URL.");
  }

  return createClient(supabaseUrl, supabaseKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}
