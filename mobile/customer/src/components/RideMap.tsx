import { createElement } from "react";
import { Platform, StyleSheet, View } from "react-native";
import { WebView } from "react-native-webview";
import type { Region } from "react-native-maps";
import { colors } from "../theme";

export function RideMap({
  region,
  markers,
  line,
}: {
  region: Region;
  markers: { id: string; latitude: number; longitude: number; title: string; pin: string }[];
  line?: { latitude: number; longitude: number }[];
}) {
  const html = mapHtml(region, markers, line);
  if (Platform.OS === "web") {
    return (
      <View style={styles.fill}>
        {createElement("iframe", {
          srcDoc: html,
          title: "ROVEYA map",
          style: { border: 0, width: "100%", height: "100%", background: colors.night },
        })}
      </View>
    );
  }
  return (
    <View style={styles.fill}>
      <WebView originWhitelist={["*"]} source={{ html }} style={styles.fill} scrollEnabled={false} setBuiltInZoomControls={false} />
    </View>
  );
}

export function regionAround(latitude: number, longitude: number, span = 0.08): Region {
  return { latitude, longitude, latitudeDelta: span, longitudeDelta: span };
}

function mapHtml(
  region: Region,
  markers: { latitude: number; longitude: number; title: string; pin: string }[],
  line?: { latitude: number; longitude: number }[],
) {
  const zoom = Math.max(10, Math.min(16, Math.round(Math.log2(360 / Math.max(region.latitudeDelta, 0.01)))));
  const points = markers
    .map(
      (marker) =>
        `L.circleMarker([${marker.latitude}, ${marker.longitude}], { radius: 8, color: "${marker.pin}", fillColor: "${marker.pin}", fillOpacity: 0.95, weight: 2 }).addTo(map).bindPopup(${JSON.stringify(marker.title)});`,
    )
    .join("\n");
  const route = line && line.length > 1
    ? `L.polyline(${JSON.stringify(line.map((point) => [point.latitude, point.longitude]))}, { color: "${colors.gold}", weight: 4 }).addTo(map);`
    : "";
  return `<!DOCTYPE html>
<html>
<head>
<meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1" />
<link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
<style>html,body,#map{height:100%;margin:0;background:${colors.night}} .leaflet-control-attribution{font-size:10px}</style>
</head>
<body>
<div id="map"></div>
<script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
<script>
const map = L.map("map", { zoomControl: false }).setView([${region.latitude}, ${region.longitude}], ${zoom});
L.tileLayer("https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Light_Gray_Base/MapServer/tile/{z}/{y}/{x}", { maxZoom: 16, attribution: "Tiles &copy; Esri" }).addTo(map);
L.tileLayer("https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Light_Gray_Reference/MapServer/tile/{z}/{y}/{x}", { maxZoom: 16 }).addTo(map);
${route}
${points}
</script>
</body>
</html>`;
}

const styles = StyleSheet.create({
  fill: { flex: 1, backgroundColor: colors.night },
});
