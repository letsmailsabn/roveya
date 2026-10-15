import type { Place } from "./types";

export const portraits = {
  self: require("../assets/people/captain-ravi.jpg"),
  rider: require("../assets/people/rider-priya.jpg"),
};

export const DEMO_LOGIN_CODE = "1234";
export const DEMO_TRIP_CODE = "4821";

export const places: Place[] = [
  { id: "charminar", name: "Charminar", subtitle: "Hyderabad", latitude: 17.3616, longitude: 78.4747 },
  { id: "hitech", name: "Hitech City", subtitle: "Hyderabad", latitude: 17.4435, longitude: 78.3772 },
  { id: "gachibowli", name: "Gachibowli", subtitle: "Hyderabad", latitude: 17.4401, longitude: 78.3489 },
  { id: "secunderabad", name: "Secunderabad Station", subtitle: "Hyderabad", latitude: 17.4399, longitude: 78.4983 },
  { id: "airport", name: "Rajiv Gandhi Airport", subtitle: "Shamshabad", latitude: 17.2403, longitude: 78.4294 },
  { id: "khammam", name: "Khammam Bus Station", subtitle: "Khammam", latitude: 17.2473, longitude: 80.1514 },
  { id: "kukatpally", name: "Kukatpally", subtitle: "Hyderabad", latitude: 17.4948, longitude: 78.3996 },
];

export const cities = ["Hyderabad", "Khammam", "Vijayawada", "Warangal", "Nalgonda", "Suryapet", "Karimnagar"];
