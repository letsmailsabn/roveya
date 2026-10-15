import { Ionicons } from "@expo/vector-icons";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import type { CompositeScreenProps } from "@react-navigation/native";
import type { BottomTabScreenProps } from "@react-navigation/bottom-tabs";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { Avatar } from "../components/kit";
import { Button, Card } from "../components/ui";
import { portraits, vehicleCopy } from "../data";
import { inr } from "../geo";
import { useStore } from "../store";
import { colors, type } from "../theme";
import type { CustomerStack, CustomerTabs } from "../navigation";

type TabProps<T extends keyof CustomerTabs> = CompositeScreenProps<
  BottomTabScreenProps<CustomerTabs, T>,
  NativeStackScreenProps<CustomerStack>
>;

function PageTitle({ title }: { title: string }) {
  const insets = useSafeAreaInsets();
  return <Text style={[styles.title, { marginTop: Math.max(insets.top, 12) + 8 }]}>{title}</Text>;
}

export function ActivityScreen({ navigation }: NativeStackScreenProps<CustomerStack, "Activity">) {
  const rides = useStore().rides;
  return (
    <View style={styles.screen}>
      <ScrollView contentContainerStyle={styles.content}>
        <PageTitle title="My rides" />
        <View style={styles.group}>
          {rides.map((ride, index) => (
            <Pressable key={ride.id} style={[styles.menuRow, index < rides.length - 1 && styles.menuLine]} onPress={() => navigation.navigate("Receipt", { id: ride.id })}>
              <View style={styles.iconWell}>
                <Ionicons name="time-outline" size={18} color={colors.muted} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.name}>{ride.pickup} to {ride.drop}</Text>
                <Text style={styles.sub}>{ride.when} · {vehicleCopy[ride.vehicle].title}</Text>
              </View>
              <Text style={styles.fare}>{ride.status === "Cancelled" ? "—" : inr(ride.fare)}</Text>
            </Pressable>
          ))}
        </View>
      </ScrollView>
    </View>
  );
}

export function ReceiptScreen({ route, navigation }: NativeStackScreenProps<CustomerStack, "Receipt">) {
  const insets = useSafeAreaInsets();
  const ride = useStore().rides.find((item) => item.id === route.params.id);
  if (!ride) return <View style={styles.screen}><Text style={styles.title}>Ride not found</Text></View>;
  return (
    <View style={[styles.screen, { paddingTop: Math.max(insets.top, 16) }]}>
      <View style={styles.content}>
        <Text style={styles.accent}>{ride.id}</Text>
        <Text style={styles.title}>{ride.pickup} to {ride.drop}</Text>
        <Text style={styles.sub}>{ride.when}</Text>
        <Text style={styles.name}>{ride.status === "Cancelled" ? "Cancelled before pickup" : `Fare ${inr(ride.fare)}`}</Text>
        <Text style={styles.sub}>{vehicleCopy[ride.vehicle].title}. ROVEYA ride receipt.</Text>
        <Button label="Support" onPress={() => navigation.navigate("Support")} />
      </View>
    </View>
  );
}

export function WalletScreen() {
  const store = useStore();
  return (
    <View style={styles.screen}>
      <ScrollView contentContainerStyle={styles.content}>
        <PageTitle title="Wallet" />
        <View style={styles.balanceCard}>
          <Text style={styles.sub}>Available balance</Text>
          <Text style={styles.balance}>{inr(store.wallet)}</Text>
          <Text style={styles.sub}>Adding money here does not charge a bank.</Text>
        </View>
        <View style={styles.group}>
          {[100, 200, 500].map((amount, index, list) => (
            <Pressable key={amount} style={[styles.menuRow, index < list.length - 1 && styles.menuLine]} onPress={() => store.addWallet(amount)}>
              <View style={styles.iconWell}>
                <Ionicons name="add" size={18} color={colors.burgundy} />
              </View>
              <Text style={[styles.name, { flex: 1 }]}>Add {inr(amount)}</Text>
              <Ionicons name="chevron-forward" size={18} color={colors.faint} />
            </Pressable>
          ))}
        </View>
      </ScrollView>
    </View>
  );
}

export function AccountScreen({ navigation }: TabProps<"Account">) {
  const store = useStore();
  const name = (store.session?.name || "ROVEYA rider").toUpperCase();
  const rows: { icon: keyof typeof Ionicons.glyphMap; label: string; onPress: () => void }[] = [
    { icon: "help-circle-outline", label: "Help", onPress: () => navigation.navigate("Support") },
    { icon: "time-outline", label: "My Rides", onPress: () => navigation.navigate("Activity") },
    { icon: "cube-outline", label: "Parcel - Send Items", onPress: () => navigation.navigate("Parcel") },
    { icon: "wallet-outline", label: "Payment", onPress: () => navigation.navigate("Wallet") },
    { icon: "shield-checkmark-outline", label: "Safety", onPress: () => navigation.navigate("Safety") },
    { icon: "gift-outline", label: "Refer and Earn", onPress: () => navigation.navigate("Detail", { title: "Refer and Earn", body: "Share ROVEYA with a friend. They can use code ROVEYA50 on a fare of ₹100 or more." }) },
    { icon: "star-outline", label: "My Rewards", onPress: () => navigation.navigate("Detail", { title: "My Rewards", body: "Rewards from completed rides will show here. This phone is still on the demo wallet." }) },
    { icon: "ellipse-outline", label: "ROVEYA Coins", onPress: () => navigation.navigate("Detail", { title: "ROVEYA Coins", body: "Coins are not charged to a bank. Completed rides on this phone will add them later." }) },
    { icon: "ticket-outline", label: "Power Pass", onPress: () => navigation.navigate("Detail", { title: "Power Pass", body: "A pass for regular ROVEYA rides. None is active on this phone yet." }) },
    { icon: "notifications-outline", label: "Notifications", onPress: () => navigation.navigate("Detail", { title: "Notifications", body: "Trip updates for this phone stay on the device. The desk is live from 5:00 AM to 11:00 PM." }) },
    { icon: "heart-outline", label: "Favorites", onPress: () => navigation.navigate("Detail", { title: "Favorites", body: `Home · ${store.home?.name ?? "Not set"}\nWork · ${store.work?.name ?? "Not set"}` }) },
    { icon: "shield-outline", label: "Claims", onPress: () => navigation.navigate("Detail", { title: "Claims", body: "Open a ride receipt and send it to the ROVEYA desk if a fare or a lost item needs a claim." }) },
    { icon: "moon-outline", label: "Theme", onPress: () => navigation.navigate("Detail", { title: "Theme", body: "ROVEYA uses the plum palette on a light page. Night, burgundy, and cream stay the brand colors." }) },
    { icon: "information-circle-outline", label: "About", onPress: () => navigation.navigate("Detail", { title: "About", body: "ROVEYA is a premium taxipool and travel service. Desk +91 90000 00001, daily, 5:00 AM to 11:00 PM." }) },
    { icon: "log-out-outline", label: "Log out", onPress: () => store.signOut() },
  ];
  return (
    <View style={styles.screen}>
      <ScrollView contentContainerStyle={styles.content}>
        <PageTitle title="Profile" />
        <View style={styles.group}>
          <Pressable style={styles.menuRow} onPress={() => navigation.navigate("Detail", { title: "Profile", body: `${name}\n+91 ${store.session?.phone ?? ""}` })}>
            <Avatar source={portraits.rider} size={48} name={store.session?.name} />
            <View style={{ flex: 1 }}>
              <Text style={styles.profileName}>{name}</Text>
              <Text style={styles.sub}>{store.session?.phone}</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color="#C0C0C0" />
          </Pressable>
          <View style={styles.menuLine} />
          <Pressable style={styles.menuRow} onPress={() => navigation.navigate("Detail", { title: "My Rating", body: "4.90 from completed ROVEYA rides on this phone." })}>
            <Ionicons name="star" size={16} color={colors.burgundy} />
            <Text style={[styles.name, { flex: 1 }]}>4.90  My Rating</Text>
            <Ionicons name="chevron-forward" size={18} color="#C0C0C0" />
          </Pressable>
        </View>
        <View style={styles.group}>
          {rows.map((row, index) => (
            <Pressable key={row.label} style={[styles.menuRow, index < rows.length - 1 && styles.hairline]} onPress={row.onPress}>
              <Ionicons name={row.icon} size={20} color="#5C5C5C" />
              <Text style={[styles.name, { flex: 1 }]}>{row.label}</Text>
              <Ionicons name="chevron-forward" size={16} color="#C8C8C8" />
            </Pressable>
          ))}
        </View>
      </ScrollView>
    </View>
  );
}

export function DetailScreen({ route }: NativeStackScreenProps<CustomerStack, "Detail">) {
  const insets = useSafeAreaInsets();
  return (
    <View style={[styles.screen, { paddingTop: Math.max(insets.top, 16) }]}>
      <View style={styles.content}>
        <Text style={styles.title}>{route.params.title}</Text>
        <Card>
          <Text style={styles.sub}>{route.params.body}</Text>
        </Card>
      </View>
    </View>
  );
}

export function SupportScreen() {
  const insets = useSafeAreaInsets();
  const topics = [
    ["A fare looks wrong", "Open the ride receipt and send it to the desk. Demo receipts stay on this phone."],
    ["I left something in the vehicle", "The captain from that ride is listed on the receipt."],
    ["I want a refund", "Wallet fares can be returned to the demo wallet by the desk."],
  ];
  return (
    <View style={styles.screen}>
      <ScrollView contentContainerStyle={[styles.content, { paddingTop: Math.max(insets.top, 16) }]}>
        <Text style={styles.title}>Help</Text>
        {topics.map(([title, body]) => (
          <Card key={title}>
            <Text style={styles.name}>{title}</Text>
            <Text style={styles.sub}>{body}</Text>
          </Card>
        ))}
        <Text style={styles.sub}>ROVEYA desk, daily, 5:00 AM to 11:00 PM. Phone +91 90000 00001.</Text>
      </ScrollView>
    </View>
  );
}

export function SafetyScreen() {
  const insets = useSafeAreaInsets();
  return (
    <View style={[styles.screen, { paddingTop: Math.max(insets.top, 16) }]}>
      <View style={styles.content}>
        <Text style={styles.title}>Safety</Text>
        <Card>
          <Text style={styles.name}>Share this trip</Text>
          <Text style={styles.sub}>A demo link is ready for a trusted contact. Nothing is sent off this phone.</Text>
        </Card>
        <Card>
          <Text style={styles.name}>Emergency</Text>
          <Text style={styles.sub}>SOS records an alert on this device. Call 112 if you need help now.</Text>
        </Card>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.night },
  content: { paddingHorizontal: 16, paddingBottom: 120, gap: 14 },
  title: { color: colors.ink, fontSize: 28, fontWeight: "700", fontFamily: type.bold },
  profileName: { color: colors.ink, fontSize: 16, fontWeight: "700", fontFamily: type.bold },
  balanceCard: { backgroundColor: colors.paper, borderRadius: 20, padding: 18, borderWidth: 1, borderColor: colors.line, gap: 6 },
  balance: { color: colors.burgundy, fontSize: 36, fontWeight: "700", fontFamily: type.bold },
  group: { backgroundColor: colors.paper, borderRadius: 20, paddingHorizontal: 14, borderWidth: 1, borderColor: colors.line },
  menuRow: { flexDirection: "row", alignItems: "center", gap: 14, paddingVertical: 16 },
  menuLine: { borderBottomWidth: 1, borderBottomColor: colors.line },
  hairline: { borderBottomWidth: 1, borderBottomColor: "#F0F0F0" },
  iconWell: { width: 36, height: 36, borderRadius: 18, backgroundColor: colors.mist, alignItems: "center", justifyContent: "center" },
  name: { color: colors.ink, fontWeight: "600", fontSize: 15, fontFamily: type.semibold },
  sub: { color: colors.muted, marginTop: 2, lineHeight: 20, fontSize: 13 },
  accent: { color: colors.burgundy, marginTop: 8, fontFamily: type.medium },
  fare: { color: colors.ink, fontFamily: type.semibold, fontWeight: "600" },
});
