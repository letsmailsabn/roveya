import { calculateFare } from "@/lib/fare";
import { AppError } from "@/lib/errors";

export type DestinationFare = {
  id: string;
  name: string;
  farePerSeat: number;
  active: boolean;
};

export type CustomerRecord = {
  id: string;
  name: string;
  mobile: string;
};

export type NewRide = {
  rideCode: string;
  customerId: string;
  destinationId: string;
  destinationName: string;
  seats: number;
  farePerSeat: number;
  totalAmount: number;
  status: "CREATED";
};

export type RideRepository = {
  getDestination(id: string): Promise<DestinationFare | null>;
  upsertCustomer(input: { name: string; mobile: string }): Promise<CustomerRecord>;
  nextRideCode(): Promise<string>;
  insertRide(ride: NewRide): Promise<NewRide>;
};

export async function createRideRecord(
  input: { name: string; mobile: string; seats: number; destinationId: string },
  repo: RideRepository,
) {
  const destination = await repo.getDestination(input.destinationId);
  if (!destination || !destination.active) {
    throw new AppError("Destination is not available.");
  }

  const farePerSeat = destination.farePerSeat;
  const totalAmount = calculateFare(farePerSeat, input.seats);
  const customer = await repo.upsertCustomer({ name: input.name.trim(), mobile: input.mobile });
  const rideCode = await repo.nextRideCode();

  return repo.insertRide({
    rideCode,
    customerId: customer.id,
    destinationId: destination.id,
    destinationName: destination.name,
    seats: input.seats,
    farePerSeat,
    totalAmount,
    status: "CREATED",
  });
}
