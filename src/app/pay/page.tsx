import { PayExperience } from "@/components/pay/PayExperience";
import { getActiveDestinations } from "@/lib/data";

type Props = { searchParams: Promise<{ driver?: string }> };

export default async function PayPage({ searchParams }: Props) {
  const query = await searchParams;
  const driverId = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(query.driver ?? "") ? query.driver : undefined;
  const destinations = await getActiveDestinations();
  return (
    <PayExperience
      driverId={driverId}
      destinations={destinations.map((d) => ({
        id: d.id,
        name: d.name,
        farePerSeat: d.farePerSeat,
      }))}
    />
  );
}
