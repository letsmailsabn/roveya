import "server-only";
import { mkdirSync, readFileSync, writeFileSync } from "fs";
import path from "path";
import { calculateFare } from "@/lib/fare";
import { AppError } from "@/lib/errors";
import { slugify } from "@/lib/validation";
import type { StaffSession } from "@/lib/auth";

type Destination = {
  id: string;
  name: string;
  slug: string;
  description: string;
  farePerSeat: number;
  active: boolean;
  sortOrder: number;
};

type Customer = { id: string; name: string; mobile: string; createdAt: string };
type Ride = {
  id: string;
  publicId: string;
  customerId: string;
  destinationId: string;
  seats: number;
  farePerSeat: number;
  totalFare: number;
  status: "CREATED" | "PAYMENT_PENDING" | "CASH_PENDING" | "PAID" | "PAYMENT_FAILED" | "CANCELLED";
  paymentMethod: "RAZORPAY" | "CASH" | null;
  createdAt: string;
};
type Message = { id: string; name: string; mobile: string; email: string | null; message: string; createdAt: string };
type Testimonial = { id: string; name: string; route: string | null; rating: number; quote: string; published: boolean; createdAt: string };
type Settings = {
  phone: string;
  whatsapp: string;
  email: string;
  address: string;
  hours: string;
  instagramUrl: string | null;
  facebookUrl: string | null;
  twitterUrl: string | null;
};

type Store = {
  destinations: Destination[];
  customers: Customer[];
  rides: Ride[];
  messages: Message[];
  testimonials: Testimonial[];
  settings: Settings;
  rideSeq: number;
};

const filePath = path.join(process.cwd(), "data", "local-admin.json");

function seed(): Store {
  return {
    rideSeq: 2,
    settings: {
      phone: "+91 90000 00000",
      whatsapp: "919000000000",
      email: "hello@roveya.com",
      address: "ROVEYA Travel Desk, Khammam, Telangana, India",
      hours: "Daily, 5:00 AM – 11:00 PM",
      instagramUrl: null,
      facebookUrl: null,
      twitterUrl: null,
    },
    destinations: [
      ["11111111-1111-4111-8111-111111111111", "Khammam", 500, "Comfortable intercity travel to Khammam.", 1],
      ["22222222-2222-4222-8222-222222222222", "Warangal", 450, "Reliable journeys to Warangal.", 2],
      ["33333333-3333-4333-8333-333333333333", "Nalgonda", 400, "Straightforward travel to Nalgonda.", 3],
      ["44444444-4444-4444-8444-444444444444", "Vijayawada", 700, "Longer-distance travel to Vijayawada.", 4],
      ["55555555-5555-4555-8555-555555555555", "Suryapet", 350, "Convenient travel to Suryapet.", 5],
      ["66666666-6666-4666-8666-666666666666", "Hyderabad", 800, "Premium journeys to Hyderabad.", 6],
    ].map(([id, name, fare, description, sort]) => ({
      id: String(id),
      name: String(name),
      slug: slugify(String(name)),
      description: String(description),
      farePerSeat: Number(fare),
      active: true,
      sortOrder: Number(sort),
    })),
    customers: [{ id: "cust-local-1", name: "Ravi Kumar", mobile: "9876543210", createdAt: new Date().toISOString() }],
    rides: [
      {
        id: "ride-local-1",
        publicId: "RV-2026-000001",
        customerId: "cust-local-1",
        destinationId: "11111111-1111-4111-8111-111111111111",
        seats: 2,
        farePerSeat: 500,
        totalFare: 1000,
        status: "CASH_PENDING",
        paymentMethod: "CASH",
        createdAt: new Date().toISOString(),
      },
    ],
    messages: [
      {
        id: "msg-local-1",
        name: "Sneha Rao",
        mobile: "9123456780",
        email: "sneha@example.com",
        message: "Please share the first departure toward Hyderabad.",
        createdAt: new Date().toISOString(),
      },
    ],
    testimonials: [
      {
        id: "quote-local-1",
        name: "Ananya Reddy",
        route: "Hyderabad",
        rating: 5,
        quote: "Smooth journey, transparent pricing and a very convenient payment experience.",
        published: true,
        createdAt: new Date().toISOString(),
      },
    ],
  };
}

function readStore(): Store {
  try {
    return JSON.parse(readFileSync(filePath, "utf8")) as Store;
  } catch {
    const initial = seed();
    writeStore(initial);
    return initial;
  }
}

function writeStore(store: Store) {
  mkdirSync(path.dirname(filePath), { recursive: true });
  writeFileSync(filePath, JSON.stringify(store, null, 2));
}

function paymentStatus(status: Ride["status"]) {
  if (status === "PAID") return "PAID";
  if (status === "PAYMENT_FAILED" || status === "CANCELLED") return "FAILED";
  return "PENDING";
}

function viewRide(store: Store, ride: Ride) {
  const customer = store.customers.find((item) => item.id === ride.customerId);
  const destination = store.destinations.find((item) => item.id === ride.destinationId);
  return {
    id: ride.id,
    publicId: ride.publicId,
    customerName: customer?.name ?? "",
    mobile: customer?.mobile ?? "",
    seats: ride.seats,
    destinationName: destination?.name ?? "",
    farePerSeat: ride.farePerSeat,
    totalFare: ride.totalFare,
    paymentMethod: ride.paymentMethod,
    paymentStatus: paymentStatus(ride.status),
    rideStatus: ride.status,
  };
}

export function devListRides() {
  const store = readStore();
  return store.rides
    .slice()
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    .map((ride) => viewRide(store, ride));
}

export function devListDestinations() {
  return readStore()
    .destinations.slice()
    .sort((a, b) => a.sortOrder - b.sortOrder)
    .map((item) => ({ ...item, description: item.description }));
}

export function devActiveDestinations() {
  return devListDestinations()
    .filter((item) => item.active)
    .map((item) => ({
      id: item.id,
      name: item.name,
      slug: item.slug,
      description: item.description,
      farePerSeat: item.farePerSeat,
    }));
}

export function devCreateDestination(input: { name: string; farePerSeat: number; description: string; active: boolean; sortOrder: number }) {
  const store = readStore();
  const created = {
    id: crypto.randomUUID(),
    name: input.name,
    slug: slugify(input.name),
    description: input.description,
    farePerSeat: input.farePerSeat,
    active: input.active,
    sortOrder: input.sortOrder,
  };
  store.destinations.push(created);
  writeStore(store);
  return created;
}

export function devUpdateDestination(id: string, input: { name?: string; farePerSeat?: number; description?: string; active?: boolean }) {
  const store = readStore();
  const current = store.destinations.find((item) => item.id === id);
  if (!current) throw new AppError("Destination not found", 404);
  if (input.name) {
    current.name = input.name;
    current.slug = slugify(input.name);
  }
  if (typeof input.farePerSeat === "number") current.farePerSeat = input.farePerSeat;
  if (typeof input.description === "string") current.description = input.description;
  if (typeof input.active === "boolean") current.active = input.active;
  writeStore(store);
  return current;
}

export function devListCustomers() {
  const store = readStore();
  return store.customers.map((customer) => {
    const rides = store.rides.filter((ride) => ride.customerId === customer.id && ride.status === "PAID");
    return {
      id: customer.id,
      name: customer.name,
      mobile: customer.mobile,
      totalRides: rides.length,
      totalSeats: rides.reduce((sum, ride) => sum + ride.seats, 0),
      totalSpent: rides.reduce((sum, ride) => sum + ride.totalFare, 0),
      averageRating: null,
    };
  });
}

export function devListMessages() {
  return readStore().messages;
}

export function devListTestimonials() {
  return readStore().testimonials;
}

export function devPublishedTestimonials() {
  return devListTestimonials()
    .filter((item) => item.published)
    .map(({ id, name, route, rating, quote }) => ({ id, name, route, rating, quote }));
}

export function devSetTestimonialPublished(id: string, published: boolean) {
  const store = readStore();
  const item = store.testimonials.find((entry) => entry.id === id);
  if (!item) throw new AppError("Testimonial not found", 404);
  item.published = published;
  writeStore(store);
  return item;
}

export function devGetSettings() {
  return readStore().settings;
}

export function devUpdateSettings(input: Settings) {
  const store = readStore();
  store.settings = input;
  writeStore(store);
  return store.settings;
}

export function devAddMessage(input: { name: string; mobile: string; email: string | null; message: string }) {
  const store = readStore();
  store.messages.unshift({ id: crypto.randomUUID(), createdAt: new Date().toISOString(), ...input });
  writeStore(store);
}

export function devCreateRide(input: { name: string; mobile: string; seats: number; destinationId: string }) {
  const store = readStore();
  const destination = store.destinations.find((item) => item.id === input.destinationId && item.active);
  if (!destination) throw new AppError("Destination is not available.");
  let customer = input.mobile ? store.customers.find((item) => item.mobile === input.mobile) : undefined;
  if (customer) customer.name = input.name.trim();
  else {
    customer = { id: crypto.randomUUID(), name: input.name.trim(), mobile: input.mobile, createdAt: new Date().toISOString() };
    store.customers.push(customer);
  }
  store.rideSeq += 1;
  const ride: Ride = {
    id: crypto.randomUUID(),
    publicId: `RV-2026-${String(store.rideSeq).padStart(6, "0")}`,
    customerId: customer.id,
    destinationId: destination.id,
    seats: input.seats,
    farePerSeat: destination.farePerSeat,
    totalFare: calculateFare(destination.farePerSeat, input.seats),
    status: "CREATED",
    paymentMethod: null,
    createdAt: new Date().toISOString(),
  };
  store.rides.unshift(ride);
  writeStore(store);
  return viewRide(store, ride);
}

export function devGetRide(publicId: string) {
  const store = readStore();
  const ride = store.rides.find((item) => item.publicId === publicId);
  if (!ride) throw new AppError("Ride not found", 404);
  const view = viewRide(store, ride);
  return {
    publicId: view.publicId,
    seats: view.seats,
    destinationName: view.destinationName,
    farePerSeat: view.farePerSeat,
    totalFare: view.totalFare,
    paymentMethod: view.paymentMethod,
    paymentStatus: view.paymentStatus,
    rideStatus: view.rideStatus,
  };
}

export function devStartCash(publicId: string) {
  const store = readStore();
  const ride = store.rides.find((item) => item.publicId === publicId);
  if (!ride) throw new AppError("Ride not found", 404);
  if (ride.status === "PAID") throw new AppError("This ride is already paid.");
  ride.status = "CASH_PENDING";
  ride.paymentMethod = "CASH";
  writeStore(store);
  return viewRide(store, ride);
}

export function devSlideCash(publicId: string) {
  return devConfirmCash(publicId, { id: "customer", authUserId: "customer", email: "", name: "Passenger", role: "ADMIN" });
}

export function devConfirmCash(publicId: string, _staff: StaffSession) {
  const store = readStore();
  const ride = store.rides.find((item) => item.publicId === publicId);
  if (!ride || ride.status !== "CASH_PENDING") throw new AppError("This ride is not waiting for cash confirmation.");
  ride.status = "PAID";
  writeStore(store);
  return devGetRide(publicId);
}
