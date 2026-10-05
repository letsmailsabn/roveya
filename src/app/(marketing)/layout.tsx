import { Footer } from "@/components/layout/Footer";
import { Header } from "@/components/layout/Header";
import { SupabaseBrowserConfig } from "@/components/supabase/SupabaseBrowserConfig";
import { getSettings, getTravelRoutes } from "@/lib/data";

export default async function MarketingLayout({ children }: { children: React.ReactNode }) {
  const [settings, routes] = await Promise.all([getSettings(), getTravelRoutes()]);
  return (
    <SupabaseBrowserConfig
      url={process.env.NEXT_PUBLIC_SUPABASE_URL ?? ""}
      publishableKey={process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? ""}
    >
      <Header />
      <main>{children}</main>
      <Footer settings={settings} routes={routes} />
    </SupabaseBrowserConfig>
  );
}
