"use client";

import { MapContainer, TileLayer, Marker, useMap } from "react-leaflet";
import { useEffect } from "react";
import "leaflet/dist/leaflet.css";
import "leaflet-defaulticon-compatibility";
import "leaflet-defaulticon-compatibility/dist/leaflet-defaulticon-compatibility.css";

// Helper for visibility
function ChangeView({ center }) {
  const map = useMap();
  useEffect(() => {
    if (map) {
      setTimeout(() => {
        map.invalidateSize();
        if (center) map.setView(center, map.getZoom());
      }, 400);
    }
  }, [map, center]);
  return null;
}

export default function MiniMap({ lat, lng }) {
  return (
    <div className="h-64 w-full mt-4 rounded-2xl overflow-hidden border border-slate-200 shadow-inner relative z-0">
      <MapContainer 
        key={`mini-map-${lat}-${lng}`}
        center={[lat, lng]} 
        zoom={15} 
        scrollWheelZoom={false} 
        className="h-full w-full"
      >
        <TileLayer
          attribution='&copy; <a href="https://www.maptiler.com/copyright/">MapTiler</a> &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url={`https://api.maptiler.com/maps/streets-v2/256/{z}/{x}/{y}.png?key=${process.env.NEXT_PUBLIC_MAPTILER_API_KEY || "fm63BZNe6hXB2ad5Xaz5"}`}
        />
        <Marker position={[lat, lng]} />
        <ChangeView center={[lat, lng]} />
      </MapContainer>
    </div>
  );
}
