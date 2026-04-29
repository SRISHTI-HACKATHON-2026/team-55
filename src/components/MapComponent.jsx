"use client";

import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import "leaflet-defaulticon-compatibility";
import "leaflet-defaulticon-compatibility/dist/leaflet-defaulticon-compatibility.css";

export default function MapComponent({ reports, onResolve }) {
  // Center of map defaults to Dharwad
  const center = reports.length > 0 && reports[0].location
    ? [reports[0].location.lat, reports[0].location.lng]
    : [15.4589, 75.0078];

  return (
    <div className="h-[500px] w-full rounded-3xl overflow-hidden border border-slate-200 shadow-sm relative z-0">
      <MapContainer center={center} zoom={14} scrollWheelZoom={true} className="h-full w-full">
        <TileLayer
          attribution='&copy; <a href="https://www.maptiler.com/copyright/">MapTiler</a> &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url={`https://api.maptiler.com/maps/streets-v2/256/{z}/{x}/{y}.png?key=${process.env.NEXT_PUBLIC_MAPTILER_API_KEY || "fm63BZNe6hXB2ad5Xaz5"}`}
        />
        {reports.map((report) => {
          if (!report.location || !report.location.lat) return null;
          return (
            <Marker key={report._id} position={[report.location.lat, report.location.lng]}>
              <Popup>
                <div className="flex flex-col gap-1 p-1">
                  <span className="text-xs text-slate-400 font-bold uppercase tracking-wider">
                    {new Date(report.timestamp).toLocaleDateString()}
                  </span>
                  <h3 className="font-bold text-slate-800">{report.type}</h3>
                  {report.description && <p className="text-sm text-slate-600 mb-2">{report.description}</p>}
                  <p className="text-xs text-slate-500 mb-3">Reported by: {report.reporterName}</p>
                  
                  {report.status === "Pending" && (
                    <button 
                      onClick={() => onResolve(report._id)}
                      className="bg-emerald-600 text-white text-xs font-bold py-1.5 px-3 rounded-md hover:bg-emerald-700 transition"
                    >
                      Mark Resolved
                    </button>
                  )}
                  {report.status === "Resolved" && (
                    <span className="text-emerald-600 font-bold text-xs">✓ Resolved</span>
                  )}
                </div>
              </Popup>
            </Marker>
          );
        })}
      </MapContainer>
    </div>
  );
}
