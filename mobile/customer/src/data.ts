import type { Captain, PastRide, Place, VehicleKind } from "./types";

export const portraits = {
  rider: require("../assets/people/rider-shaik.jpg"),
  priya: require("../assets/people/rider-priya.jpg"),
  ravi: require("../assets/people/captain-ravi.jpg"),
  meera: require("../assets/people/captain-meera.jpg"),
  arjun: require("../assets/people/captain-arjun.jpg"),
};

export const DEMO_LOGIN_CODE = "1234";
export const DEMO_TRIP_CODE = "4821";

export const places: Place[] = [
  { id: "hitech", name: "Hitech City", subtitle: "Hyderabad", latitude: 17.4435, longitude: 78.3772 },
  { id: "gachibowli", name: "Gachibowli", subtitle: "Hyderabad", latitude: 17.4401, longitude: 78.3489 },
  { id: "charminar", name: "Charminar", subtitle: "Hyderabad", latitude: 17.3616, longitude: 78.4747 },
  { id: "secunderabad", name: "Secunderabad Station", subtitle: "Hyderabad", latitude: 17.4399, longitude: 78.4983 },
  { id: "kukatpally", name: "Kukatpally", subtitle: "Hyderabad", latitude: 17.4948, longitude: 78.3996 },
  { id: "airport", name: "Rajiv Gandhi Airport", subtitle: "Shamshabad", latitude: 17.2403, longitude: 78.4294 },
  { id: "khammam", name: "Khammam Bus Station", subtitle: "Khammam", latitude: 17.2473, longitude: 80.1514 },
  { id: "vijayawada", name: "Vijayawada", subtitle: "Benz Circle", latitude: 16.5062, longitude: 80.648 },
  { id: "warangal", name: "Warangal", subtitle: "Hanamkonda", latitude: 18.0001, longitude: 79.5882 },
  { id: "nalgonda", name: "Nalgonda", subtitle: "Nalgonda", latitude: 17.0575, longitude: 79.2671 },
  { id: "suryapet", name: "Suryapet", subtitle: "Suryapet", latitude: 17.1405, longitude: 79.6204 },
  { id: "karimnagar", name: "Karimnagar", subtitle: "Karimnagar", latitude: 18.4386, longitude: 79.1288 },
  { id: "kottagudem", name: "Kottagudem", subtitle: "Bhadradri", latitude: 17.551, longitude: 80.6197 },
];

export const fallbackHere: Place = {
  id: "here",
  name: "Banjara Hills",
  subtitle: "Current area",
  latitude: 17.4156,
  longitude: 78.4347,
};

export const captains: Record<VehicleKind, Captain> = {
  bike: { name: "Ravi Kumar", rating: 4.92, vehicleNo: "TS09 AB 2146", vehicleName: "Honda SP 125", trips: 1840, photo: portraits.ravi },
  auto: { name: "Meera Patel", rating: 4.86, vehicleNo: "TS10 U 3391", vehicleName: "Bajaj RE", trips: 960, photo: portraits.meera },
  cab: { name: "Arjun Reddy", rating: 4.95, vehicleNo: "TS07 EA 1184", vehicleName: "Ertiga CNG", trips: 720, photo: portraits.arjun },
};

export const vehicleCopy: Record<VehicleKind, { title: string; seats: string; note: string }> = {
  bike: { title: "Bike", seats: "1 seat", note: "Fastest through traffic" },
  auto: { title: "Auto", seats: "3 seats", note: "Door to door" },
  cab: { title: "Cab", seats: "4 seats", note: "A seat of your own" },
};

export const seedRides: PastRide[] = [
  {
    id: "RV-1042",
    when: "Yesterday, 8:40 PM",
    pickup: "Banjara Hills",
    drop: "Hitech City",
    vehicle: "bike",
    fare: 86,
    status: "Completed",
  },
  {
    id: "RV-1038",
    when: "12 Sep, 6:10 PM",
    pickup: "Secunderabad Station",
    drop: "Charminar",
    vehicle: "auto",
    fare: 164,
    status: "Completed",
  },
];

export const coupons: Record<string, number> = {
  ROVEYA50: 50,
};
