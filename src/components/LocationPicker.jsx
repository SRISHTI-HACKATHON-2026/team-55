"use client";

import { useState, useCallback, useEffect } from "react";
import { Navigation, MapPin, CheckCircle2 } from "lucide-react";
import dynamic from "next/dynamic";
import "leaflet/dist/leaflet.css";

import { MapContainer, TileLayer, Marker, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import "leaflet-defaulticon-compatibility/dist/leaflet-defaulticon-compatibility.css";
import "leaflet-defaulticon-compatibility";

import { useMemo, useRef } from "react";

// Helper component for a draggable marker
function DraggableMarker({ position, onPositionChange }) {
  const markerRef = useRef(null);
  const eventHandlers = useMemo(
    () => ({
      dragend() {
        const marker = markerRef.current;
        if (marker != null) {
          const newPos = marker.getLatLng();
          onPositionChange({ lat: newPos.lat, lng: newPos.lng });
        }
      },
    }),
    [onPositionChange]
  );

  return (
    <Marker
      draggable={true}
      eventHandlers={eventHandlers}
      position={[position.lat, position.lng]}
      ref={markerRef}
    />
  );
}

// Helper component to center map and fix grey tiles
function ChangeView({ center }) {
  const map = useMap();
  useEffect(() => {
    if (center && center[0] && center[1] && map) {
      map.setView(center, 16);
      // Fix for 'missing parts' of map (grey tiles)
      setTimeout(() => {
        map.invalidateSize();
      }, 100);
    }
  }, [center?.[0], center?.[1], map]);
  return null;
}

export default function LocationPicker({ position, onPositionChange }) {
  const [loadingLocation, setLoadingLocation] = useState(false);
  const [error, setError] = useState(null);

  const handleGetCurrentLocation = useCallback(() => {
    if (!navigator.geolocation) { 
      setError("Geolocation is not supported by your browser.");
      return; 
    }
    
    setLoadingLocation(true);
    setError(null);
    
    navigator.geolocation.getCurrentPosition(
      (pos) => { 
        onPositionChange({ lat: pos.coords.latitude, lng: pos.coords.longitude }); 
        setLoadingLocation(false); 
      },
      (err) => {
        setLoadingLocation(false);
        if (err.code === err.PERMISSION_DENIED) {
          setError("Location access denied. Please enable Location Permissions in your browser settings.");
        } else if (err.code === err.TIMEOUT) {
          setError("GPS request timed out. Please try again.");
        } else {
          setError("Could not acquire accurate GPS location. Please check your signal.");
        }
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }
    );
  }, [onPositionChange]);

  const hasPosition = position && position.lat && position.lng;

  return (
    <div className="flex flex-col gap-4">
      <button
        onClick={handleGetCurrentLocation}
        type="button"
        disabled={loadingLocation}
        className={`w-full py-4 px-4 rounded-2xl font-black shadow-lg transition-all flex items-center justify-center gap-3 text-white border-b-4 ${
          loadingLocation 
            ? "bg-slate-400 border-slate-500 cursor-wait" 
            : "bg-[#1e40af] border-[#16308f] hover:bg-[#1c3aa9] hover:-translate-y-0.5 active:translate-y-0 active:border-b-0"
        }`}
      >
        {loadingLocation ? (
          <><div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" /> Acquiring High-Accuracy GPS...</>
        ) : (
          <><Navigation className={`w-5 h-5 ${hasPosition ? "animate-pulse" : ""}`} /> {hasPosition ? "Refresh GPS Coordinates" : "Get Exact GPS Coordinates"}</>
        )}
      </button>

      {error && (
        <div className="bg-rose-50 text-rose-600 p-4 rounded-2xl text-sm font-bold border border-rose-100 flex items-center gap-3 animate-shake">
          <div className="w-2 h-2 bg-rose-500 rounded-full animate-ping" />
          {error}
        </div>
      )}

      {hasPosition && !loadingLocation && !error && (
        <div className="flex flex-col lg:flex-row gap-4 animate-in fade-in slide-in-from-top-2 duration-500 max-h-[500px]">
          {/* Coordinates Card */}
          <div className="lg:w-1/3 bg-slate-50 p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-center items-center gap-3">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-emerald-500" />
              <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">GPS Lock Acquired</p>
            </div>
            
            <div className="w-full space-y-2">
              <div className="bg-white px-4 py-3 rounded-xl border border-slate-200 flex justify-between items-center shadow-sm">
                <span className="text-[10px] font-black text-emerald-600">LAT</span>
                <span className="font-mono text-sm font-bold text-slate-900">{position.lat.toFixed(6)}</span>
              </div>
              <div className="bg-white px-4 py-3 rounded-xl border border-slate-200 flex justify-between items-center shadow-sm">
                <span className="text-[10px] font-black text-emerald-600">LNG</span>
                <span className="font-mono text-sm font-bold text-slate-900">{position.lng.toFixed(6)}</span>
              </div>
            </div>

            <div className="flex items-center gap-2 mt-1">
              <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
              <p className="text-[10px] text-slate-400 font-bold uppercase">Signal: Excellent</p>
            </div>
          </div>

          {/* Map Preview */}
          <div className="lg:flex-1 h-[180px] lg:h-[180px] rounded-2xl overflow-hidden border border-slate-200 shadow-inner relative z-0">
            <MapContainer
              key="location-picker-map"
              center={[position.lat, position.lng]}
              zoom={16}
              scrollWheelZoom={false}
              className="h-full w-full"
              style={{ height: '100%', width: '100%' }}
            >
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />
              <DraggableMarker position={position} onPositionChange={onPositionChange} />
              <ChangeView center={[position.lat, position.lng]} />
            </MapContainer>
          </div>
        </div>
      )}
    </div>
  );
}