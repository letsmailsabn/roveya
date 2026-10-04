"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/browser";
import { formatWhen } from "@/lib/time";

function localPhone(value: string) {
  const digits = value.replace(/\D/g, "");
  if (digits.length === 12 && digits.startsWith("91")) return digits.slice(2);
  return digits.slice(-10);
}

type Booking = { id: string; seats: number; status: string; travel_routes: { origin: string; destination: string; depart_at: string } | { origin: string; destination: string; depart_at: string }[] | null };

export function AccountPanel() {
  const [phone, setPhone] = useState("");
  const [signedIn, setSignedIn] = useState(false);
  const [ready, setReady] = useState(false);
  const [bookings, setBookings] = useState<Booking[]>([]);

  useEffect(() => {
    const supabase = createClient();
    void (async () => {
      const auth = await supabase.auth.getUser();
      setReady(true);
      if (!auth.data.user) return;
      setSignedIn(true);
      const digits = localPhone(String(auth.data.user.phone ?? auth.data.user.user_metadata?.mobile ?? ""));
      setPhone(digits);
      const profile = await supabase.from("customer_profiles").select("id").eq("auth_user_id", auth.data.user.id).maybeSingle();
      if (!profile.data) return;
      const rows = await supabase
        .from("pool_bookings")
        .select("id,seats,status,travel_routes(origin,destination,depart_at)")
        .eq("customer_id", profile.data.id)
        .order("created_at", { ascending: false });
      setBookings((rows.data ?? []) as Booking[]);
    })();
  }, []);

  async function signOut() {
    await createClient().auth.signOut();
    window.location.href = "/";
  }

  if (ready && !signedIn) {
    return (
      <article className="mx-auto max-w-xl px-5 py-20">
        <h1 className="display text-5xl">Sign in to see your trips</h1>
        <Link href="/login?next=/account" className="mt-6 inline-flex text-xs font-semibold tracking-[0.16em] text-[#D6A000]">
          SIGN IN
        </Link>
      </article>
    );
  }

  return (
    <article className="mx-auto max-w-3xl px-5 py-16">
      <p className="kicker">Your account</p>
      <h1 className="display mt-3 text-5xl">Trips</h1>
      <p className="mt-3 text-sm text-[#F6F1DC]/65">{phone ? `+91 ${phone}` : "Signed in"}</p>
      <div className="mt-8 space-y-4">
        {bookings.map((booking) => {
          const route = Array.isArray(booking.travel_routes) ? booking.travel_routes[0] : booking.travel_routes;
          return (
            <article key={booking.id} className="rounded-3xl border border-[#D6A000]/20 bg-[#241018] p-6">
              <p className="text-lg">{route ? `${route.origin} to ${route.destination}` : "Route"}</p>
              <p className="mt-1 text-sm text-[#F6F1DC]/60">{route ? formatWhen(route.depart_at) : ""} · {booking.seats} seat{booking.seats > 1 ? "s" : ""}</p>
              <p className="mt-2 text-xs uppercase tracking-[0.16em] text-[#D6A000]">{booking.status}</p>
            </article>
          );
        })}
        {bookings.length === 0 ? <p className="text-sm text-[#F6F1DC]/60">You have not requested a taxipool seat yet.</p> : null}
      </div>
      <div className="mt-8 flex gap-4">
        <Link href="/routes" className="text-xs font-semibold tracking-[0.16em] text-[#D6A000]">BOOK A TAXIPOOL</Link>
        <button type="button" onClick={() => void signOut()} className="text-xs font-semibold tracking-[0.16em] text-[#F6F1DC]/70">SIGN OUT</button>
      </div>
    </article>
  );
}
