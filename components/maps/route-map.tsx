"use client";

import { Fragment } from "react";
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  Polyline,
} from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

// Webpack drops Leaflet's default marker assets; point at the CDN copies.
const pickupIcon = new L.Icon({
  iconUrl:
    "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  iconRetinaUrl:
    "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  shadowUrl:
    "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
});

export interface RoutePoint {
  id: string;
  pickup: { lat: number; lng: number; label: string };
  dropoff: { lat: number; lng: number; label: string };
  title: string;
  subtitle?: string;
}

const ROUTE_COLORS = ["#059669", "#0284c7", "#d97706", "#7c3aed", "#dc2626"];

export default function RouteMap({ routes }: { routes: RoutePoint[] }) {
  const allPoints = routes.flatMap((r) => [
    [r.pickup.lat, r.pickup.lng] as [number, number],
    [r.dropoff.lat, r.dropoff.lng] as [number, number],
  ]);

  const center: [number, number] =
    allPoints.length > 0
      ? [
          allPoints.reduce((s, p) => s + p[0], 0) / allPoints.length,
          allPoints.reduce((s, p) => s + p[1], 0) / allPoints.length,
        ]
      : [8.0, 5.0]; // Nigeria fallback

  return (
    <MapContainer
      center={center}
      zoom={routes.length > 0 ? 7 : 6}
      scrollWheelZoom
      style={{ height: "100%", width: "100%" }}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      {routes.map((r, i) => (
        <Fragment key={r.id}>
          <Marker position={[r.pickup.lat, r.pickup.lng]} icon={pickupIcon}>
            <Popup>
              <strong>Pickup:</strong> {r.pickup.label}
              <br />
              {r.title}
            </Popup>
          </Marker>
          <Marker position={[r.dropoff.lat, r.dropoff.lng]} icon={pickupIcon}>
            <Popup>
              <strong>Drop-off:</strong> {r.dropoff.label}
              <br />
              {r.title}
              {r.subtitle ? (
                <>
                  <br />
                  {r.subtitle}
                </>
              ) : null}
            </Popup>
          </Marker>
          <Polyline
            positions={[
              [r.pickup.lat, r.pickup.lng],
              [r.dropoff.lat, r.dropoff.lng],
            ]}
            pathOptions={{
              color: ROUTE_COLORS[i % ROUTE_COLORS.length],
              weight: 3,
              dashArray: "6 8",
            }}
          />
        </Fragment>
      ))}
    </MapContainer>
  );
}
