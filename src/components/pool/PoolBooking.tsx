"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import type { TravelRoute } from "@/lib/data";
import { createClient } from "@/lib/supabase/browser";
import { formatClock, formatWhen } from "@/lib/time";
import { formatInr } from "@/lib/validation";

type Companion = { first_name: string; seats: number; status: string };

export function PoolBooking({ route }: { route: TravelRoute }) {
  const router = useRouter();
  const [companions, setCompanions] = useState<Companion[]>([]);
  const [companionsReady, setCompanionsReady] = useState(false);
  const [seats, setSeats] = useState(1);
  const [signedIn, setSignedIn] = useState(false);
  const [notice, setNotice] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const supabase = createClient();
    void supabase.auth.getUser().then(({ data }) => setSignedIn(Boolean(data.user)));
    void loadCompanions();
    async function loadCompanions() {
      const { data } = await supabase.from("pool_companions").select("first_name,seats,status").eq("route_id", route.id);
      setCompanions((data ?? []) as Companion[]);
      setCompanionsReady(true);
    }
  }, [route.id]);

  const taken = companions.reduce((sum, person) => sum + person.seats, 0);
  const left = companionsReady ? Math.max(route.seatsTotal - taken, 0) : route.seatsLeft;

  async function requestSeat() {
    setNotice("");
    if (!signedIn) {
      router.push(`/login?next=/routes/${route.id}`);
      return;
    }
    setBusy(true);
    const supabase = createClient();
    const auth = await supabase.auth.getUser();
    const profile = await supabase.from("customer_profiles").select("id").eq("auth_user_id", auth.data.user?.id ?? "").maybeSingle();
    if (!profile.data) {
      setBusy(false);
      setNotice("Finish your account details before requesting a seat.");
      return;
    }
    const result = await supabase.from("pool_bookings").insert({
      route_id: route.id,
      customer_id: profile.data.id,
      seats,
      status: "REQUESTED",
    });
    setBusy(false);
    if (result.error) {
      setNotice(result.error.message);
      return;
    }
    setNotice("Your seat request is with the ROVEYA drivers. They will confirm your place.");
    const refreshed = await supabase.from("pool_companions").select("first_name,seats,status").eq("route_id", route.id);
    setCompanions((refreshed.data ?? []) as Companion[]);
    setCompanionsReady(true);
    router.refresh();
  }

  return (
    <article className="mx-auto grid max-w-6xl gap-10 px-5 py-16 lg:grid-cols-[1.2fr_0.8fr] lg:px-8">
      <div>
        <p className="kicker">Book taxipool</p>
        <h1 className="display mt-3 text-4xl sm:text-5xl md:text-6xl">
          {route.origin}
          <span className="mt-2 block text-3xl text-[#D6A000]">to {route.destination}</span>
        </h1>
        <p className="mt-5 text-[#F6F1DC]/75">{formatWhen(route.departAt)}</p>
        <ol className="mt-8 space-y-4 border-l border-[#D6A000]/40 pl-5">
          <li>
            <p className="text-xs uppercase tracking-[0.16em] text-[#D6A000]">Start</p>
            <p className="text-lg">{route.origin}</p>
            <p className="text-sm text-[#F6F1DC]/60">{formatClock(route.departAt)}</p>
          </li>
          <li>
            <p className="text-xs uppercase tracking-[0.16em] text-[#D6A000]">Arrive</p>
            <p className="text-lg">{route.destination}</p>
            <p className="text-sm text-[#F6F1DC]/60">{formatClock(route.arriveAt)}</p>
          </li>
        </ol>
        <div className="mt-10">
          <p className="kicker">Travelling with you</p>
          <div className="mt-4 flex flex-wrap gap-3">
            {companions.length === 0 ? <p className="text-sm text-[#F6F1DC]/60">You would be the first passenger on this taxi.</p> : null}
            {companions.map((person, index) => (
              <span key={`${person.first_name}-${index}`} className="rounded-full border border-[#D6A000]/30 px-4 py-2 text-sm">
                {person.first_name} · {person.seats} seat{person.seats > 1 ? "s" : ""}
              </span>
            ))}
          </div>
        </div>
      </div>
      <aside className="h-fit rounded-3xl border border-[#D6A000]/20 bg-[#241018] p-7">
        <p className="text-sm text-[#F6F1DC]/70">{left} of {route.seatsTotal} seats still open</p>
        <p className="mt-2 text-3xl font-semibold text-[#D6A000]">{formatInr(route.farePerSeat * seats)}</p>
        <p className="text-xs text-[#F6F1DC]/50">{formatInr(route.farePerSeat)} per seat</p>
        <div className="mt-6 grid grid-cols-4 gap-2">
          {[1, 2, 3, 4].map((count) => (
            <button
              key={count}
              type="button"
              disabled={count > left}
              onClick={() => setSeats(count)}
              className={`rounded-2xl py-3 ${seats === count ? "bg-[#6B1838] text-[#F6F1DC]" : "bg-[#12060D] text-[#F6F1DC]/80"}`}
            >
              {count}
            </button>
          ))}
        </div>
        {notice ? <p className="mt-4 text-sm text-[#E0B23A]">{notice}</p> : null}
        <button type="button" disabled={busy || left < 1} onClick={() => void requestSeat()} className="btn-primary mt-6 w-full">
          {signedIn ? "Request this seat" : "Sign in to request"}
        </button>
        {!signedIn ? (
          <p className="mt-4 text-center text-sm text-[#F6F1DC]/60">
            New here? <Link href={`/register?next=/routes/${route.id}`} className="text-[#D6A000]">Create an account</Link>
          </p>
        ) : null}
      </aside>
    </article>
  );
}
