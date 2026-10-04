import type { Metadata } from "next";
import Link from "next/link";
import { AnalyticsPing } from "@/components/analytics/track";
import { searchTravelRoutes } from "@/lib/data";
import { formatClock, formatWhen } from "@/lib/time";
import { formatInr } from "@/lib/validation";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Book a taxipool",
  description: "Search a ROVEYA taxipool by starting point and destination, then book an open seat.",
};

type Props = { searchParams: Promise<{ from?: string; to?: string }> };

export default async function RoutesPage({ searchParams }: Props) {
  const params = await searchParams;
  const from = (params.from ?? "").trim();
  const to = (params.to ?? "").trim();
  const searched = from.length > 0 || to.length > 0;
  const ready = from.length >= 2 && to.length >= 2;
  const routes = ready ? await searchTravelRoutes(from, to) : [];

  return (
    <article className="mx-auto max-w-6xl px-5 py-12 sm:py-16 lg:px-8">
      <AnalyticsPing event="routes_viewed" />
      <p className="kicker">Taxipool</p>
      <h1 className="display mt-3 text-4xl sm:text-5xl md:text-6xl">Find a taxipool</h1>
      <p className="mt-5 max-w-2xl text-[#F6F1DC]/70">
        Enter where you are starting and where you want to go. If the desk has published that journey, you can book an open seat.
      </p>

      <form action="/routes" className="mt-8 grid gap-3 rounded-3xl border border-[#D6A000]/20 bg-[#241018] p-4 sm:grid-cols-[1fr_1fr_auto] sm:items-end sm:p-5">
        <label className="block text-xs uppercase tracking-[0.16em] text-[#D6A000]">
          From
          <input
            name="from"
            required
            minLength={2}
            defaultValue={from}
            placeholder="Hyderabad"
            className="mt-2 w-full rounded-2xl border border-[#D6A000]/30 bg-[#12060D] px-4 py-3 text-base tracking-normal text-[#F6F1DC] normal-case placeholder:text-[#F6F1DC]/35"
          />
        </label>
        <label className="block text-xs uppercase tracking-[0.16em] text-[#D6A000]">
          To
          <input
            name="to"
            required
            minLength={2}
            defaultValue={to}
            placeholder="Khammam"
            className="mt-2 w-full rounded-2xl border border-[#D6A000]/30 bg-[#12060D] px-4 py-3 text-base tracking-normal text-[#F6F1DC] normal-case placeholder:text-[#F6F1DC]/35"
          />
        </label>
        <button type="submit" className="btn-primary w-full sm:w-auto">
          Search
        </button>
      </form>

      {searched && !ready ? (
        <p className="mt-8 text-[#F6F1DC]/70">Enter both the starting point and the destination.</p>
      ) : null}

      {ready && routes.length === 0 ? (
        <div className="mt-10 rounded-3xl border border-[#D6A000]/25 bg-[#241018] p-6 sm:p-8">
          <p className="kicker">No taxipool yet</p>
          <h2 className="display mt-3 text-3xl sm:text-4xl">We are sorry</h2>
          <p className="mt-4 max-w-xl leading-7 text-[#F6F1DC]/75">
            We do not have a taxipool from {from} to {to} yet. We will start this route and cover your zone soon.
          </p>
        </div>
      ) : null}

      {routes.length > 0 ? (
        <div className="mt-10 grid gap-5 md:grid-cols-2">
          {routes.map((route) => (
            <article key={route.id} className="rounded-3xl border border-[#D6A000]/20 bg-[#241018] p-5 sm:p-8">
              <p className="text-xs uppercase tracking-[0.16em] text-[#D6A000]">{formatWhen(route.departAt)}</p>
              <h2 className="display mt-3 text-4xl">
                {route.origin}
                <span className="mt-1 block text-2xl text-[#F6F1DC]/80">to {route.destination}</span>
              </h2>
              <p className="mt-4 text-sm text-[#F6F1DC]/70">
                Leaves {formatClock(route.departAt)} · Arrives {formatClock(route.arriveAt)}
              </p>
              <p className="mt-2 text-sm text-[#F6F1DC]/60">{formatInr(route.farePerSeat)} per seat</p>
              <p className="mt-3 text-lg font-semibold text-[#D6A000]">
                {route.seatsLeft > 0
                  ? `${route.seatsLeft} seat${route.seatsLeft === 1 ? "" : "s"} available`
                  : "No seats left"}
              </p>
              {route.seatsLeft > 0 ? (
                <Link href={`/routes/${route.id}`} className="btn-primary mt-6">
                  Book taxipool
                </Link>
              ) : null}
            </article>
          ))}
        </div>
      ) : null}
    </article>
  );
}
