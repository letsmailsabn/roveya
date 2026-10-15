import { useEffect, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { gateway } from "../api";
import { BrandHeader } from "../components/Logo";
import { regionAround, RideMap } from "../components/RideMap";
import { Button } from "../components/ui";
import { Avatar, CodeDigits, Plate, Radar, SheetHandle } from "../components/kit";
import { moveToward, inr } from "../geo";
import { useStore } from "../store";
import { colors } from "../theme";
import { vehicleCopy } from "../data";
import type { CustomerStack } from "../navigation";

const cancelReasons = ["Plans changed", "Captain is too far", "Booked by mistake", "Fare is higher than expected"];

export function TripScreen({ navigation }: NativeStackScreenProps<CustomerStack, "Trip">) {
  const store = useStore();
  const trip = store.trip;
  const [stars, setStars] = useState(5);
  const [cancelling, setCancelling] = useState(false);
  const [paidNote, setPaidNote] = useState("");

  useEffect(() => {
    if (!trip?.serverId || trip.status === "rating" || trip.status === "done") return;
    const timer = setInterval(() => {
      void gateway<{ status: string; captain: typeof trip.captain }>(`/v1/rides/${trip.serverId}`).then((live) => {
        if (!live || !trip) return;
        const order = ["searching", "assigned", "arrived", "onTrip", "payment", "rating", "done"];
        if (order.indexOf(live.status) > order.indexOf(trip.status)) {
          store.patchTrip({
            status: live.status as typeof trip.status,
            captain: { ...(live.captain || trip.captain), photo: trip.captain.photo },
          });
        }
      });
    }, 2000);
    return () => clearInterval(timer);
  }, [trip?.serverId, trip?.status, store]);

  useEffect(() => {
    if (!trip) return;
    if (trip.serverId && trip.status === "searching") return;
    if (trip.status !== "searching" && trip.status !== "assigned" && trip.status !== "onTrip") return;
    const timer = setTimeout(() => {
      if (trip.status === "searching") store.patchTrip({ status: "assigned" });
      if (trip.status === "assigned" && !trip.serverId) store.patchTrip({ status: "arrived" });
      if (trip.status === "onTrip") store.patchTrip({ progress: Math.min(1, trip.progress + 0.2), status: trip.progress + 0.2 >= 1 ? "payment" : "onTrip" });
    }, trip.status === "onTrip" ? 1600 : trip.status === "searching" ? 12000 : 2800);
    return () => clearTimeout(timer);
  }, [trip, store]);

  if (!trip) {
    return (
      <View style={styles.screen}>
        <Text style={styles.title}>No ride in progress</Text>
        <Button label="Back home" onPress={() => navigation.navigate("Tabs")} />
      </View>
    );
  }

  const captainPoint = trip.status === "onTrip" || trip.status === "payment" || trip.status === "rating"
    ? moveToward(trip.pickup, trip.drop, trip.progress)
    : moveToward(
        { ...trip.pickup, latitude: trip.pickup.latitude + 0.01, longitude: trip.pickup.longitude + 0.01 },
        trip.pickup,
        trip.status === "arrived" ? 1 : 0.45,
      );

  const headline =
    trip.status === "searching" ? "Finding a captain" :
    trip.status === "assigned" ? `${trip.captain.name} is on the way` :
    trip.status === "arrived" ? "Captain has arrived" :
    trip.status === "onTrip" ? "You are on the ride" :
    trip.status === "payment" ? "Settle the fare" :
    trip.status === "rating" ? "How was the ride?" :
    "Ride complete";

  return (
    <View style={styles.fill}>
      <View style={styles.header}>
        <BrandHeader />
      </View>
      <RideMap
        region={regionAround(captainPoint.latitude, captainPoint.longitude, Math.max(0.05, trip.distanceKm / 80))}
        line={[trip.pickup, trip.drop]}
        markers={[
          { id: "pickup", latitude: trip.pickup.latitude, longitude: trip.pickup.longitude, title: "Pickup", pin: colors.goldBright },
          { id: "drop", latitude: trip.drop.latitude, longitude: trip.drop.longitude, title: "Drop", pin: colors.gold },
          { id: "captain", latitude: captainPoint.latitude, longitude: captainPoint.longitude, title: trip.captain.name, pin: colors.goldBright },
        ]}
      />
      <View style={styles.sheet}>
        <SheetHandle />
        <Text style={styles.kicker}>{vehicleCopy[trip.vehicle].title} · {trip.serverId || trip.id}</Text>
        <View style={styles.statusRow}>
          {trip.status === "searching" ? <Radar /> : <Avatar source={trip.captain.photo} size={56} name={trip.captain.name} />}
          <View style={{ flex: 1, gap: 4 }}>
            <Text style={styles.title}>{headline}</Text>
            {trip.status === "searching" ? (
              <Text style={styles.body}>Looking for a captain near {trip.pickup.name}.</Text>
            ) : (
              <Text style={styles.body}>{trip.captain.vehicleName} · {trip.captain.rating.toFixed(2)} · {trip.captain.trips.toLocaleString("en-IN")} trips</Text>
            )}
          </View>
        </View>
        {trip.status !== "searching" ? <Plate value={trip.captain.vehicleNo} /> : null}
        {(trip.status === "assigned" || trip.status === "arrived" || trip.status === "onTrip") && (
          <View style={styles.otpBox}>
            <Text style={styles.kicker}>Share this code</Text>
            <CodeDigits code={trip.otp} />
          </View>
        )}
        <Text style={styles.fare}>{inr(trip.fare)} · {trip.payment === "cash" ? "Cash" : "Wallet"}</Text>
        {trip.status === "arrived" ? <Button label="Start ride" onPress={() => store.patchTrip({ status: "onTrip", progress: 0.05 })} /> : null}
        {trip.status === "payment" ? (
          <>
            {paidNote ? <Text style={styles.body}>{paidNote}</Text> : null}
            <Button
              label={trip.payment === "wallet" ? "Pay from wallet" : "Paid in cash"}
              onPress={() => {
                if (trip.payment === "wallet" && !store.payFromWallet(trip.fare)) {
                  setPaidNote("Wallet is short. Pay the captain in cash.");
                  store.patchTrip({ payment: "cash" });
                  return;
                }
                store.patchTrip({ status: "rating" });
              }}
            />
          </>
        ) : null}
        {trip.status === "rating" ? (
          <>
            <View style={styles.stars}>
              {[1, 2, 3, 4, 5].map((value) => (
                <Pressable key={value} onPress={() => setStars(value)}>
                  <Text style={[styles.star, value <= stars && styles.starOn]}>★</Text>
                </Pressable>
              ))}
            </View>
            <Button
              label="Submit rating"
              onPress={() => {
                store.finishTrip(stars);
                navigation.navigate("Tabs");
              }}
            />
          </>
        ) : null}
        {trip.status !== "payment" && trip.status !== "rating" ? (
          cancelling ? (
            cancelReasons.map((reason) => (
              <Pressable
                key={reason}
                onPress={() => {
                  store.cancelTrip();
                  navigation.navigate("Tabs");
                }}
              >
                <Text style={styles.cancel}>{reason}</Text>
              </Pressable>
            ))
          ) : (
            <Pressable onPress={() => setCancelling(true)}>
              <Text style={styles.cancel}>Cancel ride</Text>
            </Pressable>
          )
        ) : null}
        <Pressable onPress={() => navigation.navigate("Safety")}>
          <Text style={styles.safety}>Safety</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1, backgroundColor: colors.night },
  header: { position: "absolute", top: 0, left: 0, right: 0, zIndex: 2 },
  screen: { flex: 1, backgroundColor: colors.night, padding: 24, justifyContent: "center", gap: 16 },
  sheet: { position: "absolute", left: 0, right: 0, bottom: 0, backgroundColor: colors.sheet, borderTopLeftRadius: 24, borderTopRightRadius: 24, paddingHorizontal: 16, paddingTop: 10, paddingBottom: 16, gap: 10 },
  statusRow: { flexDirection: "row", alignItems: "center", gap: 12 },
  kicker: { color: colors.muted, letterSpacing: 0.4, fontSize: 12 },
  title: { color: colors.cream, fontSize: 20, fontWeight: "600" },
  body: { color: colors.muted, lineHeight: 18, fontSize: 13 },
  fare: { color: colors.cream, fontSize: 16, fontWeight: "600" },
  otpBox: { gap: 8 },
  stars: { flexDirection: "row", gap: 8 },
  star: { color: "rgba(138,101,8,0.28)", fontSize: 32 },
  starOn: { color: colors.gold },
  cancel: { color: colors.goldBright, paddingVertical: 6 },
  safety: { color: colors.cream, paddingVertical: 6 },
});
