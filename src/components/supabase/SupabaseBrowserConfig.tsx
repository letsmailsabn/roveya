"use client";

let url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
let key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? "";

export function configureSupabase(nextUrl: string, nextKey: string) {
  if (nextUrl) url = nextUrl;
  if (nextKey) key = nextKey;
}

export function readSupabasePublicConfig() {
  return { url, key };
}

export function SupabaseBrowserConfig({
  url: nextUrl,
  publishableKey,
  children,
}: {
  url: string;
  publishableKey: string;
  children: React.ReactNode;
}) {
  configureSupabase(nextUrl, publishableKey);
  return children;
}
