import AsyncStorage from "@react-native-async-storage/async-storage";
import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { coupons, seedRides } from "./data";
import type { ActiveTrip, PastRide, PayMethod, Place, VehicleKind } from "./types";

type Session = { phone: string; name: string };

type Store = {
  ready: boolean;
  session: Session | null;
  pickup: Place | null;
  wallet: number;
  rides: PastRide[];
  trip: ActiveTrip | null;
  home: Place | null;
  work: Place | null;
  signIn: (session: Session) => void;
  signOut: () => void;
  setPickup: (place: Place) => void;
  setHome: (place: Place) => void;
  setWork: (place: Place) => void;
  applyCoupon: (code: string, fare: number) => { fare: number; note: string };
  startTrip: (trip: ActiveTrip) => void;
  patchTrip: (patch: Partial<ActiveTrip>) => void;
  finishTrip: (rating: number) => void;
  cancelTrip: () => void;
  payFromWallet: (amount: number) => boolean;
  addWallet: (amount: number) => void;
};

const key = "roveya-customer-session";
const Ctx = createContext<Store | null>(null);

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const [ready, setReady] = useState(false);
  const [session, setSession] = useState<Session | null>(null);
  const [pickup, setPickupState] = useState<Place | null>(null);
  const [wallet, setWallet] = useState(250);
  const [rides, setRides] = useState<PastRide[]>(seedRides);
  const [trip, setTrip] = useState<ActiveTrip | null>(null);
  const [home, setHomeState] = useState<Place | null>(null);
  const [work, setWorkState] = useState<Place | null>(null);

  useEffect(() => {
    AsyncStorage.getItem(key)
      .then((raw) => {
        if (raw) setSession(JSON.parse(raw) as Session);
      })
      .finally(() => setReady(true));
  }, []);

  const api = useMemo<Store>(
    () => ({
      ready,
      session,
      pickup,
      wallet,
      rides,
      trip,
      home,
      work,
      signIn: (next) => {
        setSession(next);
        void AsyncStorage.setItem(key, JSON.stringify(next));
      },
      signOut: () => {
        setSession(null);
        setTrip(null);
        void AsyncStorage.removeItem(key);
      },
      setPickup: setPickupState,
      setHome: setHomeState,
      setWork: setWorkState,
      applyCoupon: (code, fare) => {
        const off = coupons[code.trim().toUpperCase()] ?? 0;
        if (!off) return { fare, note: "That code is not active." };
        if (fare < 100) return { fare, note: "Add a longer ride to use this code." };
        return { fare: Math.max(35, fare - off), note: `₹${off} taken off.` };
      },
      startTrip: setTrip,
      patchTrip: (patch) => setTrip((current) => (current ? { ...current, ...patch } : current)),
      finishTrip: () => {
        if (!trip) return;
        setRides((list) => [
          {
            id: trip.id,
            when: "Just now",
            pickup: trip.pickup.name,
            drop: trip.drop.name,
            vehicle: trip.vehicle,
            fare: trip.fare,
            status: "Completed",
          },
          ...list,
        ]);
        setTrip(null);
      },
      cancelTrip: () => {
        if (trip) {
          setRides((list) => [
            {
              id: trip.id,
              when: "Just now",
              pickup: trip.pickup.name,
              drop: trip.drop.name,
              vehicle: trip.vehicle,
              fare: 0,
              status: "Cancelled",
            },
            ...list,
          ]);
        }
        setTrip(null);
      },
      payFromWallet: (amount) => {
        if (wallet < amount) return false;
        setWallet((value) => value - amount);
        return true;
      },
      addWallet: (amount) => setWallet((value) => value + amount),
    }),
    [ready, session, pickup, wallet, rides, trip, home, work],
  );

  return <Ctx.Provider value={api}>{children}</Ctx.Provider>;
}

export function useStore() {
  const value = useContext(Ctx);
  if (!value) throw new Error("Store missing");
  return value;
}

export type { PayMethod, VehicleKind };
