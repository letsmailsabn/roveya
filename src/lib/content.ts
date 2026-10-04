import type { ComponentType } from "react";
import {
  IconComfort,
  IconDistance,
  IconFare,
  IconGroup,
  IconHeart,
  IconPay,
  IconPoint,
  IconRoute,
  IconSeat,
} from "@/components/brand/Icons";

export const TRUST = [
  { title: "Comfortable travel", copy: "Well-kept vehicles and a calm journey.", Icon: IconComfort },
  { title: "Transparent fares", copy: "Per-seat pricing you can see before you pay.", Icon: IconFare },
  { title: "Easy digital payments", copy: "Scan, confirm and pay from inside the vehicle.", Icon: IconPay },
  { title: "Customer first", copy: "A service designed around how people actually travel.", Icon: IconHeart },
] as const;

export const SERVICES: { title: string; copy: string; Icon: ComponentType<{ className?: string }> }[] = [
  {
    title: "Point-to-Point Travel",
    copy: "Direct, comfortable travel between planned destinations without unnecessary stops.",
    Icon: IconPoint,
  },
  {
    title: "Long Distance Travel",
    copy: "Settled, reliable journeys for longer routes with clear pricing from the start.",
    Icon: IconDistance,
  },
  {
    title: "Route-Based Travel",
    copy: "Travel along ROVEYA’s active routes with a consistent, professional experience.",
    Icon: IconRoute,
  },
  {
    title: "Group Travel",
    copy: "Pay for multiple seats in one step when travelling together.",
    Icon: IconGroup,
  },
  {
    title: "Comfortable Journeys",
    copy: "A calm, well-kept travel environment designed around passenger comfort.",
    Icon: IconSeat,
  },
  {
    title: "Digital Ride Payments",
    copy: "Scan the in-vehicle QR, confirm your seats and pay without leaving your seat.",
    Icon: IconPay,
  },
];

export const REASONS = [
  { n: "01", t: "Transparent pricing", d: "Clear per-seat pricing with no manual calculation." },
  { n: "02", t: "Easy digital payments", d: "Pay quickly using a secure digital payment process." },
  { n: "03", t: "Reliable journeys", d: "A simple and dependable travel experience." },
  { n: "04", t: "Customer first", d: "Designed around customer convenience." },
  { n: "05", t: "Simple experience", d: "No complicated booking process for existing passengers." },
  { n: "06", t: "Modern service", d: "Digital payments and ride records make every journey easier." },
];
