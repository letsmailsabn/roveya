import { PayExperience } from "@/components/pay/PayExperience";
import { getActiveDestinations } from "@/lib/data";

export default async function PayPage() {
  const destinations = await getActiveDestinations();
  return (
    <PayExperience
      destinations={destinations.map((d) => ({
        id: d.id,
        name: d.name,
        farePerSeat: d.farePerSeat,
      }))}
    />
  );
}
