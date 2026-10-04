import { createBrowserClient } from "@supabase/ssr";
import { readSupabasePublicConfig } from "@/components/supabase/SupabaseBrowserConfig";

export function createClient() {
  const { url, key } = readSupabasePublicConfig();
  if (!url || !key) throw new Error("Supabase is not configured.");
  return createBrowserClient(url, key);
}
