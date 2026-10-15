import { useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { gateway } from "../api";
import { AuthLockup, BrandHeader } from "../components/Logo";
import { Button, Field } from "../components/ui";
import { cities, DEMO_LOGIN_CODE } from "../data";
import { useStore } from "../store";
import { colors } from "../theme";
import type { VehicleKind } from "../types";
import type { RiderStack } from "../navigation";

export function PhoneScreen({ navigation }: NativeStackScreenProps<RiderStack, "Phone">) {
  const [phone, setPhone] = useState("");
  const valid = /^[6-9]\d{9}$/.test(phone);
  return (
    <View style={styles.screen}>
      <AuthLockup kicker="Captain" />
      <Text style={styles.lead}>Captain sign in. Use the mobile number on your licence.</Text>
      <Field label="Mobile" value={phone} onChangeText={(value) => setPhone(value.replace(/\D/g, "").slice(0, 10))} keyboardType="number-pad" placeholder="10-digit number" />
      <Button label="Send code" disabled={!valid} onPress={() => navigation.navigate("Otp", { phone })} />
      <Text style={styles.hint}>Check code {DEMO_LOGIN_CODE}. The ROVEYA desk holds it on this phone.</Text>
    </View>
  );
}

export function OtpScreen({ route, navigation }: NativeStackScreenProps<RiderStack, "Otp">) {
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const profile = useStore().profile;
  return (
    <View style={styles.screen}>
      <AuthLockup kicker="Captain" />
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
          if (profile?.phone === route.params.phone && profile.agreed) {
            return;
          }
          navigation.navigate("Register", { phone: route.params.phone });
        }}
      />
    </View>
  );
}

export function RegisterScreen({ route }: NativeStackScreenProps<RiderStack, "Register">) {
  const store = useStore();
  const [step, setStep] = useState(0);
  const [name, setName] = useState("");
  const [city, setCity] = useState(cities[0]);
  const [vehicle, setVehicle] = useState<VehicleKind>("bike");
  const [vehicleNo, setVehicleNo] = useState("");
  const [vehicleName, setVehicleName] = useState("");
  const [licence, setLicence] = useState("");
  const [rcAdded, setRcAdded] = useState(false);
  const [licenceAdded, setLicenceAdded] = useState(false);
  const [aadhaar, setAadhaar] = useState("");
  const [account, setAccount] = useState("");
  const [ifsc, setIfsc] = useState("");
  const [agreed, setAgreed] = useState(false);

  const finish = () => {
    store.saveProfile({
      phone: route.params.phone,
      name: name.trim(),
      city,
      vehicle,
      vehicleNo: vehicleNo.trim().toUpperCase(),
      vehicleName: vehicleName.trim(),
      licence: licence.trim().toUpperCase(),
      accountLast4: account,
      ifsc: ifsc.trim().toUpperCase(),
      agreed: true,
    });
    void gateway("/v1/captains", {
      phone: route.params.phone,
      name: name.trim(),
      city,
      vehicle,
      vehicleNo: vehicleNo.trim().toUpperCase(),
      vehicleName: vehicleName.trim(),
      licence: licence.trim().toUpperCase(),
    });
  };

  return (
    <View style={styles.scroll}>
    <BrandHeader kicker="Captain" />
    <ScrollView contentContainerStyle={styles.form}>
      <Text style={styles.kicker}>ROVEYA · STEP {step + 1} OF 4</Text>
      {step === 0 ? (
        <>
          <Text style={styles.title}>About you</Text>
          <Field label="Full name" value={name} onChangeText={setName} placeholder="Name on the licence" />
          <Text style={styles.label}>CITY</Text>
          <View style={styles.row}>
            {cities.slice(0, 4).map((item) => (
              <Pressable key={item} style={[styles.chip, city === item && styles.on]} onPress={() => setCity(item)}>
                <Text style={styles.chipText}>{item}</Text>
              </Pressable>
            ))}
          </View>
          <Button label="Next" disabled={name.trim().length < 2} onPress={() => setStep(1)} />
        </>
      ) : null}
      {step === 1 ? (
        <>
          <Text style={styles.title}>Your vehicle</Text>
          <View style={styles.row}>
            {(["bike", "auto", "cab"] as VehicleKind[]).map((item) => (
              <Pressable key={item} style={[styles.chip, vehicle === item && styles.on]} onPress={() => setVehicle(item)}>
                <Text style={styles.chipText}>{item}</Text>
              </Pressable>
            ))}
          </View>
          <Field label="Vehicle number" value={vehicleNo} onChangeText={setVehicleNo} placeholder="TS09 AB 2146" autoCapitalize="characters" />
          <Field label="Model" value={vehicleName} onChangeText={setVehicleName} placeholder="Honda SP 125" />
          <Button label="Next" disabled={vehicleNo.trim().length < 4 || vehicleName.trim().length < 2} onPress={() => setStep(2)} />
        </>
      ) : null}
      {step === 2 ? (
        <>
          <Text style={styles.title}>Documents</Text>
          <Text style={styles.lead}>These stay on the phone for the demo. Nothing is uploaded.</Text>
          <Field label="Licence number" value={licence} onChangeText={setLicence} placeholder="TS0123456789012" autoCapitalize="characters" />
          <Pressable style={styles.doc} onPress={() => setLicenceAdded(true)}><Text style={styles.chipText}>{licenceAdded ? "Licence photo added" : "Add licence photo"}</Text></Pressable>
          <Pressable style={styles.doc} onPress={() => setRcAdded(true)}><Text style={styles.chipText}>{rcAdded ? "RC added" : "Add RC"}</Text></Pressable>
          <Field label="Aadhaar last 4" value={aadhaar} onChangeText={(value) => setAadhaar(value.replace(/\D/g, "").slice(0, 4))} keyboardType="number-pad" placeholder="1234" />
          <Button label="Next" disabled={!licenceAdded || !rcAdded || licence.trim().length < 6 || aadhaar.length < 4} onPress={() => setStep(3)} />
        </>
      ) : null}
      {step === 3 ? (
        <>
          <Text style={styles.title}>Payout and agreement</Text>
          <Field label="Account last 4" value={account} onChangeText={(value) => setAccount(value.replace(/\D/g, "").slice(0, 4))} keyboardType="number-pad" placeholder="6789" />
          <Field label="IFSC" value={ifsc} onChangeText={setIfsc} placeholder="SBIN0001234" autoCapitalize="characters" />
          <Pressable style={styles.doc} onPress={() => setAgreed((value) => !value)}>
            <Text style={styles.chipText}>{agreed ? "Agreement accepted" : "I will follow the ROVEYA captain rules"}</Text>
          </Pressable>
          <Text style={styles.lead}>The ROVEYA desk accepts this registration for the check. Documents stay on this phone.</Text>
          <Button label="Finish and go online" disabled={!agreed || account.length < 4 || ifsc.trim().length < 6} onPress={finish} />
        </>
      ) : null}
    </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  scroll: { flex: 1, backgroundColor: colors.night },
  screen: { flex: 1, padding: 24, paddingTop: 48, gap: 16 },
  form: { gap: 16, padding: 20, paddingBottom: 40 },
  title: { color: colors.cream, fontSize: 32, fontWeight: "600" },
  lead: { color: colors.muted, lineHeight: 22 },
  hint: { color: colors.faint },
  error: { color: colors.goldBright },
  kicker: { color: colors.gold, letterSpacing: 1.4 },
  label: { color: colors.muted, letterSpacing: 0.3, fontSize: 13 },
  row: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  chip: { borderRadius: 999, paddingHorizontal: 12, paddingVertical: 8, borderWidth: 1, borderColor: colors.goldBright, backgroundColor: colors.paper },
  on: { borderColor: colors.gold, backgroundColor: colors.paper },
  chipText: { color: colors.cream },
  doc: { backgroundColor: colors.paper, borderRadius: 16, padding: 14 },
});
