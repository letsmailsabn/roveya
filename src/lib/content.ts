import type { ComponentType } from "react";
import {
  IconComfort,
  IconFare,
  IconGroup,
  IconHeart,
  IconPay,
  IconRoute,
  IconSeat,
} from "@/components/brand/Icons";

export const TRUST = [
  { title: "Your own seat", copy: "One passenger to a seat. The place is allocated to you.", Icon: IconSeat },
  { title: "A clean cabin", copy: "The seat is cleaned and prepared before you sit.", Icon: IconComfort },
  { title: "Room on purpose", copy: "A 7-seater carries only four or five passengers.", Icon: IconGroup },
  { title: "Pay from your seat", copy: "The fare is per person, clear before you pay.", Icon: IconPay },
] as const;

export const SERVICES: { title: string; copy: string; Icon: ComponentType<{ className?: string }> }[] = [
  {
    title: "Your own seat",
    copy: "The seat is allocated to one passenger. Two people are never combined into one place.",
    Icon: IconSeat,
  },
  {
    title: "A clean cabin",
    copy: "Seats are cleaned before boarding, so you sit down on a fresh surface.",
    Icon: IconComfort,
  },
  {
    title: "Four or five passengers",
    copy: "The car has seven seats. We leave one or two open so the cabin stays comfortable.",
    Icon: IconGroup,
  },
  {
    title: "Mineral water",
    copy: "A basic sealed bottle is kept ready as part of the ride.",
    Icon: IconHeart,
  },
  {
    title: "A planned break",
    copy: "On a longer journey you step out once, then return to the same seat.",
    Icon: IconRoute,
  },
  {
    title: "Luggage attended to",
    copy: "Your luggage is collected and placed before you sit, clear of the passenger beside you.",
    Icon: IconFare,
  },
];

export const EXTRA_QUOTES = [
  {
    id: "sample-meera",
    name: "Meera Patel",
    route: "Khammam",
    rating: 5,
    quote: "My seat stayed mine for the whole journey. Nobody was asked to share it.",
  },
  {
    id: "sample-karthik",
    name: "Karthik Naidu",
    route: "Nalgonda",
    rating: 5,
    quote: "The seat was clean when I sat down, and the cabin stayed comfortable.",
  },
  {
    id: "sample-divya",
    name: "Divya Sharma",
    route: "Suryapet",
    rating: 5,
    quote: "We stopped once on the longer ride, then I came back to the same seat.",
  },
  {
    id: "sample-arjun",
    name: "Arjun Reddy",
    route: "Hyderabad",
    rating: 5,
    quote: "My bag was taken and placed before I boarded. I just sat down.",
  },
  {
    id: "sample-lakshmi",
    name: "Lakshmi Devi",
    route: "Vijayawada",
    rating: 5,
    quote: "There was room in the car, and a water bottle was already waiting.",
  },
  {
    id: "sample-harish",
    name: "Harish Goud",
    route: "Khammam",
    rating: 5,
    quote: "Four of us travelled, and two seats stayed open. The fare was clear before I paid.",
  },
];

export const REASONS = [
  { n: "01", t: "One seat, one passenger", d: "Your place is allocated before the journey settles." },
  { n: "02", t: "Clean before you sit", d: "Hygiene is part of the fare, prepared before boarding." },
  { n: "03", t: "Space we keep open", d: "Four or five passengers in a 7-seater, with room left on purpose." },
  { n: "04", t: "A planned break", d: "On a longer journey you step out, then return to the same seat." },
  { n: "05", t: "Luggage attended to", d: "Your bag is collected and placed before you board." },
  { n: "06", t: "A clear fare", d: "You pay for your seat, from the car, for the amount you already saw." },
];
