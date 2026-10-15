export type VehicleKind = "bike" | "auto" | "cab";

export type Place = {
  id: string;
  name: string;
  subtitle: string;
  latitude: number;
  longitude: number;
};

export type CaptainProfile = {
  phone: string;
  name: string;
  city: string;
  vehicle: VehicleKind;
  vehicleNo: string;
  vehicleName: string;
  licence: string;
  accountLast4: string;
  ifsc: string;
  agreed: boolean;
};

export type RideRequest = {
  id: string;
  customer: string;
  pickup: Place;
  drop: Place;
  fare: number;
  distanceKm: number;
  otp: string;
};

export type RiderTripStatus = "toPickup" | "arrived" | "onTrip" | "collect" | "done";

export type ActiveJob = RideRequest & { status: RiderTripStatus; progress: number };

export type DoneRide = {
  id: string;
  when: string;
  pickup: string;
  drop: string;
  fare: number;
  status: "Completed" | "Passed";
};
