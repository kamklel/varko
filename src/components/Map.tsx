"use client";

import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

// Default Leaflet marker icons resolve to image assets that break under
// bundlers, so we use inline divIcons instead -- sidesteps the issue and
// looks more on-brand anyway.
const pinIcon = L.divIcon({
  className: "",
  html: `<div style="background:#171717;width:16px;height:16px;border-radius:50% 50% 50% 0;transform:rotate(-45deg);border:2px solid white;box-shadow:0 1px 3px rgba(0,0,0,0.4);"></div>`,
  iconSize: [16, 16],
  iconAnchor: [8, 16],
});

const youAreHereIcon = L.divIcon({
  className: "",
  html: `<div style="background:#2563eb;width:14px;height:14px;border-radius:50%;border:3px solid white;box-shadow:0 0 0 2px #2563eb;"></div>`,
  iconSize: [14, 14],
  iconAnchor: [7, 7],
});

// Airbnb-style price pill instead of a plain dot, so the map is scannable at
// a glance. Width is estimated from the label's length since divIcon has no
// intrinsic sizing.
function priceIcon(price: string) {
  const width = Math.max(44, price.length * 8 + 22);
  return L.divIcon({
    className: "",
    html: `<div style="background:#2563eb;color:white;padding:4px 10px;border-radius:9999px;font:600 12px system-ui, sans-serif;white-space:nowrap;box-shadow:0 1px 4px rgba(0,0,0,0.35);border:2px solid white;">${price}</div>`,
    iconSize: [width, 26],
    iconAnchor: [width / 2, 13],
  });
}

export type MapPin = { id: string; lat: number; lng: number; label?: string; price?: string };

export function Map({
  center,
  zoom = 13,
  pins,
  youAreHere,
}: {
  center: [number, number];
  zoom?: number;
  pins: MapPin[];
  youAreHere?: [number, number];
}) {
  return (
    <MapContainer
      center={center}
      zoom={zoom}
      style={{ height: "100%", width: "100%" }}
      scrollWheelZoom
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      {youAreHere && <Marker position={youAreHere} icon={youAreHereIcon} />}
      {pins.map((p) => (
        <Marker key={p.id} position={[p.lat, p.lng]} icon={p.price ? priceIcon(p.price) : pinIcon}>
          {p.label && (
            <Popup>
              {p.label}
              {p.price && <><br />{p.price}</>}
            </Popup>
          )}
        </Marker>
      ))}
    </MapContainer>
  );
}
