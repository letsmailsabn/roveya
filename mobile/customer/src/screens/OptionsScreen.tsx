import { useMemo, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { gateway } from "../api";
import { BrandHeader } from "../components/Logo";
import { Button } from "../components/ui";
import { captains, DEMO_TRIP_CODE, fallbackHere, places, vehicleCopy } from "../data";
import { distanceKm, inr, quoteEta, quoteFare } from "../geo";
import { useStore } from "../store";
import { colors } from "../theme";
import type { PayMethod, VehicleKind } from "../types";
import type { CustomerStack } from "../navigation";

const kinds: VehicleKind[] = ["bike", "auto", "cab"];

export function OptionsScreen({ route, navigation }: NativeStackScreenProps<CustomerStack, "Options">) {
  const store = useStore();
  const drop = places.find((place) => place.id === route.params.dropId) ?? places[0];
  const pickup = store.pickup ?? fallbackHere;
  const kilometers = distanceKm(pickup, drop);
  const [vehicle, setVehicle] = useState<VehicleKind>("bike");
  const [payment, setPayment] = useState<PayMethod>("cash");
  const [code, setCode] = useState("");
  const [note, setNote] = useState("");
  const fare = useMemo(() => {
    const base = quoteFare(vehicle, kilometers);
    return store.applyCoupon(code, base).fare;
  }, [vehicle, kilometers, code, store]);

  return (
    <View style={styles.fill}>
      <BrandHeader />
      <ScrollView contentContainerStyle={styles.screen}>
      <Text style={styles.kicker}>ROVEYA · {pickup.name} to {drop.name}</Text>
      <Text style={styles.title}>{kilometers < 1 ? "Nearby" : `${kilometers.toFixed(1)} km`}</Text>
      {kinds.map((kind) => {
        const selected = kind === vehicle;
        return (
          <Pressable key={kind} style={[styles.option, selected && styles.selected]} onPress={() => setVehicle(kind)}>
            <View>
              <Text style={styles.name}>{vehicleCopy[kind].title}</Text>
              <Text style={styles.sub}>{vehicleCopy[kind].seats} · {vehicleCopy[kind].note} · {quoteEta(kind, kilometers)} min</Text>
            </View>
            <Text style={styles.fare}>{inr(store.applyCoupon(code, quoteFare(kind, kilometers)).fare)}</Text>
          </Pressable>
        );
      })}
      <TextInput value={code} onChangeText={setCode} placeholder="Code ROVEYA50" placeholderTextColor={colors.faint} style={styles.input} autoCapitalize="characters" />
      <View style={styles.payRow}>
        {(["cash", "wallet"] as PayMethod[]).map((method) => (
          <Pressable key={method} style={[styles.pay, payment === method && styles.selected]} onPress={() => setPayment(method)}>
            <Text style={styles.name}>{method === "cash" ? "Cash" : `Wallet ${inr(store.wallet)}`}</Text>
          </Pressable>
        ))}
      </View>
      {note ? <Text style={styles.note}>{note}</Text> : null}
      <Button
        label={`Confirm ${inr(fare)}`}
        onPress={() => {
          if (payment === "wallet" && store.wallet < fare) {
            setNote("Wallet does not cover this fare. Choose cash, or add money.");
            return;
          }
          const applied = store.applyCoupon(code, quoteFare(vehicle, kilometers));
          setNote(applied.note);
          store.startTrip({
            id: `RV-${Date.now().toString().slice(-6)}`,
            pickup,
            drop,
            vehicle,
            fare: applied.fare,
            distanceKm: kilometers,
            etaMin: quoteEta(vehicle, kilometers),
            payment,
            otp: DEMO_TRIP_CODE,
            captain: captains[vehicle],
            status: "searching",
            progress: 0,
          });
          navigation.navigate("Trip");
          void gateway<{ id: string }>("/v1/rides", {
            riderPhone: store.session?.phone,
            riderName: store.session?.name,
            pickup,
            drop,
            vehicle,
            payment,
            fare: applied.fare,
            distanceKm: kilometers,
            etaMin: quoteEta(vehicle, kilometers),
            code,
          }).then((ride) => {
            if (ride?.id) store.patchTrip({ serverId: ride.id });
          });
        }}
      />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1, backgroundColor: colors.night },
  screen: { padding: 20, gap: 12, paddingBottom: 40 },
  kicker: { color: colors.gold, letterSpacing: 1 },
  title: { color: colors.cream, fontSize: 32, fontWeight: "600", marginBottom: 6 },
  option: { backgroundColor: colors.paper, borderRadius: 16, padding: 16, flexDirection: "row", justifyContent: "space-between", alignItems: "center", borderWidth: 1, borderColor: colors.line },
  selected: { backgroundColor: colors.mist, borderColor: colors.goldBright },
  name: { color: colors.ink, fontWeight: "600" },
  sub: { color: colors.muted, marginTop: 4, fontSize: 12 },
  fare: { color: colors.ink, fontSize: 18, fontWeight: "700" },
  input: { backgroundColor: colors.paper, color: colors.cream, borderRadius: 16, height: 52, paddingHorizontal: 16, paddingVertical: 0, fontSize: 16, lineHeight: 52 },
  payRow: { flexDirection: "row", gap: 8 },
  pay: { flex: 1, backgroundColor: colors.paper, borderRadius: 16, padding: 14, borderWidth: 1, borderColor: "transparent" },
  note: { color: colors.goldBright },
});
