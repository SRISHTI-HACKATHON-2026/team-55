"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import "leaflet/dist/leaflet.css";

const MAPTILER_KEY = process.env.NEXT_PUBLIC_MAPTILER_API_KEY || "fm63BZNe6hXB2ad5Xaz5";

export default function LocationPicker({ position, onPositionChange }) {
  const containerRef = useRef(null);
  const mapRef = useRef(null);
  const markerRef = useRef(null);
  const [loadingLocation, setLoadingLocation] = useState(false);
  const hasAutoLocated = useRef(false);

  useEffect(() => {
    let cancelled = false;

    // Auto-GPS silently on mount
    if (!hasAutoLocated.current && navigator.geolocation) {
      hasAutoLocated.current = true;
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          if (!cancelled) onPositionChange({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        },
        () => {},
        { enableHighAccuracy: true, timeout: 12000, maximumAge: 0 }
      );
    }

    // Defer map init slightly to avoid React Strict Mode double-call race
    const timer = setTimeout(async () => {
      if (cancelled || !containerRef.current) return;

      // Guard: don't re-initialize if already done
      if (mapRef.current) return;
      // Guard: don't initialize if Leaflet already owns this container
      if (containerRef.current._leaflet_id) {
        delete containerRef.current._leaflet_id;
      }

      const L = (await import("leaflet")).default;
      await import("leaflet-defaulticon-compatibility");
      await import("leaflet-defaulticon-compatibility/dist/leaflet-defaulticon-compatibility.css");

      if (cancelled || !containerRef.current || mapRef.current) return;

      const map = L.map(containerRef.current, {
        center: [position.lat, position.lng],
        zoom: 18,
        zoomControl: true,
      });

      L.tileLayer(
        `https://api.maptiler.com/maps/streets-v2/256/{z}/{x}/{y}.png?key=${MAPTILER_KEY}`,
        { attribution: "&copy; MapTiler" }
      ).addTo(map);

      const marker = L.marker([position.lat, position.lng], { draggable: true }).addTo(map);
      marker.on("dragend", () => {
        const { lat, lng } = marker.getLatLng();
        onPositionChange({ lat, lng });
      });

      mapRef.current = map;
      markerRef.current = marker;
    }, 50); // 50ms defer — lets React finish its double-invoke before we touch DOM

    return () => {
      cancelled = true;
      clearTimeout(timer);
      if (mapRef.current) {
        try { mapRef.current.remove(); } catch (_) {}
        mapRef.current = null;
        markerRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Sync position changes → move marker + pan map
  useEffect(() => {
    if (!mapRef.current || !markerRef.current) return;
    markerRef.current.setLatLng([position.lat, position.lng]);
    mapRef.current.setView([position.lat, position.lng], 18);
  }, [position.lat, position.lng]);

  const handleGetCurrentLocation = useCallback(() => {
    if (!navigator.geolocation) { alert("Geolocation not supported."); return; }
    setLoadingLocation(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => { onPositionChange({ lat: pos.coords.latitude, lng: pos.coords.longitude }); setLoadingLocation(false); },
      (err) => {
        setLoadingLocation(false);
        if (err.code === err.PERMISSION_DENIED) alert("Enable Location Permissions in browser settings.");
        else if (err.code === err.TIMEOUT) alert("GPS timed out. Drag the pin manually.");
        else alert("Could not get location. Drag the pin to your spot.");
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }
    );
  }, [onPositionChange]);

  return (
    <div className="space-y-3">
      <button
        onClick={handleGetCurrentLocation}
        type="button"
        disabled={loadingLocation}
        className={`w-full py-3 px-4 rounded-xl font-bold shadow-md transition-all flex items-center justify-center gap-2 text-white ${
          loadingLocation ? "bg-slate-400 cursor-not-allowed" : "bg-green-600 hover:bg-green-700 active:scale-95"
        }`}
      >
        {loadingLocation ? (
          <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />Acquiring GPS...</>
        ) : "📍 Use My Current Location"}
      </button>

      <div
        ref={containerRef}
        className="h-64 w-full rounded-2xl overflow-hidden border-2 border-slate-200 shadow-xl relative z-0"
        style={{ minHeight: "16rem" }}
      />

      <div className="bg-blue-50 p-3 rounded-xl border border-blue-100">
        <p className="text-xs text-blue-800 text-center">
          <b>Tip:</b> If the pin is slightly off, <b>drag the marker</b> to the exact spot.
        </p>
      </div>
    </div>
  );
}