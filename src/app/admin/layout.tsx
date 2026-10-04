import type { Metadata } from "next";
import { redirect } from "next/navigation";

export const metadata: Metadata = {
  title: "ROVEYA Operations",
  robots: { index: false, follow: false },
};

export default function AdminLayout() {
  redirect(process.env.NEXT_PUBLIC_ADMIN_URL ?? "http://localhost:3003");
}
