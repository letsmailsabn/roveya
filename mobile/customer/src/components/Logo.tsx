import { useEffect, useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { deskLive } from "../api";
import { colors, type } from "../theme";

export function Logo({ size = 40 }: { size?: number }) {
  return (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: size * 0.22,
        backgroundColor: colors.ink,
        alignItems: "center",
        justifyContent: "center",
        borderWidth: 1.2,
        borderColor: colors.burgundy,
      }}
    >
      <Text style={{ color: colors.mark, fontFamily: type.bold, fontSize: size * 0.46, fontWeight: "700", marginTop: -size * 0.08 }}>R</Text>
      <View
        style={{
          position: "absolute",
          bottom: size * 0.16,
          width: size * 0.56,
          height: 1.5,
          borderRadius: 2,
          backgroundColor: colors.burgundy,
        }}
      />
    </View>
  );
}

export function Wordmark({ kicker = "Premium taxipool and travel", size = 18 }: { kicker?: string; size?: number }) {
  return (
    <View>
      <Text style={{ color: colors.ink, fontFamily: type.bold, fontSize: size, fontWeight: "700", letterSpacing: 0.6 }}>ROVEYA</Text>
      <Text style={{ color: colors.gold, fontFamily: type.medium, fontSize: 11, letterSpacing: 0.4, marginTop: 2 }}>{kicker}</Text>
    </View>
  );
}

export function BrandHeader({ kicker = "Premium taxipool and travel" }: { kicker?: string }) {
  const insets = useSafeAreaInsets();
  const [live, setLive] = useState(false);
  useEffect(() => {
    let stop = false;
    const ping = () => {
      void deskLive().then((value) => {
        if (!stop) setLive(value);
      });
    };
    ping();
    const timer = setInterval(ping, 8000);
    return () => {
      stop = true;
      clearInterval(timer);
    };
  }, []);
  return (
    <View style={[styles.bar, { paddingTop: Math.max(insets.top, 12) }]}>
      <Logo />
      <View style={{ flex: 1 }}>
        <Wordmark kicker={kicker} />
      </View>
      {live ? (
        <View style={styles.live}>
          <View style={styles.dot} />
          <Text style={styles.liveText}>DESK LIVE</Text>
        </View>
      ) : null}
    </View>
  );
}

export function AuthLockup({ kicker = "Premium taxipool and travel" }: { kicker?: string }) {
  return (
    <View style={styles.lockup}>
      <Logo size={84} />
      <Text style={styles.hero}>ROVEYA</Text>
      <Text style={styles.kicker}>{kicker}</Text>
      <View style={styles.rule} />
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    backgroundColor: colors.sheet,
    borderBottomWidth: 1,
    borderBottomColor: colors.goldBright,
    paddingHorizontal: 16,
    paddingBottom: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  live: { flexDirection: "row", alignItems: "center", gap: 6, backgroundColor: colors.mist, borderRadius: 999, paddingHorizontal: 10, paddingVertical: 6 },
  dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: colors.gold },
  liveText: { color: colors.gold, fontFamily: type.semibold, fontSize: 11, letterSpacing: 0.4, fontWeight: "600" },
  lockup: { alignItems: "flex-start", gap: 8, marginBottom: 8 },
  hero: { color: colors.ink, fontFamily: type.bold, fontSize: 32, fontWeight: "700", letterSpacing: 0.4, marginTop: 8 },
  kicker: { color: colors.gold, fontFamily: type.medium, letterSpacing: 0.3, fontSize: 14 },
  rule: { width: 72, height: 2, backgroundColor: colors.gold, marginTop: 8, marginBottom: 12 },
});
