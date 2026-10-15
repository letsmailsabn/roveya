import { useEffect, useRef } from "react";
import { Animated, Easing, Pressable, StyleSheet, Text, View } from "react-native";
import { StatusBar } from "expo-status-bar";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { type } from "../theme";

const night = "#12060D";
const cream = "#F6F1DC";
const gold = "#D6A000";

export function MaintenanceGate({ onEnter }: { onEnter: () => void }) {
  const insets = useSafeAreaInsets();
  const drive = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(drive, { toValue: 1, duration: 900, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        Animated.timing(drive, { toValue: 0, duration: 900, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [drive]);

  const carX = drive.interpolate({ inputRange: [0, 1], outputRange: [-14, 14] });
  const roadX = drive.interpolate({ inputRange: [0, 1], outputRange: [0, -22] });

  return (
    <View style={[styles.screen, { paddingTop: Math.max(insets.top, 24), paddingBottom: Math.max(insets.bottom, 24) }]}>
      <StatusBar style="light" />
      <View style={styles.center}>
        <Mark />
        <Text style={styles.word}>ROVEYA</Text>
        <Text style={styles.kicker}>Passenger app · in preparation</Text>
        <View style={styles.roadWrap}>
          <Animated.View style={{ transform: [{ translateX: carX }] }}>
            <Car />
          </Animated.View>
          <View style={styles.roadClip}>
            <Animated.View style={[styles.dashes, { transform: [{ translateX: roadX }] }]}>
              {Array.from({ length: 14 }).map((_, index) => (
                <View key={index} style={styles.dash} />
              ))}
            </Animated.View>
          </View>
        </View>
        <Text style={styles.title}>This is the beginning.</Text>
        <Text style={styles.body}>
          ROVEYA is being built. The network is planned to open in about a year. Seats, routes, and the ride itself are still taking shape. Anyone who opens this app should see that the work is in progress, and that what follows is the architecture of the passenger journey.
        </Text>
      </View>
      <Pressable accessibilityRole="button" onPress={onEnter} style={styles.button}>
        <Text style={styles.buttonText}>See the architecture</Text>
      </Pressable>
    </View>
  );
}

function Mark() {
  return (
    <View style={styles.mark}>
      <Text style={styles.markLetter}>R</Text>
      <View style={styles.markLine} />
    </View>
  );
}

function Car() {
  return (
    <View style={styles.car}>
      <View style={styles.cabin} />
      <View style={styles.body} />
      <View style={[styles.wheel, { left: 8 }]} />
      <View style={[styles.wheel, { right: 8 }]} />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: night, paddingHorizontal: 28, justifyContent: "space-between" },
  center: { flex: 1, alignItems: "center", justifyContent: "center" },
  mark: {
    width: 64,
    height: 64,
    borderRadius: 16,
    borderWidth: 1.2,
    borderColor: gold,
    alignItems: "center",
    justifyContent: "center",
  },
  markLetter: { color: cream, fontFamily: type.bold, fontSize: 30, fontWeight: "700", marginTop: -6 },
  markLine: { position: "absolute", bottom: 12, width: 36, height: 1.5, borderRadius: 2, backgroundColor: gold },
  word: { marginTop: 16, color: cream, fontFamily: type.bold, fontSize: 18, fontWeight: "700", letterSpacing: 4 },
  kicker: { marginTop: 6, color: gold, fontFamily: type.medium, fontSize: 12, letterSpacing: 0.6 },
  roadWrap: { marginTop: 36, width: "100%", alignItems: "center" },
  car: { width: 64, height: 28, marginBottom: 6 },
  cabin: { position: "absolute", left: 18, top: 0, width: 26, height: 10, borderTopLeftRadius: 6, borderTopRightRadius: 6, backgroundColor: gold },
  body: { position: "absolute", left: 4, top: 8, width: 56, height: 12, borderRadius: 4, backgroundColor: gold },
  wheel: { position: "absolute", top: 16, width: 8, height: 8, borderRadius: 4, backgroundColor: cream },
  roadClip: { width: "100%", height: 4, overflow: "hidden" },
  dashes: { flexDirection: "row", gap: 10, width: 420 },
  dash: { width: 12, height: 3, borderRadius: 2, backgroundColor: gold },
  title: { marginTop: 32, color: cream, fontFamily: type.bold, fontSize: 26, fontWeight: "700", textAlign: "center" },
  body: { marginTop: 12, color: "rgba(246,241,220,0.72)", fontFamily: type.regular, fontSize: 15, lineHeight: 23, textAlign: "center" },
  button: { backgroundColor: gold, borderRadius: 14, minHeight: 52, alignItems: "center", justifyContent: "center" },
  buttonText: { color: night, fontFamily: type.semibold, fontSize: 16, fontWeight: "600" },
});
