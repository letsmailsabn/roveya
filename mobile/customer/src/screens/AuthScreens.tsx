import { useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { AuthLockup } from "../components/Logo";
import { Button, Field } from "../components/ui";
import { DEMO_LOGIN_CODE } from "../data";
import { useStore } from "../store";
import { colors } from "../theme";
import type { CustomerStack } from "../navigation";

export function PhoneScreen({ navigation }: NativeStackScreenProps<CustomerStack, "Phone">) {
  const [phone, setPhone] = useState("");
  const valid = /^[6-9]\d{9}$/.test(phone);
  return (
    <View style={styles.screen}>
      <AuthLockup />
      <Text style={styles.lead}>Enter the mobile number the captain should use to reach you.</Text>
      <Field label="Mobile" value={phone} onChangeText={(value) => setPhone(value.replace(/\D/g, "").slice(0, 10))} keyboardType="number-pad" placeholder="10-digit number" />
      <Button label="Send code" disabled={!valid} onPress={() => navigation.navigate("Otp", { phone })} />
      <Text style={styles.hint}>Check code {DEMO_LOGIN_CODE}. The ROVEYA desk holds it on this phone.</Text>
    </View>
  );
}

export function OtpScreen({ route, navigation }: NativeStackScreenProps<CustomerStack, "Otp">) {
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const store = useStore();
  return (
    <View style={styles.screen}>
      <AuthLockup />
      <Text style={styles.title}>Confirm it is you</Text>
      <Text style={styles.lead}>Code for +91 {route.params.phone}</Text>
      <Field label="4-DIGIT CODE" value={code} onChangeText={(value) => setCode(value.replace(/\D/g, "").slice(0, 4))} keyboardType="number-pad" placeholder="1234" />
      {error ? <Text style={styles.error}>{error}</Text> : null}
      <Button
        label="Continue"
        onPress={() => {
          if (code !== DEMO_LOGIN_CODE) {
            setError("Use the demo code 1234.");
            return;
          }
          if (store.session?.phone === route.params.phone && store.session.name) {
            store.signIn(store.session);
            return;
          }
          navigation.navigate("Name", { phone: route.params.phone });
        }}
      />
    </View>
  );
}

export function NameScreen({ route }: NativeStackScreenProps<CustomerStack, "Name">) {
  const [name, setName] = useState("");
  const store = useStore();
  return (
    <View style={styles.screen}>
      <AuthLockup />
      <Text style={styles.title}>What should captains call you?</Text>
      <Field label="Full name" value={name} onChangeText={setName} placeholder="Your name" autoCapitalize="words" />
      <Button
        label="Start riding"
        disabled={name.trim().length < 2}
        onPress={() => {
          store.signIn({ phone: route.params.phone, name: name.trim() });
        }}
      />
    </View>
  );
}

export function WelcomeActions({ onStart }: { onStart: () => void }) {
  return (
    <View style={styles.screen}>
      <AuthLockup />
      <Text style={styles.lead}>A bike, an auto, or a cab. Your seat, your fare, shown before you ride.</Text>
      <Button label="Continue with mobile" onPress={onStart} />
      <Pressable>
        <Text style={styles.hint}>By continuing you agree to the ROVEYA ride terms for this demo.</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.night, padding: 24, paddingTop: 56, gap: 16 },
  title: { color: colors.cream, fontSize: 28, fontWeight: "600" },
  lead: { color: colors.muted, fontSize: 16, lineHeight: 24 },
  hint: { color: colors.faint, fontSize: 13, lineHeight: 20 },
  error: { color: colors.goldBright },
});
