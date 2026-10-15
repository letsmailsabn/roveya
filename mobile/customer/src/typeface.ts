import { Platform, StyleSheet, type TextStyle } from "react-native";
import { type } from "./theme";

const original = StyleSheet.create.bind(StyleSheet);

function family(weight?: TextStyle["fontWeight"]) {
  const value = String(weight ?? "400");
  if (value === "700" || value === "bold" || value === "800" || value === "900") return type.bold;
  if (value === "600") return type.semibold;
  if (value === "500" || value === "medium") return type.medium;
  return type.regular;
}

StyleSheet.create = ((styles: StyleSheet.NamedStyles<Record<string, unknown>>) => {
  const next: Record<string, unknown> = {};
  for (const key of Object.keys(styles)) {
    const value = styles[key];
    if (value && typeof value === "object" && ("fontSize" in value || "fontWeight" in value || "letterSpacing" in value)) {
      const text = value as TextStyle;
      const fontSize = typeof text.fontSize === "number" ? text.fontSize : 16;
      const authored = typeof text.lineHeight === "number" ? text.lineHeight : undefined;
      const lineHeight = authored ?? Math.round(fontSize * 1.2);
      next[key] = {
        ...text,
        fontFamily: text.fontFamily ?? family(text.fontWeight),
        fontWeight: "400",
        lineHeight,
        overflow: "visible",
      };
    } else {
      next[key] = value;
    }
  }
  return original(next as never);
}) as typeof StyleSheet.create;

if (Platform.OS === "web" && typeof document !== "undefined") {
  document.documentElement.style.height = "100%";
  document.body.style.height = "100%";
  document.body.style.margin = "0";
  document.body.style.overflow = "hidden";
  document.body.style.background = "#F4F0F2";
  const root = document.getElementById("root");
  if (root) {
    root.style.height = "100%";
    root.style.overflow = "hidden";
  }
  const cursor = document.createElement("style");
  cursor.textContent = "body{user-select:none;-webkit-user-select:none}input,textarea{user-select:text;-webkit-user-select:text;caret-color:#12060D}[role=button],[role=tab]{cursor:pointer}";
  document.head.appendChild(cursor);
}
