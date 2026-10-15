import { useState } from "react";
import { ActivityIndicator, View } from "react-native";
import { StatusBar } from "expo-status-bar";
import {
  PlusJakartaSans_400Regular,
  PlusJakartaSans_500Medium,
  PlusJakartaSans_600SemiBold,
  PlusJakartaSans_700Bold,
  useFonts,
} from "@expo-google-fonts/plus-jakarta-sans";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { MaintenanceGate } from "./src/components/MaintenanceGate";
import { CustomerNavigation } from "./src/navigation";
import { StoreProvider, useStore } from "./src/store";
import { colors } from "./src/theme";

function Gate() {
  const ready = useStore().ready;
  if (!ready) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.night, alignItems: "center", justifyContent: "center" }}>
        <ActivityIndicator color={colors.gold} />
      </View>
    );
  }
  return <CustomerNavigation />;
}

export default function App() {
  const [open, setOpen] = useState(false);
  const [fontsReady] = useFonts({
    PlusJakartaSans_400Regular,
    PlusJakartaSans_500Medium,
    PlusJakartaSans_600SemiBold,
    PlusJakartaSans_700Bold,
  });
  return (
    <SafeAreaProvider>
      <StatusBar style={open ? "dark" : "light"} />
      {fontsReady ? (
        open ? (
          <StoreProvider>
            <Gate />
          </StoreProvider>
        ) : (
          <MaintenanceGate onEnter={() => setOpen(true)} />
        )
      ) : (
        <View style={{ flex: 1, backgroundColor: colors.night, alignItems: "center", justifyContent: "center" }}>
          <ActivityIndicator color={colors.gold} />
        </View>
      )}
    </SafeAreaProvider>
  );
}
