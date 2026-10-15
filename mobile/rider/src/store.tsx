import AsyncStorage from "@react-native-async-storage/async-storage";
import { createContext, useContext, useEffect, useMemo, useState } from "react";
import type { ActiveJob, CaptainProfile, DoneRide, RideRequest } from "./types";

type Store = {
  ready: boolean;
  profile: CaptainProfile | null;
  online: boolean;
  request: RideRequest | null;
  job: ActiveJob | null;
  today: number;
  rides: DoneRide[];
  saveProfile: (profile: CaptainProfile) => void;
  signOut: () => void;
  setOnline: (online: boolean) => void;
  setRequest: (request: RideRequest | null) => void;
  accept: () => void;
  pass: () => void;
  patchJob: (patch: Partial<ActiveJob>) => void;
  collect: () => void;
};

const key = "roveya-rider-profile";
const Ctx = createContext<Store | null>(null);

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const [ready, setReady] = useState(false);
  const [profile, setProfile] = useState<CaptainProfile | null>(null);
  const [online, setOnline] = useState(false);
  const [request, setRequest] = useState<RideRequest | null>(null);
  const [job, setJob] = useState<ActiveJob | null>(null);
  const [today, setToday] = useState(0);
  const [rides, setRides] = useState<DoneRide[]>([
    { id: "RV-2201", when: "Today, 9:15 AM", pickup: "Kukatpally", drop: "Hitech City", fare: 74, status: "Completed" },
  ]);

  useEffect(() => {
    AsyncStorage.getItem(key)
      .then((raw) => {
        if (raw) setProfile(JSON.parse(raw) as CaptainProfile);
      })
      .finally(() => setReady(true));
  }, []);

  const api = useMemo<Store>(
    () => ({
      ready,
      profile,
      online,
      request,
      job,
      today,
      rides,
      saveProfile: (next) => {
        setProfile(next);
        void AsyncStorage.setItem(key, JSON.stringify(next));
      },
      signOut: () => {
        setProfile(null);
        setOnline(false);
        setRequest(null);
        setJob(null);
        void AsyncStorage.removeItem(key);
      },
      setOnline: (value) => {
        setOnline(value);
        if (!value) setRequest(null);
      },
      setRequest,
      accept: () => {
        if (!request) return;
        setJob({ ...request, status: "toPickup", progress: 0 });
        setRequest(null);
      },
      pass: () => {
        if (request) {
          setRides((list) => [{ id: `${request.id}-pass-${Date.now()}`, when: "Just now", pickup: request.pickup.name, drop: request.drop.name, fare: 0, status: "Passed" }, ...list]);
        }
        setRequest(null);
      },
      patchJob: (patch) => setJob((current) => (current ? { ...current, ...patch } : current)),
      collect: () => {
        if (!job) return;
        setToday((value) => value + job.fare);
        setRides((list) => [{ id: `${job.id}-done-${Date.now()}`, when: "Just now", pickup: job.pickup.name, drop: job.drop.name, fare: job.fare, status: "Completed" }, ...list]);
        setJob(null);
      },
    }),
    [ready, profile, online, request, job, today, rides],
  );

  return <Ctx.Provider value={api}>{children}</Ctx.Provider>;
}

export function useStore() {
  const value = useContext(Ctx);
  if (!value) throw new Error("Store missing");
  return value;
}
