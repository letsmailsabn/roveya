import { useState } from "react";
import { Ionicons } from "@expo/vector-icons";
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import type { BottomTabScreenProps } from "@react-navigation/bottom-tabs";
import type { CompositeScreenProps } from "@react-navigation/native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { fallbackHere, places } from "../data";
import { useStore } from "../store";
import { colors, type } from "../theme";
import type { CustomerStack, CustomerTabs } from "../navigation";
import type { Place } from "../types";

type TabProps<T extends keyof CustomerTabs> = CompositeScreenProps<BottomTabScreenProps<CustomerTabs, T>, NativeStackScreenProps<CustomerStack>>;

export function PoolScreen({ navigation }: TabProps<"Pool">) {
  const insets = useSafeAreaInsets();
  const routes = [
    ["Hyderabad to Khammam", "Shared seat · same-day return"],
    ["Hyderabad to Vijayawada", "Shared seat · next morning return"],
    ["Hyderabad to Warangal", "Shared seat · evening departure"],
  ];
  return (
    <View style={styles.page}>
      <ScrollView contentContainerStyle={[styles.body, { paddingTop: Math.max(insets.top, 12) + 12 }]}>
        <Text style={styles.h1}>Pool</Text>
        <Text style={styles.lead}>A seat in a ROVEYA car. The fare is shown before you leave.</Text>
        {routes.map(([title, sub]) => (
          <Pressable key={title} style={styles.card} onPress={() => navigation.navigate("Search", { target: "drop" })}>
            <View style={{ flex: 1 }}>
              <Text style={styles.cardTitle}>{title}</Text>
              <Text style={styles.cardSub}>{sub}</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color="#B0B0B0" />
          </Pressable>
        ))}
      </ScrollView>
    </View>
  );
}

export function ParcelScreen() {
  const insets = useSafeAreaInsets();
  const store = useStore();
  const pickup = store.pickup ?? fallbackHere;
  const [drop, setDrop] = useState<Place | null>(null);
  const [query, setQuery] = useState("");
  const [swapped, setSwapped] = useState(false);
  const from = swapped && drop ? drop : pickup;
  const to = swapped ? pickup : drop;
  const matches = places.filter((place) => `${place.name} ${place.subtitle}`.toLowerCase().includes(query.trim().toLowerCase())).slice(0, 4);

  return (
    <View style={styles.page}>
      <ScrollView contentContainerStyle={[styles.body, { paddingTop: Math.max(insets.top, 12) + 8 }]} keyboardShouldPersistTaps="handled">
        <Text style={styles.kicker}>Doorstep pickup and delivery</Text>
        <Text style={styles.parcelWord}>PARCEL</Text>
        <View style={styles.parcelCard}>
          <View style={styles.dotRow}>
            <View style={[styles.dot, { backgroundColor: colors.burgundy }]} />
            <Text style={styles.cardTitle}>Pickup from current location</Text>
          </View>
          <View style={styles.addressRow}>
            <Text style={styles.address} numberOfLines={1}>{from.name} · {from.subtitle}</Text>
            <Ionicons name="pencil" size={16} color="#8A8A8A" />
          </View>
          <View style={styles.dash} />
          <Text style={styles.who}>{(store.session?.name || "ROVEYA rider").toUpperCase()} : {store.session?.phone}</Text>
        </View>
        <Pressable style={styles.switch} onPress={() => setSwapped((value) => !value)}>
          <Ionicons name="swap-vertical" size={14} color="#444" />
          <Text style={styles.switchText}>Switch</Text>
        </Pressable>
        <View style={styles.parcelCard}>
          <View style={styles.dotRow}>
            <View style={[styles.dot, { backgroundColor: colors.cherry }]} />
            <Text style={styles.cardTitle}>Drop to</Text>
          </View>
          <View style={styles.dropSearch}>
            <Ionicons name="search" size={18} color="#222" />
            <TextInput
              value={query}
              onChangeText={setQuery}
              placeholder={to ? to.name : "Search drop address"}
              placeholderTextColor="#222"
              style={styles.dropInput}
            />
          </View>
          {query.trim().length > 0
            ? matches.map((place) => (
              <Pressable key={place.id} onPress={() => { setDrop(place); setQuery(""); }}>
                <Text style={styles.match}>{place.name}</Text>
              </Pressable>
            ))
            : null}
        </View>
        <Text style={styles.legal}>Read about <Text style={styles.link}>prohibited items</Text></Text>
        <Text style={styles.legal}>By continuing, you agree to our <Text style={styles.link}>T&Cs</Text></Text>
      </ScrollView>
    </View>
  );
}

const travelCards = [
  { badge: "Upto 55% Off", line: "Best room rates", title: "Hotel", icon: "business-outline" as const },
  { badge: "Upto ₹4000 Off", line: "Lowest fare, guaranteed", title: "Flight", icon: "airplane-outline" as const },
  { badge: "Upto 25% Off", line: "Save big on", title: "Bus", icon: "bus-outline" as const },
  { badge: "Zero Service Fee", line: "A seat on the", title: "Train", icon: "train-outline" as const },
];

export function TravelScreen({ navigation }: TabProps<"Travel">) {
  const insets = useSafeAreaInsets();
  return (
    <View style={styles.page}>
      <ScrollView contentContainerStyle={[styles.body, { paddingTop: Math.max(insets.top, 12) + 8 }]}>
        <View style={styles.banner}>
          <Text style={styles.bannerScript}>Seasonal rides</Text>
          <Text style={styles.bannerTitle}>ON BOARD</Text>
          <View style={styles.bannerPill}><Text style={styles.bannerPillText}>ROVEYA</Text></View>
          <Text style={styles.bannerNote}>Use code ROVEYA50</Text>
        </View>
        <Text style={styles.section}>Travel & Hotel</Text>
        <View style={styles.grid}>
          {travelCards.map((card) => (
            <Pressable key={card.title} style={styles.travelCard} onPress={() => navigation.navigate("Detail", { title: card.title, body: `${card.line}. ${card.badge}. The ROVEYA desk confirms this booking. Code ROVEYA50.` })}>
              <View style={styles.off}>
                <Ionicons name="pricetag" size={12} color={colors.burgundy} />
                <Text style={styles.offText}>{card.badge}</Text>
              </View>
              <Text style={styles.cardSub}>{card.line}</Text>
              <Text style={styles.travelTitle}>{card.title} ›</Text>
              <Ionicons name={card.icon} size={36} color={colors.burgundy} style={styles.travelIcon} />
            </Pressable>
          ))}
        </View>
        <Text style={styles.powered}>ROVEYA travel desk</Text>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: "#F7F7F8" },
  body: { paddingHorizontal: 16, paddingBottom: 120, gap: 12 },
  h1: { color: colors.ink, fontFamily: type.bold, fontSize: 28, fontWeight: "700" },
  lead: { color: "#6E6E6E", fontSize: 15, lineHeight: 22, marginBottom: 6 },
  card: { backgroundColor: "#FFFFFF", borderRadius: 16, padding: 16, flexDirection: "row", alignItems: "center", gap: 10 },
  cardTitle: { color: "#1A1A1A", fontFamily: type.bold, fontSize: 15, fontWeight: "700" },
  cardSub: { color: "#8A8A8A", fontSize: 13, marginTop: 4 },
  kicker: { textAlign: "center", color: "#444", fontSize: 16, marginTop: 8 },
  parcelWord: { textAlign: "center", color: colors.ink, fontFamily: type.bold, fontSize: 34, fontWeight: "800", letterSpacing: 1, marginBottom: 8 },
  parcelCard: { backgroundColor: "#FFFFFF", borderRadius: 18, padding: 16, gap: 10 },
  dotRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  dot: { width: 12, height: 12, borderRadius: 6 },
  addressRow: { flexDirection: "row", alignItems: "center", gap: 8, paddingLeft: 20 },
  address: { flex: 1, color: "#8A8A8A", fontSize: 14 },
  dash: { borderBottomWidth: 1, borderStyle: "dashed", borderColor: "#E4E4E4", marginLeft: 20 },
  who: { color: "#1A1A1A", fontFamily: type.bold, fontSize: 14, fontWeight: "700", paddingLeft: 20 },
  switch: { alignSelf: "flex-end", marginRight: 18, marginTop: -22, marginBottom: -22, zIndex: 2, flexDirection: "row", alignItems: "center", gap: 4, backgroundColor: "#F3F3F4", borderRadius: 16, paddingHorizontal: 12, paddingVertical: 8, borderWidth: 2, borderColor: "#F7F7F8" },
  switchText: { color: "#333", fontFamily: type.medium, fontSize: 13 },
  dropSearch: { flexDirection: "row", alignItems: "center", gap: 8, borderWidth: 1.5, borderColor: colors.burgundy, borderRadius: 28, paddingHorizontal: 14, height: 48 },
  dropInput: { flex: 1, height: 22, color: "#1A1A1A", fontFamily: type.bold, fontSize: 16, lineHeight: 22, fontWeight: "700", paddingVertical: 0 },
  match: { color: colors.ink, paddingVertical: 8, paddingLeft: 8 },
  legal: { textAlign: "center", color: "#8A8A8A", fontSize: 13, marginTop: 8 },
  link: { color: colors.burgundy, fontFamily: type.semibold },
  banner: { backgroundColor: colors.burgundy, borderRadius: 18, paddingVertical: 22, paddingHorizontal: 16, alignItems: "center", gap: 6 },
  bannerScript: { color: colors.mark, fontSize: 16 },
  bannerTitle: { color: "#FFFFFF", fontFamily: type.bold, fontSize: 28, fontWeight: "800" },
  bannerPill: { backgroundColor: "rgba(255,255,255,0.16)", borderRadius: 8, paddingHorizontal: 12, paddingVertical: 4 },
  bannerPillText: { color: "#FFFFFF", letterSpacing: 1, fontFamily: type.semibold, fontSize: 12 },
  bannerNote: { color: "rgba(255,255,255,0.85)", fontSize: 13 },
  section: { color: "#222", fontFamily: type.semibold, fontSize: 18, fontWeight: "600", marginTop: 8 },
  grid: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  travelCard: { width: "48%", backgroundColor: "#F3F1F6", borderRadius: 16, padding: 12, minHeight: 132 },
  off: { alignSelf: "flex-start", flexDirection: "row", alignItems: "center", gap: 4, backgroundColor: "#FFFFFF", borderRadius: 10, paddingHorizontal: 8, paddingVertical: 3 },
  offText: { color: colors.burgundy, fontSize: 11, fontFamily: type.semibold },
  travelTitle: { color: colors.ink, fontFamily: type.bold, fontSize: 16, fontWeight: "700", marginTop: 8 },
  travelIcon: { position: "absolute", right: 10, bottom: 10 },
  powered: { textAlign: "center", color: "#9A9A9A", marginTop: 18, fontSize: 13 },
});
