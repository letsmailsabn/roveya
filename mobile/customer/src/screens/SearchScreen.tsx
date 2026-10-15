import { useMemo, useState } from "react";
import { Ionicons } from "@expo/vector-icons";
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as Location from "expo-location";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { fallbackHere, places } from "../data";
import { useStore } from "../store";
import { colors, type } from "../theme";
import type { CustomerStack } from "../navigation";

export function SearchScreen({ route, navigation }: NativeStackScreenProps<CustomerStack, "Search">) {
  const [query, setQuery] = useState("");
  const [adding, setAdding] = useState(false);
  const store = useStore();
  const insets = useSafeAreaInsets();
  const target = route.params.target;
  const results = useMemo(() => {
    const needle = query.trim().toLowerCase();
    if (!needle) return adding ? places : [];
    return places.filter((place) => `${place.name} ${place.subtitle}`.toLowerCase().includes(needle));
  }, [query, adding]);

  function choose(item: (typeof places)[number]) {
    if (target === "pickup") {
      store.setPickup(item);
      navigation.goBack();
      return;
    }
    navigation.navigate("Options", { dropId: item.id });
  }

  return (
    <View style={styles.screen}>
      <View style={[styles.top, { paddingTop: Math.max(insets.top, 12) + 6 }]}>
        <Pressable onPress={() => navigation.goBack()} hitSlop={12}>
          <Ionicons name="arrow-back" size={22} color="#222" />
        </Pressable>
        <Text style={styles.title}>Enter your area or apartment name</Text>
      </View>
      <ScrollView contentContainerStyle={styles.body} keyboardShouldPersistTaps="handled">
        <View style={styles.search}>
          <Ionicons name="search-outline" size={18} color="#B0B0B0" />
          <TextInput
            autoFocus
            value={query}
            onChangeText={setQuery}
            placeholder="Search for area, street name"
            placeholderTextColor="#B0B0B0"
            style={styles.input}
          />
        </View>

        {query.trim().length === 0 ? (
          <>
            <Pressable
              style={styles.action}
              onPress={() => {
                void (async () => {
                  try {
                    const permission = await Location.requestForegroundPermissionsAsync();
                    if (!permission.granted) store.setPickup(fallbackHere);
                    else {
                      const position = await Location.getCurrentPositionAsync({});
                      store.setPickup({
                        id: "gps",
                        name: "Current location",
                        subtitle: "From this phone",
                        latitude: position.coords.latitude,
                        longitude: position.coords.longitude,
                      });
                    }
                  } catch {
                    store.setPickup(fallbackHere);
                  }
                  if (target === "pickup") navigation.goBack();
                  else setAdding(true);
                })();
              }}
            >
              <Ionicons name="locate-outline" size={18} color={colors.burgundy} />
              <View style={{ flex: 1 }}>
                <Text style={styles.actionTitle}>Use my current location</Text>
                <Text style={styles.actionSub}>Tap to get current location</Text>
              </View>
            </Pressable>
            <Pressable style={styles.action} onPress={() => setAdding(true)}>
              <Ionicons name="add" size={18} color={colors.burgundy} />
              <Text style={styles.actionTitle}>Add new address</Text>
            </Pressable>
          </>
        ) : null}

        {results.map((item) => (
          <Pressable key={item.id} style={styles.result} onPress={() => choose(item)}>
            <Ionicons name="location-outline" size={18} color="#8A8A8A" />
            <View style={{ flex: 1 }}>
              <Text style={styles.resultName}>{item.name}</Text>
              <Text style={styles.actionSub}>{item.subtitle}</Text>
            </View>
          </Pressable>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: "#FFFFFF" },
  top: { flexDirection: "row", alignItems: "center", gap: 14, paddingHorizontal: 16, paddingBottom: 12 },
  title: { flex: 1, color: "#1C1C1C", fontFamily: type.semibold, fontSize: 16, fontWeight: "600" },
  body: { paddingHorizontal: 16, gap: 12, paddingBottom: 40 },
  search: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    borderWidth: 1,
    borderColor: "#E6E6E6",
    borderRadius: 24,
    paddingHorizontal: 14,
    height: 48,
    marginBottom: 4,
  },
  input: { flex: 1, height: 22, color: "#1C1C1C", fontSize: 15, lineHeight: 22, fontFamily: type.regular, paddingVertical: 0, paddingHorizontal: 0 },
  action: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    borderWidth: 1,
    borderColor: "#ECECEC",
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 14,
    backgroundColor: "#FFFFFF",
  },
  actionTitle: { color: colors.burgundy, fontFamily: type.semibold, fontSize: 15, fontWeight: "600" },
  actionSub: { color: "#8E8E8E", fontSize: 13, marginTop: 2 },
  result: { flexDirection: "row", alignItems: "center", gap: 12, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: "#F0F0F0" },
  resultName: { color: "#1C1C1C", fontFamily: type.semibold, fontSize: 15, fontWeight: "600" },
});
