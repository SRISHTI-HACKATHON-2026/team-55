"use client";

import { useEffect, useRef, useState } from "react";
import jsVectorMap from "jsvectormap";
import "jsvectormap/dist/jsvectormap.css";
// Import the world map that comes with jsvectormap
import "jsvectormap/dist/maps/world.js";

export default function CommunityVectorMap({ reports = [] }) {
  const mapRef = useRef(null);
  const mapInstance = useRef(null);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    if (!isMounted || !mapRef.current) return;

    // Convert reports to markers
    const markers = reports
      .filter(r => r.location?.lat && r.location?.lng)
      .map(r => ({
        name: r.type,
        coords: [r.location.lat, r.location.lng],
        style: { 
          fill: r.type === "Water Wastage" ? "#0ea5e9" : 
                r.type === "Garbage" ? "#ef4444" : "#f59e0b"
        }
      }));

    if (!mapInstance.current) {
      mapInstance.current = new jsVectorMap({
        selector: mapRef.current,
        map: "world",
        backgroundColor: "transparent",
        draggable: true,
        zoomButtons: true,
        zoomOnScroll: true,
        regionStyle: {
          initial: { fill: "#e2e8f0", stroke: "#94a3b8", strokeWidth: 0.5 },
          hover: { fill: "#10b981", fillOpacity: 0.8 },
        },
        markers: markers,
        markerStyle: {
          initial: { fill: "#10b981", r: 5, stroke: "#fff", strokeWidth: 2 },
          hover: { r: 7, fillOpacity: 1 },
        },
        // Focus on India (Coordinates for India roughly)
        focusOn: {
          coords: [20.5937, 78.9629],
          scale: 4, // Zoom in
          animate: true,
        },
        onRegionTooltipShow(event, tooltip, code) {
          // Customize tooltip
        },
        onMarkerTooltipShow(event, tooltip, index) {
          tooltip.text(
            `<div style="padding: 4px;">
              <b>${markers[index].name}</b>
            </div>`,
            true // true allows HTML
          );
        }
      });
    } else {
      // If map is already initialized, just update markers
      mapInstance.current.addMarkers(markers);
    }

    return () => {
      if (mapInstance.current) {
        // Unfortunately jsVectorMap doesn't have a perfect destroy method for React strict mode in all versions,
        // but we can remove the HTML it generated if needed.
        // mapInstance.current.destroy(); 
      }
    };
  }, [isMounted, reports]);

  if (!isMounted) return <div className="h-96 w-full bg-slate-100 animate-pulse rounded-3xl border border-slate-200" />;

  return (
    <div className="bg-white p-4 rounded-3xl border border-slate-100 shadow-sm flex flex-col gap-3">
      <div className="flex justify-between items-center px-2">
        <div>
          <h3 className="font-bold text-slate-800">Global Overview</h3>
          <p className="text-xs text-slate-500">Vector representation of active reports</p>
        </div>
      </div>
      <div 
        ref={mapRef} 
        style={{ width: "100%", height: "400px" }} 
        className="rounded-2xl overflow-hidden border border-slate-100"
      />
    </div>
  );
}
