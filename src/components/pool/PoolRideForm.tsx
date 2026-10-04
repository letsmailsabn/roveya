"use client";

import { useEffect, useRef, useState } from "react";
import { GoogleSignIn } from "@/components/auth/GoogleSignIn";
import { seatsAreTight } from "@/lib/pool";
import type { MapPoint, SearchTrip } from "@/lib/pool";
import { createClient } from "@/lib/supabase/browser";
import { kolkataDay } from "@/lib/time";
import { formatInr } from "@/lib/validation";

function clock24(value: string) {
  return new Intl.DateTimeFormat("en-GB", {
    timeZone: "Asia/Kolkata",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).format(new Date(value));
}

function durationLabel(minutes: number) {
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  if (hours <= 0) return `${rest}m`;
  return rest ? `${hours}h${String(rest).padStart(2, "0")}` : `${hours}h`;
}

function mapFrame(from: MapPoint, to: MapPoint) {
  const pad = 0.35;
  const minLat = Math.min(from.lat, to.lat) - pad;
  const maxLat = Math.max(from.lat, to.lat) + pad;
  const minLng = Math.min(from.lng, to.lng) - pad;
  const maxLng = Math.max(from.lng, to.lng) + pad;
  return `https://www.openstreetmap.org/export/embed.html?bbox=${encodeURIComponent(`${minLng},${minLat},${maxLng},${maxLat}`)}&layer=mapnik&marker=${from.lat}%2C${from.lng}`;
}

type SortKey = "earliest" | "price" | "depart" | "arrive" | "short";

const sorts: { id: SortKey; label: string }[] = [
  { id: "earliest", label: "Earliest departure" },
  { id: "price", label: "Lowest price" },
  { id: "depart", label: "Close to departure point" },
  { id: "arrive", label: "Close to arrival point" },
  { id: "short", label: "Shortest ride" },
];

function dayLabel(value: string, today: string) {
  if (value === today) return "Today";
  return new Intl.DateTimeFormat("en-IN", {
    timeZone: "Asia/Kolkata",
    day: "numeric",
    month: "short",
  }).format(new Date(`${value}T12:00:00+05:30`));
}

function HurryMark() {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-[#D6A000] bg-[#6B1838] px-3 py-1 text-[10px] font-semibold tracking-[0.16em] text-[#E0B23A] uppercase">
      <svg viewBox="0 0 24 24" className="h-3.5 w-3.5 animate-pulse" aria-hidden="true">
        <circle cx="12" cy="12" r="8" fill="none" stroke="#D6A000" strokeWidth="1.6" />
        <path d="M12 8v5l3 2" fill="none" stroke="#E0B23A" strokeWidth="1.6" strokeLinecap="round" />
      </svg>
      Hurry
    </span>
  );
}

type Suggestion = { label: string; placeId: string };

function PlaceField({
  label,
  value,
  onChange,
  onPin,
  places,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  onPin: (label: string, point: MapPoint) => void;
  places: string[];
}) {
  const field = useRef<HTMLLabelElement>(null);
  const requestId = useRef(0);
  const timer = useRef<number | null>(null);
  const session = useRef(crypto.randomUUID());
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [hint, setHint] = useState("");
  const [found, setFound] = useState<Suggestion[]>([]);

  function knownPlaces(query: string): Suggestion[] {
    return places
      .filter((place) => place.toLowerCase().includes(query.toLowerCase()))
      .slice(0, 6)
      .map((place) => ({ label: place, placeId: "" }));
  }

  function lookup(next: string) {
    onChange(next);
    setOpen(true);
    setHint("");
    const query = next.trim();
    const id = ++requestId.current;
    if (timer.current) window.clearTimeout(timer.current);
    const known = knownPlaces(query);
    if (query.length < 2) {
      setLoading(false);
      setFound(known);
      return;
    }
    setFound(known);
    setLoading(true);
    timer.current = window.setTimeout(() => {
      const params = new URLSearchParams({ q: query, session: session.current });
      void fetch(`/api/pool/places?${params}`)
        .then((response) => response.json())
        .then((payload: { places?: Suggestion[]; hint?: string } | null) => {
          if (id !== requestId.current) return;
          const merged = [...known, ...(payload?.places ?? [])];
          const unique = merged.filter((place, index) => merged.findIndex((item) => item.label.toLowerCase() === place.label.toLowerCase()) === index);
          setFound(unique.slice(0, 8));
          setHint(unique.length > 0 ? "" : payload?.hint ?? "");
          if (field.current?.contains(document.activeElement)) setOpen(true);
        })
        .catch(() => {
          if (id === requestId.current) setFound(known);
        })
        .finally(() => {
          if (id === requestId.current) setLoading(false);
        });
    }, 280);
  }

  async function choose(place: Suggestion) {
    onChange(place.label);
    setOpen(false);
    if (!place.placeId) return;
    const params = new URLSearchParams({ placeId: place.placeId, session: session.current });
    session.current = crypto.randomUUID();
    const response = await fetch(`/api/pool/place?${params}`);
    const payload = (await response.json().catch(() => null)) as { lat?: number; lng?: number } | null;
    if (payload && Number.isFinite(payload.lat) && Number.isFinite(payload.lng)) {
      onPin(place.label, { lat: payload.lat as number, lng: payload.lng as number });
    }
  }

  return (
    <label ref={field} className={`relative block min-w-0 flex-1 border-b border-[#12060D]/10 px-5 py-3 md:border-b-0 md:border-r ${open ? "z-30" : ""}`}>
      <span className="text-[11px] font-semibold tracking-[0.14em] text-[#4C102C]/70 uppercase">{label}</span>
      <input
        value={value}
        onChange={(event) => lookup(event.target.value)}
        onFocus={() => lookup(value)}
        onBlur={() => {
          window.setTimeout(() => {
            if (!field.current?.contains(document.activeElement)) setOpen(false);
          }, 160);
        }}
        placeholder="City, stop, or landmark"
        autoComplete="off"
        className="mt-1 w-full bg-transparent text-base font-medium text-[#12060D] outline-none placeholder:font-normal placeholder:text-[#12060D]/40"
        aria-label={label}
      />
      {open && (found.length > 0 || loading || hint) ? (
        <ul className="absolute left-0 z-30 mt-1 w-[min(24rem,80vw)] overflow-hidden rounded-2xl border border-[#D6A000]/30 bg-[#F6F1DC] text-left shadow-lg">
          {found.map((place) => (
            <li key={`${place.placeId}:${place.label}`}>
              <button
                type="button"
                className="block w-full px-4 py-2.5 text-left text-sm hover:bg-[#6B1838]/10"
                onMouseDown={(event) => event.preventDefault()}
                onClick={() => void choose(place)}
              >
                {place.label}
              </button>
            </li>
          ))}
          {loading ? <li className="px-4 py-2 text-xs text-[#12060D]/50">Looking up places…</li> : null}
          {!loading && hint ? <li className="px-4 py-3 text-sm text-[#12060D]/70">{hint}</li> : null}
        </ul>
      ) : null}
    </label>
  );
}

export function PoolRideForm({
  places,
  initialFrom = "",
  initialTo = "",
}: {
  places: string[];
  initialFrom?: string;
  initialTo?: string;
}) {
  const today = kolkataDay(new Date());
  const [from, setFrom] = useState(initialFrom);
  const [to, setTo] = useState(initialTo);
  const [date, setDate] = useState(today);
  const [seats, setSeats] = useState(1);
  const [results, setResults] = useState<SearchTrip[]>([]);
  const [fromPoint, setFromPoint] = useState<MapPoint | null>(null);
  const [toPoint, setToPoint] = useState<MapPoint | null>(null);
  const [mapUrl, setMapUrl] = useState("");
  const [pins, setPins] = useState<Record<string, MapPoint>>({});
  const [sort, setSort] = useState<SortKey>("earliest");
  const [searched, setSearched] = useState(false);
  const [labelFrom, setLabelFrom] = useState(initialFrom);
  const [labelTo, setLabelTo] = useState(initialTo);
  const [notice, setNotice] = useState("");
  const [bookedId, setBookedId] = useState("");
  const [needSignIn, setNeedSignIn] = useState(false);
  const [pendingId, setPendingId] = useState("");
  const [searching, setSearching] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!initialFrom || !initialTo || initialFrom.trim().toLowerCase() === initialTo.trim().toLowerCase()) return;
    let ignore = false;
    setSearching(true);
    void fetch(`/api/pool/search?from=${encodeURIComponent(initialFrom)}&to=${encodeURIComponent(initialTo)}&date=${today}`)
      .then((response) => response.json())
      .then((payload: { trips?: SearchTrip[]; fromPoint?: MapPoint | null; toPoint?: MapPoint | null; mapUrl?: string }) => {
        if (ignore) return;
        setResults(payload.trips ?? []);
        setFromPoint(payload.fromPoint ?? null);
        setToPoint(payload.toPoint ?? null);
        setMapUrl(payload.mapUrl ?? "");
        setLabelFrom(initialFrom);
        setLabelTo(initialTo);
        setSearched(true);
      })
      .finally(() => {
        if (!ignore) setSearching(false);
      });
    return () => {
      ignore = true;
    };
  }, [initialFrom, initialTo, today]);

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    setNotice("");
    setBookedId("");
    setNeedSignIn(false);
    if (!from || !to) {
      setResults([]);
      setSearched(true);
      setNotice("Choose where you leave from and where you are going.");
      return;
    }
    if (from.trim().toLowerCase() === to.trim().toLowerCase()) {
      setResults([]);
      setSearched(true);
      setNotice("The starting city and the destination need to be different.");
      return;
    }
    setSearching(true);
    const params = new URLSearchParams({ from, to, date });
    const start = pins[`from:${from}`];
    const end = pins[`to:${to}`];
    if (start) {
      params.set("fromLat", String(start.lat));
      params.set("fromLng", String(start.lng));
    }
    if (end) {
      params.set("toLat", String(end.lat));
      params.set("toLng", String(end.lng));
    }
    const response = await fetch(`/api/pool/search?${params}`);
    const payload = (await response.json().catch(() => null)) as { trips?: SearchTrip[]; fromPoint?: MapPoint | null; toPoint?: MapPoint | null; mapUrl?: string; error?: string } | null;
    setSearching(false);
    setSearched(true);
    if (!response.ok) {
      setResults([]);
      setFromPoint(null);
      setToPoint(null);
      setMapUrl("");
      setNotice(payload?.error ?? "That search could not be completed.");
      return;
    }
    setResults(payload?.trips ?? []);
    setFromPoint(payload?.fromPoint ?? null);
    setToPoint(payload?.toPoint ?? null);
    setMapUrl(payload?.mapUrl ?? "");
    setLabelFrom(from);
    setLabelTo(to);
    setNotice("");
  }

  async function book(routeId: string) {
    setNotice("");
    const supabase = createClient();
    const auth = await supabase.auth.getUser();
    if (!auth.data.user) {
      setPendingId(routeId);
      setNeedSignIn(true);
      setNotice("Sign in with your mobile number, then this seat is booked.");
      return;
    }
    setBusy(true);
    const response = await fetch("/api/pool/book", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ routeId, seats }),
    });
    const payload = (await response.json().catch(() => null)) as { error?: string; seatsLeft?: number } | null;
    setBusy(false);
    if (!response.ok) {
      setNotice(payload?.error ?? "The desk could not take this booking.");
      return;
    }
    setNeedSignIn(false);
    setBookedId(routeId);
    setResults((current) =>
      current.map((trip) => (trip.id === routeId ? { ...trip, seatsLeft: payload?.seatsLeft ?? trip.seatsLeft } : trip)),
    );
    setNotice("Booked. The ROVEYA desk has this seat now.");
  }

  const sorted = [...results].sort((a, b) => {
    if (sort === "price") return a.farePerSeat - b.farePerSeat || a.departAt.localeCompare(b.departAt);
    if (sort === "depart") return (a.originKm ?? 999) - (b.originKm ?? 999) || a.departAt.localeCompare(b.departAt);
    if (sort === "arrive") return (a.destinationKm ?? 999) - (b.destinationKm ?? 999) || a.departAt.localeCompare(b.departAt);
    if (sort === "short") return a.rideMinutes - b.rideMinutes || a.departAt.localeCompare(b.departAt);
    return a.departAt.localeCompare(b.departAt);
  });
  const directions = fromPoint && toPoint
    ? `https://www.google.com/maps/dir/?api=1&origin=${fromPoint.lat},${fromPoint.lng}&destination=${toPoint.lat},${toPoint.lng}&travelmode=driving`
    : "";

  return (
    <div>
      <form
        onSubmit={(event) => void onSubmit(event)}
        className="overflow-visible rounded-[28px] border border-[#D6A000]/50 bg-[#F6F1DC] text-[#12060D] shadow-[0_18px_50px_rgba(0,0,0,0.28)] md:flex md:items-stretch"
      >
        <PlaceField label="From" value={from} onChange={setFrom} onPin={(label, point) => setPins((current) => ({ ...current, [`from:${label}`]: point }))} places={places} />
        <PlaceField label="To" value={to} onChange={setTo} onPin={(label, point) => setPins((current) => ({ ...current, [`to:${label}`]: point }))} places={places} />
        <label className="relative block min-w-0 flex-1 border-b border-[#12060D]/10 px-5 py-3 md:border-b-0 md:border-r">
          <span className="text-[11px] font-semibold tracking-[0.14em] text-[#4C102C]/70 uppercase">Departure</span>
          <span className="mt-1 block text-base font-medium">{dayLabel(date, today)}</span>
          <input
            type="date"
            value={date}
            min={today}
            onChange={(event) => setDate(event.target.value || today)}
            className="absolute inset-0 cursor-pointer opacity-0"
            aria-label="Departure date"
            required
          />
        </label>
        <label className="block min-w-0 flex-1 px-5 py-3">
          <span className="text-[11px] font-semibold tracking-[0.14em] text-[#4C102C]/70 uppercase">Passengers</span>
          <select value={seats} onChange={(event) => setSeats(Number(event.target.value))} className="mt-1 w-full bg-transparent text-base font-medium outline-none" aria-label="Passengers">
            {[1, 2, 3, 4].map((count) => (
              <option key={count} value={count}>{count} passenger{count > 1 ? "s" : ""}</option>
            ))}
          </select>
        </label>
        <button
          type="submit"
          disabled={searching}
          className="w-full rounded-b-[28px] bg-[#6B1838] px-8 py-4 text-[13px] font-semibold tracking-[0.16em] text-[#F6F1DC] uppercase transition hover:bg-[#4C102C] disabled:opacity-40 md:w-auto md:rounded-none md:rounded-r-[28px] md:px-10"
        >
          {searching ? "Searching…" : "Search"}
        </button>
      </form>

      {notice ? <p className={`mt-4 text-sm ${bookedId ? "text-[#E0B23A]" : "text-[#F6F1DC]/80"}`}>{notice}</p> : null}

      {searched && from && to && from.trim().toLowerCase() !== to.trim().toLowerCase() ? (
        <div className="mt-8 lg:grid lg:grid-cols-[17rem_minmax(0,1fr)] lg:items-start lg:gap-8">
          <aside className="mb-6 lg:mb-0">
            {fromPoint && toPoint ? (
              <div className="overflow-hidden rounded-3xl border border-[#D6A000]/25 bg-[#F6F1DC]">
                <iframe title="Route map" src={mapUrl || mapFrame(fromPoint, toPoint)} className="h-72 w-full border-0" loading="lazy" />
                <a href={directions} target="_blank" rel="noreferrer" className="block bg-[#6B1838] py-3 text-center text-sm font-semibold text-[#F6F1DC]">
                  Show on map
                </a>
              </div>
            ) : null}
            <fieldset className="mt-5">
              <legend className="text-sm font-semibold text-[#F6F1DC]">Sort by</legend>
              <div className="mt-3 space-y-2">
                {sorts.map((item) => (
                  <label key={item.id} className="flex cursor-pointer items-center gap-2 text-sm text-[#F6F1DC]/80">
                    <input
                      type="radio"
                      name="sort"
                      checked={sort === item.id}
                      onChange={() => setSort(item.id)}
                      className="accent-[#D6A000]"
                    />
                    {item.label}
                  </label>
                ))}
              </div>
            </fieldset>
          </aside>
          <div>
            <div className="mb-4 flex items-end justify-between gap-4">
              <h2 className="text-lg font-semibold text-[#F6F1DC]">
                {dayLabel(date, today)} {labelFrom} → {labelTo}
              </h2>
              <p className="text-sm text-[#F6F1DC]/60">
                {sorted.length} ride{sorted.length === 1 ? "" : "s"}
              </p>
            </div>
            {sorted.length > 0 ? (
              <ul className="space-y-4">
                {sorted.map((route) => {
                  const tight = seatsAreTight(route.seatsLeft, route.seatsTotal);
                  const booked = bookedId === route.id;
                  const closed = route.seatsLeft < seats;
                  const driverName = route.driver?.name.split(" ")[0] ?? "Driver";
                  const rating = route.driver?.ratingAverage;
                  return (
                    <li key={route.id}>
                      <article className="rounded-3xl bg-[#F6F1DC] px-4 py-4 text-[#12060D] sm:px-5">
                        <div className="flex items-start justify-between gap-4">
                          <div className="grid min-w-0 flex-1 grid-cols-[auto_minmax(4rem,1fr)_auto] items-start gap-3">
                            <div>
                              <p className="text-lg font-semibold">{clock24(route.departAt)}</p>
                              <p className="mt-1 max-w-32 text-sm">{route.origin}</p>
                            </div>
                            <div className="pt-2 text-center">
                              <p className="text-[11px] text-[#12060D]/55">{durationLabel(route.rideMinutes)}</p>
                              <div className="relative mt-1 h-px bg-[#12060D]/25">
                                <span className="absolute -left-0.5 -top-1 h-2 w-2 rounded-full border border-[#12060D]/40 bg-[#F6F1DC]" />
                                <span className="absolute -right-0.5 -top-1 h-2 w-2 rounded-full border border-[#12060D]/40 bg-[#F6F1DC]" />
                              </div>
                            </div>
                            <div className="text-right">
                              <p className="text-lg font-semibold">{clock24(route.arriveAt)}</p>
                              <p className="mt-1 max-w-32 text-sm">{route.destination}</p>
                            </div>
                          </div>
                          <p className="text-2xl font-semibold text-[#6B1838]">{formatInr(route.farePerSeat * seats)}</p>
                        </div>
                        <div className="mt-4 flex flex-wrap items-center gap-3 border-t border-[#12060D]/10 pt-3">
                          <span className="flex h-8 w-8 items-center justify-center overflow-hidden rounded-full bg-[#4C102C] text-[11px] font-semibold text-[#E0B23A]">
                            {route.driver?.photoUrl ? (
                              <img src={route.driver.photoUrl} alt="" className="h-full w-full object-cover" />
                            ) : (
                              driverName.slice(0, 1)
                            )}
                          </span>
                          <p className="text-sm font-medium">
                            {driverName}
                            {rating != null ? <span className="ml-2 text-[#D6A000]">★ {rating.toFixed(1)}</span> : null}
                          </p>
                          <p className="text-xs text-[#12060D]/55">
                            {route.seatsLeft === 0 ? "No seats left" : `${route.seatsLeft} seat${route.seatsLeft === 1 ? "" : "s"} left`}
                          </p>
                          {tight ? <HurryMark /> : null}
                          <button
                            type="button"
                            disabled={busy || closed || booked}
                            onClick={() => void book(route.id)}
                            className="ml-auto rounded-full bg-[#6B1838] px-5 py-2 text-sm font-semibold text-[#F6F1DC] disabled:opacity-40"
                          >
                            {booked ? "Booked" : closed ? "Full" : "Book"}
                          </button>
                        </div>
                      </article>
                    </li>
                  );
                })}
              </ul>
            ) : (
              <article className="rounded-3xl bg-[#F6F1DC] px-5 py-8 text-[#12060D]">
                <h2 className="text-2xl font-semibold">Nothing is published for this search</h2>
                <p className="mt-3 text-sm text-[#12060D]/70">
                  {date === today
                    ? `No ROVEYA taxi leaves near ${labelFrom} for ${labelTo} today.`
                    : `No ROVEYA taxi leaves near ${labelFrom} for ${labelTo} on ${dayLabel(date, today)}.`}
                  {" "}Try another day or another place.
                </p>
              </article>
            )}
          </div>
        </div>
      ) : null}

      {needSignIn ? (
        <div className="mt-5 max-w-md rounded-3xl border border-[#D6A000]/30 bg-[#241018] p-5">
          <GoogleSignIn next="/routes" />
        </div>
      ) : null}
    </div>
  );
}
