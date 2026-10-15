import { NavigationContainer, DefaultTheme, type Theme } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { Ionicons } from "@expo/vector-icons";
import { Text, View } from "react-native";
import { NameScreen, OtpScreen, PhoneScreen } from "./screens/AuthScreens";
import { HomeScreen } from "./screens/HomeScreen";
import { SearchScreen } from "./screens/SearchScreen";
import { OptionsScreen } from "./screens/OptionsScreen";
import { TripScreen } from "./screens/TripScreen";
import { AccountScreen, ActivityScreen, DetailScreen, ReceiptScreen, SafetyScreen, SupportScreen, WalletScreen } from "./screens/MoreScreens";
import { ParcelScreen, PoolScreen, TravelScreen } from "./screens/ServiceScreens";
import { useStore } from "./store";
import { colors, type } from "./theme";

export type CustomerStack = {
  Phone: undefined;
  Otp: { phone: string };
  Name: { phone: string };
  Tabs: undefined;
  Search: { target: "pickup" | "drop" };
  Options: { dropId: string };
  Trip: undefined;
  Receipt: { id: string };
  Support: undefined;
  Safety: undefined;
  Activity: undefined;
  Wallet: undefined;
  Detail: { title: string; body: string };
};

export type CustomerTabs = {
  Home: undefined;
  Pool: undefined;
  Parcel: undefined;
  Travel: undefined;
  Account: undefined;
};

const Stack = createNativeStackNavigator<CustomerStack>();
const Tabs = createBottomTabNavigator<CustomerTabs>();

const navTheme: Theme = {
  ...DefaultTheme,
  fonts: {
    regular: { fontFamily: type.regular, fontWeight: "400" },
    medium: { fontFamily: type.medium, fontWeight: "500" },
    bold: { fontFamily: type.bold, fontWeight: "700" },
    heavy: { fontFamily: type.bold, fontWeight: "700" },
  },
  colors: { ...DefaultTheme.colors, background: colors.night, card: colors.sheet, primary: colors.gold, text: colors.ink, border: colors.line, notification: colors.goldBright },
};

function MainTabs() {
  return (
    <Tabs.Navigator
      safeAreaInsets={{ bottom: 0 }}
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarIcon: ({ focused }) => {
          const icons = {
            Home: "home-outline",
            Pool: "people-outline",
            Parcel: "cube-outline",
            Travel: "airplane-outline",
            Account: "person-outline",
          } as const;
          return (
            <View style={{ width: 28, height: 28, borderRadius: 14, alignItems: "center", justifyContent: "center", backgroundColor: focused ? "#E7E4E6" : "transparent" }}>
              <Ionicons name={icons[route.name]} color={focused ? colors.ink : "#8D8D8D"} size={20} />
            </View>
          );
        },
        tabBarStyle: {
          position: "absolute",
          left: 12,
          right: 12,
          bottom: 10,
          height: 68,
          borderRadius: 34,
          backgroundColor: "#FFFFFF",
          borderTopWidth: 0,
          paddingTop: 4,
          paddingBottom: 6,
          shadowColor: "#12060D",
          shadowOpacity: 0.14,
          shadowRadius: 16,
          shadowOffset: { width: 0, height: 6 },
          elevation: 14,
        },
        tabBarItemStyle: { paddingTop: 0, paddingBottom: 0 },
        tabBarLabelStyle: { fontFamily: type.medium, fontSize: 10, lineHeight: 14, height: 14, marginTop: 2 },
        tabBarActiveTintColor: colors.ink,
        tabBarInactiveTintColor: "#8D8D8D",
      })}
    >
      <Tabs.Screen name="Home" component={HomeScreen} options={{ tabBarLabel: "Ride" }} />
      <Tabs.Screen name="Pool" component={PoolScreen} />
      <Tabs.Screen name="Parcel" component={ParcelScreen} />
      <Tabs.Screen name="Travel" component={TravelScreen} />
      <Tabs.Screen name="Account" component={AccountScreen} options={{ tabBarLabel: "Profile" }} />
    </Tabs.Navigator>
  );
}

export function CustomerNavigation() {
  const session = useStore().session;
  return (
    <NavigationContainer theme={navTheme}>
      <Stack.Navigator screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.night } }}>
        {session ? (
          <>
            <Stack.Screen name="Tabs" component={MainTabs} />
            <Stack.Screen name="Search" component={SearchScreen} />
            <Stack.Screen name="Options" component={OptionsScreen} />
            <Stack.Screen name="Trip" component={TripScreen} />
            <Stack.Screen name="Receipt" component={ReceiptScreen} />
            <Stack.Screen name="Support" component={SupportScreen} />
            <Stack.Screen name="Safety" component={SafetyScreen} />
            <Stack.Screen name="Activity" component={ActivityScreen} />
            <Stack.Screen name="Wallet" component={WalletScreen} />
            <Stack.Screen name="Detail" component={DetailScreen} />
          </>
        ) : (
          <>
            <Stack.Screen name="Phone" component={PhoneScreen} />
            <Stack.Screen name="Otp" component={OtpScreen} />
            <Stack.Screen name="Name" component={NameScreen} />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}

export function TabLabel({ children }: { children: string }) {
  return <Text>{children}</Text>;
}
