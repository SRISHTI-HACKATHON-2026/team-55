"use client";

import { useState, useCallback } from "react";
import { Navigation } from "lucide-react";

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

  return (
    <div className="space-y-4">
      <button
        onClick={handleGetCurrentLocation}
        type="button"
        disabled={loadingLocation}
        className={`w-full py-4 px-4 rounded-xl font-bold shadow-md transition-all flex items-center justify-center gap-2 text-white ${
          loadingLocation ? "bg-emerald-400 cursor-wait" : "bg-emerald-600 hover:bg-emerald-700 active:scale-95"
        }`}
      >
        {loadingLocation ? (
          <><div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" /> Acquiring High-Accuracy GPS...</>
        ) : (
          <><Navigation className="w-5 h-5" /> Get Exact GPS Coordinates</>
        )}
      </button>

      {error && (
        <div className="bg-rose-50 text-rose-600 p-3 rounded-xl text-sm font-semibold border border-rose-100">
          {error}
        </div>
      )}

      {position && position.lat && !loadingLocation && !error && (
        <div className="bg-emerald-50 p-4 rounded-xl border border-emerald-100 flex flex-col gap-1 items-center">
          <p className="text-xs font-bold text-emerald-600 uppercase tracking-widest">Locked Coordinates</p>
          <div className="flex items-center gap-4 text-emerald-800 font-mono font-medium">
            <span>Lat: {position.lat.toFixed(6)}</span>
            <span>Lng: {position.lng.toFixed(6)}</span>
          </div>
        </div>
      )}
    </div>
  );
}