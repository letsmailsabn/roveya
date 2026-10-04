export type PoolDriver = {
  id: string;
  name: string;
  vehicleName: string | null;
  vehicleNumber: string;
  photoUrl: string | null;
  ratingAverage: number | null;
  ratingCount: number;
};

export type TravelRoute = {
  id: string;
  origin: string;
  destination: string;
  departAt: string;
  arriveAt: string;
  farePerSeat: number;
  seatsTotal: number;
  seatsLeft: number;
  notes: string | null;
  driver: PoolDriver | null;
};

export type MapPoint = { lat: number; lng: number };

export type SearchTrip = TravelRoute & {
  originKm: number | null;
  destinationKm: number | null;
  rideMinutes: number;
};

export function seatsAreTight(seatsLeft: number, seatsTotal: number) {
  return seatsLeft > 0 && seatsLeft <= 2 && seatsLeft < seatsTotal;
}
