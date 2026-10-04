import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PoolBooking } from "@/components/pool/PoolBooking";
import { getTravelRoute } from "@/lib/data";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const route = await getTravelRoute(id);
  return { title: route ? `${route.origin} to ${route.destination}` : "Taxipool" };
}

export default async function RouteBookingPage({ params }: Props) {
  const { id } = await params;
  const route = await getTravelRoute(id);
  if (!route) notFound();
  return <PoolBooking route={route} />;
}
