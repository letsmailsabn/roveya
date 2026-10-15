import { useEffect, useRef } from "react";
import { Animated, Image, StyleSheet, Text, View, type ImageSourcePropType } from "react-native";
import { colors, type } from "../theme";

export function Avatar({ source, size = 48, name }: { source?: ImageSourcePropType; size?: number; name?: string }) {
  if (!source) {
    const letter = (name || "R").trim().charAt(0).toUpperCase();
    return (
      <View style={[styles.fallback, { width: size, height: size, borderRadius: size / 2 }]}>
        <Text style={{ color: colors.ink, fontFamily: type.semibold, fontSize: size * 0.38, fontWeight: "600" }}>{letter}</Text>
      </View>
    );
  }
  return <Image source={source} style={{ width: size, height: size, borderRadius: size / 2, backgroundColor: colors.paper }} />;
}

export function Plate({ value }: { value: string }) {
  return (
    <View style={styles.plate}>
      <Text style={styles.plateText}>{value}</Text>
    </View>
  );
}

export function CodeDigits({ code }: { code: string }) {
  return (
    <View style={styles.digits}>
      {code.split("").map((digit, index) => (
        <View key={`${digit}-${index}`} style={styles.digit}>
          <Text style={styles.digitText}>{digit}</Text>
        </View>
      ))}
    </View>
  );
}

export function SheetHandle() {
  return <View style={styles.handle} />;
}

export function Radar() {
  const pulse = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    const loop = Animated.loop(
      Animated.timing(pulse, { toValue: 1, duration: 1600, useNativeDriver: true }),
    );
    loop.start();
    return () => loop.stop();
  }, [pulse]);
  const scale = pulse.interpolate({ inputRange: [0, 1], outputRange: [0.55, 1] });
  const opacity = pulse.interpolate({ inputRange: [0, 1], outputRange: [0.7, 0] });
  return (
    <View style={styles.radar}>
      <Animated.View style={[styles.ring, { transform: [{ scale }], opacity }]} />
      <View style={styles.core} />
    </View>
  );
}

const styles = StyleSheet.create({
  fallback: { backgroundColor: colors.goldBright, alignItems: "center", justifyContent: "center" },
  plate: {
    backgroundColor: colors.plate,
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: colors.ink,
  },
  plateText: { color: colors.ink, fontFamily: type.bold, fontWeight: "700", letterSpacing: 0.6, fontSize: 13 },
  digits: { flexDirection: "row", gap: 8 },
  digit: {
    width: 46,
    height: 54,
    borderRadius: 12,
    backgroundColor: colors.mist,
    borderWidth: 1,
    borderColor: colors.goldBright,
    alignItems: "center",
    justifyContent: "center",
  },
  digitText: { color: colors.ink, fontFamily: type.semibold, fontSize: 22, fontWeight: "600" },
  handle: { alignSelf: "center", width: 36, height: 4, borderRadius: 2, backgroundColor: "#E7DDE2", marginBottom: 8 },
  radar: { width: 64, height: 64, alignItems: "center", justifyContent: "center" },
  ring: { position: "absolute", width: 64, height: 64, borderRadius: 32, borderWidth: 1.5, borderColor: colors.gold },
  core: { width: 10, height: 10, borderRadius: 5, backgroundColor: colors.gold },
});
