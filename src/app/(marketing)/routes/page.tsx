import type { Metadata } from "next";
import { AnalyticsPing } from "@/components/analytics/track";
import { PoolRideForm } from "@/components/pool/PoolRideForm";
import { getTravelRoutes } from "@/lib/data";

export const metadata: Metadata = {
  title: "Pool a Ride",
  description: "Search a ROVEYA taxipool and book a seat. The desk sees it immediately, with the seats still open.",
};

type Props = { searchParams: Promise<{ from?: string; to?: string }> };

export default async function RoutesPage({ searchParams }: Props) {
  const routes = await getTravelRoutes();
  const query = await searchParams;
  return (
    <article className="mx-auto max-w-6xl px-5 py-16 lg:px-8">
      <AnalyticsPing event="routes_viewed" />
      <p className="kicker">Taxipool</p>
      <h1 className="display mt-3 text-4xl sm:text-5xl md:text-6xl">Pool a ride</h1>
      <p className="mt-5 max-w-2xl text-[#F6F1DC]/70">
        Search a city or place, then book from the taxi that appears. If nothing is published, you will see that here.
      </p>
      <div className="mt-8">
        <PoolRideForm
          places={[...new Set(routes.flatMap((route) => [route.origin, route.destination]))]}
          initialFrom={query.from ?? ""}
          initialTo={query.to ?? ""}
        />
      </div>
    </article>
  );
}
