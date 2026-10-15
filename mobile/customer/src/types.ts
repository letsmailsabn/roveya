import type { ImageSourcePropType } from "react-native";

export type VehicleKind = "bike" | "auto" | "cab";
export type PayMethod = "cash" | "wallet";

export type Place = {
  id: string;
  name: string;
  subtitle: string;
  latitude: number;
  longitude: number;
};

export type Captain = {
  name: string;
  rating: number;
  vehicleNo: string;
  vehicleName: string;
  trips: number;
  photo: ImageSourcePropType;
};

export type PastRide = {
  id: string;
  when: string;
  pickup: string;
  drop: string;
  vehicle: VehicleKind;
  fare: number;
  status: "Completed" | "Cancelled";
};

export type TripStatus =
  | "searching"
  | "assigned"
  | "arrived"
  | "onTrip"
  | "payment"
  | "rating"
  | "done";

export type ActiveTrip = {
  id: string;
  pickup: Place;
  drop: Place;
  vehicle: VehicleKind;
  fare: number;
  distanceKm: number;
  etaMin: number;
  payment: PayMethod;
  otp: string;
  captain: Captain;
  status: TripStatus;
  progress: number;
  serverId?: string;
};
