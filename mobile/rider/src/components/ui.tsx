import { Pressable, StyleSheet, Text, TextInput, View, type TextInputProps } from "react-native";
import { colors, type } from "../theme";

export function Button({
  label,
  onPress,
  disabled,
  tone = "solid",
}: {
  label: string;
  onPress: () => void;
  disabled?: boolean;
  tone?: "solid" | "ghost";
}) {
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      disabled={disabled}
      style={[styles.button, tone === "ghost" && styles.ghost, disabled && styles.disabled]}
    >
      <Text style={[styles.buttonText, tone === "ghost" && styles.ghostText]}>{label}</Text>
    </Pressable>
  );
}

export function Field(props: TextInputProps & { label: string }) {
  const { label, style, ...rest } = props;
  return (
    <View style={styles.fieldWrap}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <TextInput placeholderTextColor={colors.faint} style={[styles.field, style]} {...rest} />
    </View>
  );
}

export function Card({ children }: { children: React.ReactNode }) {
  return <View style={styles.card}>{children}</View>;
}

const styles = StyleSheet.create({
  button: {
    backgroundColor: colors.burgundy,
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: "center",
    justifyContent: "center",
    minHeight: 52,
  },
  ghost: { backgroundColor: colors.paper, borderWidth: 1, borderColor: colors.line },
  disabled: { opacity: 0.45 },
  buttonText: { color: colors.onAccent, fontFamily: type.semibold, fontWeight: "600", letterSpacing: 0, fontSize: 16, lineHeight: 20 },
  ghostText: { color: colors.burgundy },
  fieldWrap: { gap: 8 },
  fieldLabel: { color: colors.muted, fontFamily: type.medium, fontSize: 13, letterSpacing: 0.2 },
  field: {
    backgroundColor: colors.paper,
    color: colors.ink,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.line,
    height: 52,
    paddingHorizontal: 16,
    paddingVertical: 0,
    fontSize: 16,
    lineHeight: 52,
    fontFamily: type.regular,
  },
  card: {
    backgroundColor: colors.paper,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: colors.line,
    padding: 16,
  },
});
