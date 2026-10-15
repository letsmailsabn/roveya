import { useEffect, useState } from "react";
import { Ionicons } from "@expo/vector-icons";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as Location from "expo-location";
import type { BottomTabScreenProps } from "@react-navigation/bottom-tabs";
import type { CompositeScreenProps } from "@react-navigation/native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { fallbackHere, places } from "../data";
import { distanceKm } from "../geo";
import { useStore } from "../store";
import { colors, type } from "../theme";
import type { CustomerStack, CustomerTabs } from "../navigation";

type Props = CompositeScreenProps<BottomTabScreenProps<CustomerTabs, "Home">, NativeStackScreenProps<CustomerStack>>;

const explore: { icon: keyof typeof Ionicons.glyphMap; label: string; go: "Travel" | "Parcel" | "Search" }[] = [
  { icon: "train-outline", label: "Metro Ticket", go: "Travel" },
  { icon: "cube-outline", label: "Parcel\non Bike", go: "Parcel" },
  { icon: "bicycle-outline", label: "Scooty", go: "Search" },
  { icon: "bicycle", label: "Bike", go: "Search" },
];

export function HomeScreen({ navigation }: Props) {
  const store = useStore();
  const insets = useSafeAreaInsets();
  const here = store.pickup ?? fallbackHere;
  const [saved, setSaved] = useState<string[]>([]);
  const recent = places.slice(0, 3);

  useEffect(() => {
    if (store.pickup) return;
    void (async () => {
      try {
        const permission = await Location.requestForegroundPermissionsAsync();
        if (!permission.granted) {
          store.setPickup(fallbackHere);
          return;
        }
        const position = await Location.getCurrentPositionAsync({});
        store.setPickup({
          id: "gps",
          name: "Current location",
          subtitle: "From this phone",
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        });
      } catch {
        store.setPickup(fallbackHere);
      }
    })();
  }, [store.pickup]);

  return (
    <View style={styles.fill}>
      <ScrollView contentContainerStyle={[styles.content, { paddingTop: Math.max(insets.top, 12) + 10 }]} showsVerticalScrollIndicator={false}>
        <Pressable style={styles.search} onPress={() => navigation.navigate("Search", { target: "drop" })}>
          <Ionicons name="search" size={20} color="#9A9A9A" />
          <Text style={styles.searchText} numberOfLines={1}>Where do you want to go?</Text>
          <View style={styles.searchMark} />
        </Pressable>

        <View style={styles.recents}>
          {recent.map((place, index) => (
            <Pressable key={place.id} style={[styles.recent, index < recent.length - 1 && styles.recentLine]} onPress={() => navigation.navigate("Options", { dropId: place.id })}>
              <Ionicons name="time-outline" size={18} color="#8A8A8A" style={{ marginTop: 2 }} />
              <View style={{ flex: 1 }}>
                <Text style={styles.place} numberOfLines={1}>{place.name}</Text>
                <Text style={styles.address} numberOfLines={1}>
                  <Text style={styles.km}>{distanceKm(here, place).toFixed(1)} km  </Text>
                  {place.subtitle}
                </Text>
              </View>
              <Pressable hitSlop={8} onPress={() => setSaved((current) => current.includes(place.id) ? current.filter((id) => id !== place.id) : [...current, place.id])}>
                <Ionicons name={saved.includes(place.id) ? "heart" : "heart-outline"} size={20} color={saved.includes(place.id) ? colors.burgundy : "#B0B0B0"} />
              </Pressable>
            </Pressable>
          ))}
        </View>

        <Text style={styles.section}>Everything in minutes</Text>
        <View style={styles.promoRow}>
          <Pressable style={styles.bikeCard} onPress={() => navigation.navigate("Search", { target: "drop" })}>
            <View style={styles.badge}>
              <Ionicons name="bicycle" size={14} color={colors.onAccent} />
              <Text style={styles.badgeText}>Starts at ₹35</Text>
            </View>
            <Text style={styles.bikeTitle}>Bike</Text>
            <Text style={styles.bikeSub}>Affordable guaranteed rides</Text>
            <View style={styles.bikeArt}>
              <Ionicons name="bicycle" size={72} color={colors.burgundy} />
            </View>
          </Pressable>
          <View style={styles.sideCol}>
            <Pressable style={styles.sideCard} onPress={() => navigation.navigate("Travel")}>
              <Text style={styles.sideTitle}>Metro</Text>
              <Ionicons name="train-outline" size={36} color={colors.burgundy} />
            </Pressable>
            <Pressable style={styles.sideCard} onPress={() => navigation.navigate("Detail", { title: "More", body: "Bike, auto, cab, parcel, and shared pool seats. Pick a ride from the search bar." })}>
              <Text style={styles.sideTitle}>More</Text>
              <Ionicons name="grid-outline" size={32} color={colors.burgundy} />
            </Pressable>
          </View>
        </View>

        <View style={styles.exploreHead}>
          <Text style={styles.section}>Explore</Text>
          <Pressable style={styles.viewAll} onPress={() => navigation.navigate("Search", { target: "drop" })}>
            <Text style={styles.viewAllText}>View All</Text>
            <Ionicons name="chevron-forward" size={16} color="#8A8A8A" />
          </Pressable>
        </View>
        <View style={styles.tiles}>
          {explore.map((item) => (
            <Pressable
              key={item.label}
              style={styles.tile}
              onPress={() => {
                if (item.go === "Search") navigation.navigate("Search", { target: "drop" });
                else navigation.navigate(item.go);
              }}
            >
              <View style={styles.tileIcon}>
                <Ionicons name={item.icon} size={26} color={colors.burgundy} />
              </View>
              <Text style={styles.tileLabel}>{item.label}</Text>
            </Pressable>
          ))}
        </View>

        <View style={styles.footer}>
          <Text style={styles.hash}>#goROVEYA</Text>
          <Text style={styles.footerLine}>Made for India</Text>
          <Text style={styles.footerLine}>Crafted in Hyderabad</Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1, backgroundColor: "#F7F7F8" },
  content: { paddingHorizontal: 16, paddingBottom: 120 },
  search: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: "#FFFFFF",
    borderRadius: 28,
    paddingHorizontal: 16,
    height: 52,
    borderWidth: 1,
    borderColor: "#ECECEC",
    shadowColor: "#000",
    shadowOpacity: 0.04,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
    marginBottom: 18,
  },
  searchText: { flex: 1, color: "#1A1A1A", fontFamily: type.medium, fontSize: 16, fontWeight: "500" },
  searchMark: { position: "absolute", left: "28%", right: "28%", bottom: 0, height: 3, borderRadius: 2, backgroundColor: colors.burgundy },
  recents: { marginBottom: 18 },
  recent: { flexDirection: "row", alignItems: "flex-start", gap: 12, paddingVertical: 12 },
  recentLine: { borderBottomWidth: 1, borderStyle: "dashed", borderColor: "#E4E4E4" },
  place: { color: "#1A1A1A", fontFamily: type.bold, fontSize: 15, fontWeight: "700" },
  address: { color: "#8A8A8A", fontSize: 13, marginTop: 3 },
  km: { color: "#6E6E6E", fontFamily: type.medium, fontWeight: "500" },
  section: { color: "#3A3A3A", fontFamily: type.semibold, fontSize: 18, fontWeight: "600", marginBottom: 12 },
  promoRow: { flexDirection: "row", gap: 10, marginBottom: 22, height: 188 },
  bikeCard: { flex: 1.4, backgroundColor: "#F4EEF1", borderRadius: 18, padding: 14, overflow: "hidden" },
  badge: { alignSelf: "flex-start", flexDirection: "row", alignItems: "center", gap: 4, backgroundColor: colors.burgundy, borderRadius: 8, paddingHorizontal: 8, paddingVertical: 4 },
  badgeText: { color: colors.onAccent, fontSize: 12, fontFamily: type.semibold, fontWeight: "600" },
  bikeTitle: { color: colors.ink, fontFamily: type.bold, fontSize: 20, fontWeight: "700", marginTop: 10 },
  bikeSub: { color: "#6E5A64", fontSize: 13, marginTop: 2 },
  bikeArt: { position: "absolute", right: 8, bottom: 6 },
  sideCol: { flex: 0.8, gap: 10 },
  sideCard: { flex: 1, backgroundColor: "#F4F4F5", borderRadius: 18, padding: 12, justifyContent: "space-between" },
  sideTitle: { color: colors.ink, fontFamily: type.semibold, fontSize: 16, fontWeight: "600" },
  exploreHead: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  viewAll: { flexDirection: "row", alignItems: "center", marginBottom: 12 },
  viewAllText: { color: "#8A8A8A", fontSize: 14, fontFamily: type.medium },
  tiles: { flexDirection: "row", justifyContent: "space-between", marginBottom: 28 },
  tile: { width: "23%", alignItems: "center", gap: 8 },
  tileIcon: { width: "100%", aspectRatio: 1, borderRadius: 16, backgroundColor: "#F3F3F4", alignItems: "center", justifyContent: "center" },
  tileLabel: { color: "#4A4A4A", fontSize: 12, textAlign: "center", fontFamily: type.medium, lineHeight: 16 },
  footer: { alignItems: "center", paddingTop: 12, paddingBottom: 8, gap: 6 },
  hash: { color: "#C9C4C6", fontFamily: type.bold, fontSize: 28, fontWeight: "700" },
  footerLine: { color: "#9A9A9A", fontSize: 13 },
});
