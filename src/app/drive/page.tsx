import type { Metadata } from "next";
import { SupabaseBrowserConfig } from "@/components/supabase/SupabaseBrowserConfig";
import { DriveDesk } from "@/components/pay/DriveDesk";

export const metadata: Metadata = {
  title: "Driver cash",
  robots: { index: false, follow: false },
};

export default function DrivePage() {
  return (
    <SupabaseBrowserConfig
      url={process.env.NEXT_PUBLIC_SUPABASE_URL ?? ""}
      publishableKey={process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? ""}
    >
      <main className="mx-auto flex min-h-dvh max-w-md flex-col items-center bg-[#12060D] px-5 py-12 text-[#F6F1DC]">
        <p className="mb-6 text-xs uppercase tracking-[0.22em] text-[#D6A000]">ROVEYA driver</p>
        <DriveDesk />
      </main>
    </SupabaseBrowserConfig>
  );
}
