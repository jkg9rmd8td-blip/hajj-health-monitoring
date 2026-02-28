"use client"

import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet"
import "leaflet/dist/leaflet.css"

export default function LiveMap() {
  const positions = [
    { lat: 21.4225, lng: 39.8262, status: "CRITICAL" },
    { lat: 21.3891, lng: 39.8579, status: "WARNING" },
    { lat: 21.4350, lng: 39.8200, status: "STABLE" }
  ]

  return (
    <MapContainer
      center={[21.4225, 39.8262]}
      zoom={13}
      style={{ height: "400px", borderRadius: "12px" }}
    >
      <TileLayer
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />

      {positions.map((pos, i) => (
        <Marker key={i} position={[pos.lat, pos.lng]}>
          <Popup>
            Risk Level: {pos.status}
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  )
}
