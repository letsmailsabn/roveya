import { Ionicons } from "@expo/vector-icons";
import { View } from "react-native";
import { DefaultTheme, NavigationContainer, type Theme } from "@react-navigation/native";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { OtpScreen, PhoneScreen, RegisterScreen } from "./screens/JoinScreens";
import { CaptainHome, EarningsScreen, JobScreen, ProfileScreen } from "./screens/WorkScreens";
import { useStore } from "./store";
import { colors, type } from "./theme";

export type RiderStack = {
  Phone: undefined;
  Otp: { phone: string };
  Register: { phone: string };
  Tabs: undefined;
  Job: undefined;
};

export type RiderTabs = {
  Duty: undefined;
  Earnings: undefined;
  Profile: undefined;
};

const Stack = createNativeStackNavigator<RiderStack>();
const Tabs = createBottomTabNavigator<RiderTabs>();

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
          const icons = { Duty: "radio-outline", Earnings: "stats-chart-outline", Profile: "person-outline" } as const;
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
        tabBarItemStyle: { paddingTop: 0 },
        tabBarLabelStyle: { fontFamily: type.medium, fontSize: 11, lineHeight: 14, height: 14, marginTop: 2 },
        tabBarActiveTintColor: colors.ink,
        tabBarInactiveTintColor: "#8D8D8D",
      })}
    >
      <Tabs.Screen name="Duty" component={CaptainHome} />
      <Tabs.Screen name="Earnings" component={EarningsScreen} />
      <Tabs.Screen name="Profile" component={ProfileScreen} />
    </Tabs.Navigator>
  );
}

export function RiderNavigation() {
  const profile = useStore().profile;
  const ready = Boolean(profile?.agreed);
  return (
    <NavigationContainer theme={navTheme}>
      <Stack.Navigator screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.night } }}>
        {ready ? (
          <>
            <Stack.Screen name="Tabs" component={MainTabs} />
            <Stack.Screen name="Job" component={JobScreen} />
          </>
        ) : (
          <>
            <Stack.Screen name="Phone" component={PhoneScreen} />
            <Stack.Screen name="Otp" component={OtpScreen} />
            <Stack.Screen name="Register" component={RegisterScreen} />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}
