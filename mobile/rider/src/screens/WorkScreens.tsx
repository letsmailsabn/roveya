import { useEffect, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as Location from "expo-location";
import type { CompositeScreenProps } from "@react-navigation/native";
import type { BottomTabScreenProps } from "@react-navigation/bottom-tabs";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { gateway } from "../api";
import { BrandHeader } from "../components/Logo";
import { Avatar } from "../components/kit";
import { regionAround, RideMap } from "../components/RideMap";
import { Button } from "../components/ui";
import { DEMO_TRIP_CODE, places, portraits } from "../data";
import { distanceKm, inr, moveToward, quoteFare } from "../geo";
import { useStore } from "../store";
import { colors } from "../theme";
import type { RiderStack, RiderTabs } from "../navigation";

type TabProps<T extends keyof RiderTabs> = CompositeScreenProps<BottomTabScreenProps<RiderTabs, T>, NativeStackScreenProps<RiderStack>>;

export function CaptainHome({ navigation }: TabProps<"Duty">) {
  const store = useStore();
  const [here, setHere] = useState(places[0]);
  const [left, setLeft] = useState(20);

  useEffect(() => {
    void (async () => {
      try {
        const permission = await Location.requestForegroundPermissionsAsync();
        if (!permission.granted) return;
        const position = await Location.getCurrentPositionAsync({});
        setHere({
          id: "gps",
          name: "Your location",
          subtitle: "This phone",
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        });
      } catch {
        setHere(places[0]);
      }
    })();
  }, []);

  useEffect(() => {
    if (!store.online || !store.profile) return;
    void gateway(`/v1/captains/${encodeURIComponent(store.profile.phone)}/presence`, {
      online: true,
      latitude: here.latitude,
      longitude: here.longitude,
      vehicle: store.profile.vehicle,
      name: store.profile.name,
    });
    return () => {
      void gateway(`/v1/captains/${encodeURIComponent(store.profile?.phone || "")}/presence`, { online: false });
    };
  }, [store.online, store.profile, here.latitude, here.longitude]);

  useEffect(() => {
    if (!store.online || store.request || store.job || !store.profile) return;
    const poll = setInterval(() => {
      void gateway<{ offer: null | { id: string; riderName?: string; pickup: typeof here; drop: typeof here; fare: number; distanceKm: number; otp: string } }>(
        `/v1/matching/offers?phone=${encodeURIComponent(store.profile?.phone || "")}`,
      ).then((result) => {
        if (!result?.offer || store.request || store.job) return;
        const offer = result.offer;
        store.setRequest({
          id: offer.id,
          customer: offer.riderName || "ROVEYA rider",
          pickup: offer.pickup,
          drop: offer.drop,
          fare: offer.fare,
          distanceKm: offer.distanceKm,
          otp: offer.otp,
        });
      });
    }, 2000);
    const timer = setTimeout(() => {
      const pickup = here;
      const drop = places.find((place) => distanceKm(pickup, place) > 1) ?? places[1];
      const kilometers = distanceKm(pickup, drop);
      const kind = store.profile?.vehicle ?? "bike";
      store.setRequest({
        id: `RV-${Date.now().toString().slice(-6)}`,
        customer: "Priya Nair",
        pickup,
        drop,
        fare: quoteFare(kind, kilometers),
        distanceKm: kilometers,
        otp: DEMO_TRIP_CODE,
      });
    }, 8000);
    return () => {
      clearInterval(poll);
      clearTimeout(timer);
    };
  }, [store.online, store.request, store.job, store.profile, here]);

  useEffect(() => {
    if (!store.request) return;
    let remaining = 20;
    setLeft(20);
    const tick = setInterval(() => {
      remaining -= 1;
      setLeft(remaining);
      if (remaining <= 0) {
        clearInterval(tick);
        store.pass();
      }
    }, 1000);
    return () => clearInterval(tick);
  }, [store.request]);

  const insets = useSafeAreaInsets();
  return (
    <View style={styles.fill}>
      <ScrollView contentContainerStyle={[styles.plain, { paddingTop: Math.max(insets.top, 12) + 8 }]}>
        <View style={styles.topCard}>
          <Avatar source={portraits.self} size={48} name={store.profile?.name} />
          <View style={{ flex: 1 }}>
            <Text style={styles.name}>{store.profile?.name}</Text>
            <Text style={styles.meta}>{store.profile?.vehicleName}</Text>
            <Text style={styles.meta}>{store.profile?.vehicleNo}</Text>
          </View>
          <Pressable style={[styles.toggle, store.online && styles.toggleOn]} onPress={() => store.setOnline(!store.online)}>
            <Text style={styles.toggleText}>{store.online ? "Online" : "Go online"}</Text>
          </Pressable>
        </View>
        <View style={styles.mapCard}>
          <RideMap
            region={regionAround(here.latitude, here.longitude, 0.08)}
            markers={[{ id: "you", latitude: here.latitude, longitude: here.longitude, title: "You", pin: colors.burgundy }]}
          />
        </View>
        {store.request ? (
          <View style={styles.card}>
            <View style={styles.requestHead}>
              <Avatar source={portraits.rider} size={52} name={store.request.customer} />
              <View style={{ flex: 1 }}>
                <Text style={styles.kicker}>New request · {Math.max(left, 0)}s</Text>
                <Text style={styles.name}>{store.request.customer}</Text>
                <Text style={styles.meta}>{store.request.pickup.name} to {store.request.drop.name}</Text>
              </View>
              <Text style={styles.fare}>{inr(store.request.fare)}</Text>
            </View>
            <Text style={styles.meta}>{store.request.distanceKm.toFixed(1)} km · Cash</Text>
            <Button label="Accept" onPress={() => {
              void gateway(`/v1/rides/${store.request?.id}/accept`, { phone: store.profile?.phone, name: store.profile?.name, vehicleNo: store.profile?.vehicleNo, vehicleName: store.profile?.vehicleName });
              store.accept();
              navigation.navigate("Job");
            }} />
            <Pressable onPress={() => {
              void gateway(`/v1/rides/${store.request?.id}/pass`, { phone: store.profile?.phone });
              store.pass();
            }}><Text style={styles.pass}>Pass</Text></Pressable>
          </View>
        ) : (
          <View style={styles.card}>
            <Text style={styles.name}>{store.online ? "Waiting for a request" : "You are offline"}</Text>
            <Text style={styles.meta}>{store.online ? "Stay in this area. Requests appear here." : "Go online when you are ready for a ride."}</Text>
            <Text style={styles.kicker}>Today {inr(store.today)}</Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

export function JobScreen({ navigation }: NativeStackScreenProps<RiderStack, "Job">) {
  const store = useStore();
  const job = store.job;
  const [code, setCode] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    if (!job || job.status !== "onTrip") return;
    const timer = setTimeout(() => {
      const next = Math.min(1, job.progress + 0.25);
      store.patchJob({ progress: next, status: next >= 1 ? "collect" : "onTrip" });
    }, 1600);
    return () => clearTimeout(timer);
  }, [job, store]);

  if (!job) {
    return (
      <View style={styles.plain}>
        <Text style={styles.title}>No active ride</Text>
        <Button label="Back" onPress={() => navigation.navigate("Tabs")} />
      </View>
    );
  }

  const point = job.status === "toPickup" || job.status === "arrived"
    ? moveToward(job.drop, job.pickup, 0.15)
    : moveToward(job.pickup, job.drop, job.progress);

  return (
    <View style={styles.fill}>
      <View style={styles.header}>
        <BrandHeader kicker="Captain" />
      </View>
      <RideMap
        region={regionAround(point.latitude, point.longitude, 0.08)}
        line={[job.pickup, job.drop]}
        markers={[
          { id: "pickup", latitude: job.pickup.latitude, longitude: job.pickup.longitude, title: "Pickup", pin: colors.goldBright },
          { id: "drop", latitude: job.drop.latitude, longitude: job.drop.longitude, title: "Drop", pin: colors.gold },
          { id: "you", latitude: point.latitude, longitude: point.longitude, title: "You", pin: colors.goldBright },
        ]}
      />
      <View style={styles.sheet}>
        <Text style={styles.kicker}>ROVEYA · {job.id}</Text>
        <Text style={styles.title}>
          {job.status === "toPickup" ? `Pick up ${job.customer}` : job.status === "arrived" ? "Ask for the trip code" : job.status === "onTrip" ? "Ride in progress" : "Collect the fare"}
        </Text>
        <Text style={styles.sub}>{job.pickup.name} to {job.drop.name}</Text>
        <Text style={styles.fare}>{inr(job.fare)} cash</Text>
        {job.status === "toPickup" ? <Button label="I've arrived" onPress={() => { store.patchJob({ status: "arrived" }); void gateway(`/v1/rides/${job.id}/status`, { status: "arrived" }); }} /> : null}
        {job.status === "arrived" ? (
          <>
            <TextInput value={code} onChangeText={setCode} keyboardType="number-pad" placeholder="Trip code" placeholderTextColor={colors.faint} style={styles.input} />
            {error ? <Text style={styles.error}>{error}</Text> : null}
            <Text style={styles.sub}>Demo code {DEMO_TRIP_CODE}, the same code the customer sees.</Text>
            <Button
              label="Start ride"
              onPress={() => {
                if (code !== job.otp) {
                  setError("That code does not match.");
                  return;
                }
                store.patchJob({ status: "onTrip", progress: 0.1 });
                void gateway(`/v1/rides/${job.id}/status`, { status: "onTrip", otp: code });
              }}
            />
          </>
        ) : null}
        {job.status === "collect" ? (
          <Button
            label="Cash collected"
            onPress={() => {
              store.collect();
              void gateway(`/v1/rides/${job.id}/status`, { status: "payment" });
              navigation.navigate("Tabs");
            }}
          />
        ) : null}
      </View>
    </View>
  );
}

export function EarningsScreen() {
  const store = useStore();
  const insets = useSafeAreaInsets();
  const done = store.rides.filter((ride) => ride.status === "Completed").length;
  return (
    <View style={styles.scroll}>
      <ScrollView contentContainerStyle={[styles.plain, { paddingTop: Math.max(insets.top, 12) + 8 }]}>
        <Text style={styles.pageTitle}>Earnings</Text>
        <View style={styles.card}>
          <Text style={styles.sub}>Collected today</Text>
          <Text style={styles.earnings}>{inr(store.today)}</Text>
          <Text style={styles.sub}>Week so far includes a sample morning ride of ₹74.</Text>
        </View>
        <View style={styles.card}>
          <Text style={styles.name}>Incentive</Text>
          <Text style={styles.sub}>Complete 3 rides today for ₹150 extra. {Math.min(done, 3)} of 3 done.</Text>
        </View>
        <View style={styles.group}>
          {store.rides.map((ride, index) => (
            <View key={`${ride.id}-${index}`} style={[styles.menuRow, index < store.rides.length - 1 && styles.menuLine]}>
              <View style={{ flex: 1 }}>
                <Text style={styles.name}>{ride.pickup} to {ride.drop}</Text>
                <Text style={styles.sub}>{ride.when} · {ride.status}</Text>
              </View>
              <Text style={styles.name}>{ride.fare ? inr(ride.fare) : "Passed"}</Text>
            </View>
          ))}
        </View>
      </ScrollView>
    </View>
  );
}

export function ProfileScreen() {
  const store = useStore();
  const insets = useSafeAreaInsets();
  const profile = store.profile;
  const rows = [
    ["Vehicle", `${profile?.vehicle ?? ""} · ${profile?.vehicleName ?? ""}`],
    ["Number", profile?.vehicleNo ?? ""],
    ["Licence", profile?.licence ?? ""],
    ["Payout", `Account ending ${profile?.accountLast4 ?? ""} · ${profile?.ifsc ?? ""}`],
    ["Rating", "4.90 · documents on file with the ROVEYA desk"],
  ];
  return (
    <View style={styles.scroll}>
      <ScrollView contentContainerStyle={[styles.plain, { paddingTop: Math.max(insets.top, 12) + 8 }]}>
        <Text style={styles.pageTitle}>Profile</Text>
        <View style={styles.group}>
          <View style={styles.menuRow}>
            <Avatar source={portraits.self} size={48} name={profile?.name} />
            <View style={{ flex: 1 }}>
              <Text style={styles.profileName}>{(profile?.name || "Captain").toUpperCase()}</Text>
              <Text style={styles.sub}>{profile?.phone}</Text>
            </View>
            <Text style={{ color: "#C0C0C0", fontSize: 18 }}>›</Text>
          </View>
          <View style={styles.menuLine} />
          <View style={styles.menuRow}>
            <Text style={{ color: colors.burgundy, fontSize: 16 }}>★</Text>
            <Text style={[styles.name, { flex: 1 }]}>4.90  My Rating</Text>
            <Text style={{ color: "#C0C0C0", fontSize: 18 }}>›</Text>
          </View>
        </View>
        <View style={styles.group}>
          {rows.map(([label, value], index) => (
            <View key={label} style={[styles.menuRow, index < rows.length - 1 && styles.menuLine]}>
              <View style={{ flex: 1 }}>
                <Text style={styles.kicker}>{label}</Text>
                <Text style={styles.name}>{value}</Text>
              </View>
            </View>
          ))}
        </View>
        <Button label="Log out" tone="ghost" onPress={() => store.signOut()} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1, backgroundColor: colors.night },
  scroll: { flex: 1, backgroundColor: colors.night },
  plain: { paddingHorizontal: 16, gap: 14, paddingBottom: 120 },
  header: { position: "absolute", top: 0, left: 0, right: 0, zIndex: 2 },
  topCard: { backgroundColor: colors.paper, borderRadius: 20, padding: 14, flexDirection: "row", alignItems: "center", gap: 12, borderWidth: 1, borderColor: colors.line },
  mapCard: { height: 280, borderRadius: 20, overflow: "hidden", borderWidth: 1, borderColor: colors.line },
  sheet: { position: "absolute", left: 16, right: 16, bottom: 16, backgroundColor: colors.sheet, paddingHorizontal: 16, paddingTop: 16, paddingBottom: 16, borderRadius: 20, gap: 10, borderWidth: 1, borderColor: colors.line },
  requestHead: { flexDirection: "row", alignItems: "center", gap: 12 },
  profile: { flexDirection: "row", alignItems: "center", gap: 14 },
  pageTitle: { color: colors.ink, fontSize: 28, fontWeight: "700" },
  profileName: { color: colors.ink, fontSize: 16, fontWeight: "700" },
  title: { color: colors.cream, fontSize: 22, fontWeight: "600" },
  name: { color: colors.cream, fontSize: 15, fontWeight: "600" },
  meta: { color: colors.muted, fontSize: 13, marginTop: 2 },
  sub: { color: colors.muted, lineHeight: 20, fontSize: 13 },
  kicker: { color: colors.muted, fontSize: 12 },
  fare: { color: colors.burgundy, fontSize: 20, fontWeight: "700" },
  earnings: { color: colors.burgundy, fontSize: 36, fontWeight: "700" },
  toggle: { borderRadius: 20, paddingVertical: 10, paddingHorizontal: 14, alignItems: "center", backgroundColor: colors.burgundy },
  toggleOn: { backgroundColor: colors.cherry },
  toggleText: { color: colors.onAccent, fontWeight: "600", fontSize: 13 },
  pass: { color: colors.burgundy, textAlign: "center", paddingVertical: 8 },
  card: { backgroundColor: colors.paper, borderRadius: 20, padding: 16, gap: 8, borderWidth: 1, borderColor: colors.line },
  group: { backgroundColor: colors.paper, borderRadius: 20, paddingHorizontal: 14, borderWidth: 1, borderColor: colors.line },
  menuRow: { flexDirection: "row", alignItems: "center", gap: 12, paddingVertical: 14 },
  menuLine: { borderBottomWidth: 1, borderBottomColor: colors.line },
  input: { backgroundColor: colors.paper, color: colors.ink, borderRadius: 14, height: 52, paddingHorizontal: 16, paddingVertical: 0, fontSize: 16, lineHeight: 52, borderWidth: 1, borderColor: colors.line },
  error: { color: colors.burgundy },
});
