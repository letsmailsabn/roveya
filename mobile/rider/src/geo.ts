import type { Place, VehicleKind } from "./types";

export function distanceKm(a: { latitude: number; longitude: number }, b: { latitude: number; longitude: number }) {
  const toRad = (value: number) => (value * Math.PI) / 180;
  const earth = 6371;
  const dLat = toRad(b.latitude - a.latitude);
  const dLng = toRad(b.longitude - a.longitude);
  const lat1 = toRad(a.latitude);
  const lat2 = toRad(b.latitude);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return earth * 2 * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h));
}

const rates: Record<VehicleKind, { base: number; perKm: number; min: number; minute: number }> = {
  bike: { base: 25, perKm: 7, min: 35, minute: 1 },
  auto: { base: 40, perKm: 13, min: 60, minute: 1.4 },
  cab: { base: 60, perKm: 16, min: 90, minute: 1.8 },
};

export function quoteFare(vehicle: VehicleKind, kilometers: number) {
  const rate = rates[vehicle];
  const raw = rate.base + rate.perKm * kilometers;
  return Math.max(rate.min, Math.round(raw));
}

export function quoteEta(vehicle: VehicleKind, kilometers: number) {
  return Math.max(4, Math.round(kilometers * rates[vehicle].minute + 3));
}

export function moveToward(from: Place, to: Place, progress: number): { latitude: number; longitude: number } {
  const t = Math.min(1, Math.max(0, progress));
  return {
    latitude: from.latitude + (to.latitude - from.latitude) * t,
    longitude: from.longitude + (to.longitude - from.longitude) * t,
  };
}

export function inr(amount: number) {
  return `₹${Math.round(amount).toLocaleString("en-IN")}`;
}
