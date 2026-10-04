import type { Metadata } from "next";
import Link from "next/link";
import { AnalyticsPing } from "@/components/analytics/track";
import { getTravelRoutes } from "@/lib/data";
import { formatClock, formatWhen } from "@/lib/time";
import { formatInr } from "@/lib/validation";

export const metadata: Metadata = {
  title: "Routes",
  description: "Book a ROVEYA taxipool from a starting city to a destination, with departure and arrival times.",
};

export default async function RoutesPage() {
  const routes = await getTravelRoutes();
  return (
    <article className="mx-auto max-w-6xl px-5 py-16 lg:px-8">
      <AnalyticsPing event="routes_viewed" />
      <p className="kicker">Taxipool</p>
          <h1 className="display mt-3 text-4xl sm:text-5xl md:text-6xl">Our routes</h1>
      <p className="mt-5 max-w-2xl text-[#F6F1DC]/70">
        Every trip has a starting point and a destination, plus the time it leaves and the time it arrives. You travel with other passengers in the same taxi.
      </p>
      <div className="mt-12 grid gap-5 md:grid-cols-2">
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
            <p className="mt-2 text-sm text-[#F6F1DC]/60">{route.seatsTotal} seats in the taxi · {formatInr(route.farePerSeat)} per seat</p>
            <Link href={`/routes/${route.id}`} className="btn-primary mt-6">
              Book taxipool
            </Link>
          </article>
        ))}
        {routes.length === 0 ? <p className="text-[#F6F1DC]/60">Routes will appear here once the desk publishes them.</p> : null}
      </div>
    </article>
  );
}
