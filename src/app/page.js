"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { Droplet, Trash2, Box, CheckCircle2, MapPin, Loader2, Navigation, Clock, Trophy, Map as MapIcon, Award, ShieldAlert, AlertTriangle, Zap, TrendingDown } from "lucide-react";
import { db } from "../lib/db/dexie";
import SyncService from "../components/SyncService";
import dynamic from "next/dynamic";

const LocationPicker = dynamic(() => import("../components/LocationPicker"), { ssr: false });

export default function ResidentPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const [redirecting, setRedirecting] = useState(false);
  
  // Tab Navigation
  const searchParams = useSearchParams();
  const [activeTab, setActiveTab] = useState("report"); 
  
  useEffect(() => {
    const tab = searchParams.get("tab");
    if (tab) setActiveTab(tab);
  }, [searchParams]);

  // Data States
  const [myReports, setMyReports] = useState([]);
  const [leaderboard, setLeaderboard] = useState([]);
  const [isLoadingData, setIsLoadingData] = useState(false);

  // Form States
  const [reported, setReported] = useState(null);
  const [description, setDescription] = useState("");
  const [materialType, setMaterialType] = useState("Plastic");
  const [isLocating, setIsLocating] = useState(true);
  const [image, setImage] = useState(null);
  const [aiClassification, setAiClassification] = useState(null); // { type, confidence, description, materialType }
  const [isClassifying, setIsClassifying] = useState(false);
  const [selectedType, setSelectedType] = useState(null); // null = user hasn't overridden AI pick
  
  // Search states
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  
  // Default to Dharwad, Karnataka for the Hackathon presentation
  const [position, setPosition] = useState({ lat: 15.4589, lng: 75.0078 });

  // Fetch data on tab change
  useEffect(() => {
    if (activeTab === "history" && session) {
      setIsLoadingData(true);
      fetch("/api/my-reports").then(res => res.json()).then(data => {
        setMyReports(data.reports || []);
        setIsLoadingData(false);
      });
    } else if (activeTab === "leaderboard") {
      setIsLoadingData(true);
      fetch("/api/leaderboard").then(res => res.json()).then(data => {
        setLeaderboard(data.leaderboard || []);
        setIsLoadingData(false);
      });
    }
  }, [activeTab, session]);

  const handleImageCapture = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setAiClassification(null);
    setSelectedType(null);

    const reader = new FileReader();
    reader.onloadend = () => {
      const img = new Image();
      img.src = reader.result;
      img.onload = async () => {
        const canvas = document.createElement("canvas");
        const MAX_WIDTH = 800;
        const scaleSize = MAX_WIDTH / img.width;
        canvas.width = MAX_WIDTH;
        canvas.height = img.height * scaleSize;
        const ctx = canvas.getContext("2d");
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        const compressed = canvas.toDataURL("image/jpeg", 0.7);
        setImage(compressed);

        // Set a preliminary description immediately so textarea is never empty
        setDescription(`Photo captured at (${position.lat.toFixed(4)}, ${position.lng.toFixed(4)}). AI analysis in progress...`);

        // 🤖 Call Gemini AI to classify the image (pass location for context)
        setIsClassifying(true);
        try {
          const res = await fetch("/api/classify-image", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ 
              imageBase64: compressed,
              lat: position.lat,
              lng: position.lng,
            }),
          });
          const data = await res.json();
          if (data.success && data.classification) {
            const cls = data.classification;
            setAiClassification(cls);
            setSelectedType(cls.type);
            // ✅ Overwrite with rich AI-generated description
            if (cls.description) {
              setDescription(cls.description);
            }
            // ✅ Auto-set material type if AI detected one
            if (cls.materialType && cls.materialType !== "null" && cls.materialType !== null) {
              setMaterialType(cls.materialType);
            }
          } else {
            console.warn("AI response:", data);
          }
        } catch (err) {
          console.warn("AI classification failed:", err);
        } finally {
          setIsClassifying(false);
        }
      };
    };
    reader.readAsDataURL(file);
  };

  const fallbackToIP = async (silent = false) => {
    try {
      const apiKey = process.env.NEXT_PUBLIC_MAPTILER_API_KEY || "fm63BZNe6hXB2ad5Xaz5";
      const res = await fetch(`https://api.maptiler.com/geolocation/ip.json?key=${apiKey}`);
      const data = await res.json();
      if (data.latitude && data.longitude) {
        setPosition({ lat: data.latitude, lng: data.longitude });
      } else if (!silent) {
        alert("Unable to acquire GPS. Please type your address in the search bar.");
      }
    } catch (e) {
      if (!silent) alert("Unable to acquire GPS. Please type your address in the search bar.");
    } finally {
      setIsLocating(false);
    }
  };

  useEffect(() => {
    // Automatically grab location on load
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setPosition({ lat: pos.coords.latitude, lng: pos.coords.longitude });
          setIsLocating(false);
        },
        () => {
          fallbackToIP(true); // Silent fallback on load
        },
        { enableHighAccuracy: true, timeout: 12000, maximumAge: 0 }
      );
    } else {
      fallbackToIP(true);
    }
  }, []);

  const handleAcquireLocation = () => {
    setIsLocating(true);
    
    if (!navigator.geolocation) {
      fallbackToIP();
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setPosition({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        setIsLocating(false);
      },
      (error) => {
        console.warn("GPS blocked or failed:", error);
        if (error.code === error.PERMISSION_DENIED) {
          alert("Location access is blocked by your browser. Please allow location permissions or type your address manually.");
        }
        fallbackToIP();
      },
      { enableHighAccuracy: false, timeout: 5000, maximumAge: 0 } 
    );
  };

  const handleSearchAddress = async () => {
    if (!searchQuery.trim()) return;
    setIsSearching(true);
    try {
      const apiKey = process.env.NEXT_PUBLIC_MAPTILER_API_KEY || "fm63BZNe6hXB2ad5Xaz5";
      const res = await fetch(`https://api.maptiler.com/geocoding/${encodeURIComponent(searchQuery)}.json?key=${apiKey}`);
      const data = await res.json();
      
      if (data.features && data.features.length > 0) {
        const [lng, lat] = data.features[0].center;
        setPosition({ lat, lng });
      } else {
        alert("Location not found. Please try a different search or drag the pin.");
      }
    } catch (error) {
      console.error("Search failed:", error);
      alert("Search failed. Please check your connection.");
    } finally {
      setIsSearching(false);
    }
  };

  const handleReport = async (baseType) => {
    setIsLocating(true);
    
    const type = baseType === "Material Waste" ? `Material Waste (${materialType})` : baseType;
    
    try {
      const report = {
        localId: crypto.randomUUID(),
        type,
        description: description.trim(),
        imageUrl: image,
        lat: position.lat,
        lng: position.lng,
        reporterName: session.user.name,
        reporterEmail: session.user.email,
        status: "Pending",
        timestamp: new Date().toISOString(),
        synced: 0,
      };
      await db.reports.add(report);

      // Immediately sync to MongoDB
      try {
        await fetch("/api/reports", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ reports: [report] }),
        });
      } catch (syncErr) {
        console.warn("Sync failed, will retry later:", syncErr);
      }

      // Show the success summary screen
      setReported(report);
      setDescription("");
      setImage(null);
      setRedirecting(true);

      // After 3 seconds, switch to their History tab so they can track status
      setTimeout(() => {
        setRedirecting(false);
        setReported(null);
        setActiveTab("history");
      }, 3000);

    } catch (error) {
      console.error("Failed to save report locally:", error);
      setRedirecting(false);
    } finally {
      setIsLocating(false);
    }
  };

  if (!session) {
    return (
      <div className="flex flex-col items-center justify-center mt-20 text-center gap-4">
        <h1 className="text-3xl font-extrabold text-slate-900">Welcome to EcoLedger</h1>
        <p className="text-slate-500">Please log in to report environmental issues in your community.</p>
        <a href="/login" className="bg-emerald-600 text-white font-bold px-6 py-3 rounded-full hover:bg-emerald-700 transition">Log In Now</a>
      </div>
    );
  }

  if (session.user.role === "admin") {
    return (
      <div className="flex flex-col items-center justify-center mt-20 text-center gap-4">
        <h1 className="text-3xl font-extrabold text-slate-900">Admin Account</h1>
        <p className="text-slate-500">Administrators cannot report issues. Please use your dashboard to manage community reports.</p>
        <a href="/admin" className="bg-emerald-600 text-white font-bold px-6 py-3 rounded-full hover:bg-emerald-700 transition">Go to Admin Dashboard</a>
      </div>
    );
  }

  // Full-screen success overlay — shows submitted report summary
  if (redirecting && reported) {
    const typeIcon = reported.type === "Water Wastage" ? "💧" : reported.type === "Garbage" ? "🗑️" : "📦";
    const typeColor = reported.type === "Water Wastage" ? "bg-sky-600" : reported.type === "Garbage" ? "bg-stone-600" : "bg-amber-600";
    return (
      <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm flex items-center justify-center z-50 p-6">
        <div className="bg-white w-full max-w-sm rounded-3xl shadow-2xl overflow-hidden animate-fade-in">
          {/* Green success header */}
          <div className="bg-emerald-600 p-6 flex flex-col items-center text-white gap-3">
            <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center">
              <CheckCircle2 className="w-10 h-10 text-white" />
            </div>
            <h2 className="text-2xl font-black">Issue Reported!</h2>
            <p className="text-emerald-100 text-sm font-medium">Your report has been submitted and synced.</p>
          </div>

          {/* Report Summary */}
          <div className="p-5 flex flex-col gap-3">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest">What You Reported</h3>
            
            {/* Issue Type */}
            <div className={`${typeColor} text-white px-4 py-3 rounded-2xl flex items-center gap-3`}>
              <span className="text-2xl">{typeIcon}</span>
              <div>
                <p className="font-black text-lg">{reported.type}</p>
                <p className="text-[10px] text-white/70 uppercase font-bold tracking-wide">Issue Type</p>
              </div>
            </div>

            {/* Description */}
            {reported.description ? (
              <div className="bg-slate-50 rounded-2xl p-3 border border-slate-100">
                <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">Description</p>
                <p className="text-sm text-slate-700 font-medium">{reported.description}</p>
              </div>
            ) : null}

            {/* Location */}
            <div className="bg-slate-50 rounded-2xl p-3 border border-slate-100 flex items-center gap-2">
              <MapPin className="w-4 h-4 text-emerald-600 shrink-0" />
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase">Location Pinned</p>
                <p className="text-xs text-slate-600 font-medium">{reported.lat?.toFixed(4)}, {reported.lng?.toFixed(4)}</p>
              </div>
            </div>

            {/* Status */}
            <div className="bg-amber-50 rounded-2xl p-3 border border-amber-100 flex items-center gap-2">
              <Clock className="w-4 h-4 text-amber-600 shrink-0" />
              <div>
                <p className="text-[10px] font-bold text-amber-600 uppercase">Status</p>
                <p className="text-sm text-amber-800 font-bold">Pending Admin Review</p>
              </div>
            </div>

            <p className="text-center text-xs text-slate-400 mt-1">Opening your History tab in a moment...</p>
            <div className="flex gap-1.5 justify-center">
              <div className="w-2 h-2 bg-emerald-400 rounded-full animate-bounce" style={{animationDelay: "0ms"}}></div>
              <div className="w-2 h-2 bg-emerald-400 rounded-full animate-bounce" style={{animationDelay: "150ms"}}></div>
              <div className="w-2 h-2 bg-emerald-400 rounded-full animate-bounce" style={{animationDelay: "300ms"}}></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 items-center w-full animate-fade-in pb-16">
      <SyncService />
      
      {/* Tab Navigation */}
      <div className="w-full bg-white rounded-full p-1.5 shadow-sm border border-slate-100 flex items-center justify-between mt-2">
        <button 
          onClick={() => setActiveTab("report")}
          className={`flex-1 py-2.5 rounded-full text-xs font-bold transition-all flex justify-center items-center gap-1.5 ${activeTab === "report" ? "bg-emerald-600 text-white shadow-md" : "text-slate-500 hover:bg-slate-50"}`}
        >
          <MapIcon className="w-4 h-4" /> Report
        </button>
        <button 
          onClick={() => setActiveTab("history")}
          className={`flex-1 py-2.5 rounded-full text-xs font-bold transition-all flex justify-center items-center gap-1.5 ${activeTab === "history" ? "bg-emerald-600 text-white shadow-md" : "text-slate-500 hover:bg-slate-50"}`}
        >
          <Clock className="w-4 h-4" /> History
        </button>
        <button 
          onClick={() => setActiveTab("leaderboard")}
          className={`flex-1 py-2.5 rounded-full text-xs font-bold transition-all flex justify-center items-center gap-1.5 ${activeTab === "leaderboard" ? "bg-emerald-600 text-white shadow-md" : "text-slate-500 hover:bg-slate-50"}`}
        >
          <Trophy className="w-4 h-4" /> Leaderboard
        </button>
        <button 
          onClick={() => setActiveTab("water")}
          className={`flex-1 py-2 rounded-full text-[10px] font-black uppercase tracking-tighter transition-all flex flex-col justify-center items-center gap-0.5 ${activeTab === "water" ? "bg-sky-600 text-white shadow-md" : "text-slate-500"}`}
        >
          <Droplet className="w-3.5 h-3.5" /> Water
        </button>
        <button 
          onClick={() => setActiveTab("electricity")}
          className={`flex-1 py-2 rounded-full text-[10px] font-black uppercase tracking-tighter transition-all flex flex-col justify-center items-center gap-0.5 ${activeTab === "electricity" ? "bg-amber-600 text-white shadow-md" : "text-slate-500"}`}
        >
          <Zap className="w-3.5 h-3.5" /> Power
        </button>
      </div>

      {activeTab === "report" && (
        <div className="w-full flex flex-col gap-6 animate-fade-in">
          <div className="text-center mb-2 mt-2">
            <h1 className="text-3xl font-extrabold tracking-tight text-slate-900">Report an Issue</h1>
            <p className="text-slate-500 mt-2 font-medium flex items-center justify-center gap-2">
              Find your address or drag the map pin.
            </p>
          </div>

          {reported && (
            <div className="w-full bg-emerald-100 border border-emerald-200 text-emerald-800 px-4 py-3 rounded-2xl flex items-center gap-3 font-semibold shadow-sm animate-bounce">
              <CheckCircle2 className="w-6 h-6 text-emerald-600" />
              {reported} logged successfully!
            </div>
          )}

          {/* Interactive Map Picker */}
          <div className="w-full bg-white p-4 rounded-3xl shadow-sm border border-slate-100 relative">
            <div className="flex justify-between items-center mb-3">
              <label className="text-sm font-semibold text-slate-700 ml-1 flex items-center gap-2">
                <MapPin className="w-4 h-4 text-emerald-600" /> Exact Location
              </label>
              <button 
                onClick={handleAcquireLocation}
                className="text-xs bg-indigo-50 text-indigo-700 hover:bg-indigo-100 px-3 py-1.5 rounded-full font-bold flex items-center gap-1 transition"
              >
                {isLocating ? <Loader2 className="w-3 h-3 animate-spin" /> : <Navigation className="w-3 h-3" />}
                Find My Location
              </button>
            </div>

            {/* Address Search Bar */}
            <div className="flex gap-2 mb-3">
              <input 
                type="text" 
                placeholder="Search your address or landmark..." 
                className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-500 outline-none"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearchAddress()}
              />
              <button 
                onClick={handleSearchAddress}
                disabled={isSearching}
                className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-xl text-sm font-bold transition disabled:opacity-50"
              >
                {isSearching ? "Searching" : "Search"}
              </button>
            </div>
            
            <LocationPicker position={position} onPositionChange={setPosition} />
          </div>

          <div className="w-full bg-white p-4 rounded-3xl shadow-sm border border-slate-100 flex flex-col gap-4">
            {/* Camera + AI Classification */}
            <div>
              <label className="text-sm font-semibold text-slate-700 ml-2 mb-2 block">
                📸 Attach Photo Evidence
              </label>
              <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-slate-300 border-dashed rounded-2xl cursor-pointer bg-slate-50 hover:bg-slate-100 transition relative overflow-hidden">
                {image ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={image} alt="Evidence" className="w-full h-full object-cover" />
                ) : (
                  <div className="flex flex-col items-center justify-center pt-5 pb-6">
                    <p className="text-sm text-slate-500 font-bold">Tap to Take Photo</p>
                    <p className="text-xs text-slate-400">AI will auto-detect the issue type</p>
                  </div>
                )}
                <input type="file" accept="image/*" capture="environment" className="hidden" onChange={handleImageCapture} />
              </label>

              {/* AI Classifying Spinner */}
              {isClassifying && (
                <div className="mt-3 bg-purple-50 border border-purple-200 rounded-2xl p-3 flex items-center gap-3 animate-pulse">
                  <div className="w-5 h-5 border-2 border-purple-500 border-t-transparent rounded-full animate-spin shrink-0" />
                  <p className="text-sm text-purple-700 font-semibold">🤖 AI is analyzing your photo...</p>
                </div>
              )}

              {/* AI Result Card */}
              {aiClassification && !isClassifying && (
                <div className="mt-3 bg-gradient-to-br from-purple-50 to-indigo-50 border border-purple-200 rounded-2xl p-4 flex flex-col gap-3">
                  {/* Header row */}
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-black text-purple-600 uppercase tracking-widest flex items-center gap-1">
                      🤖 Gemini AI Analysis
                    </p>
                    <div className="flex items-center gap-2">
                      {aiClassification.severity && (
                        <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${
                          aiClassification.severity === 'Severe' ? 'bg-rose-100 text-rose-700' :
                          aiClassification.severity === 'Moderate' ? 'bg-amber-100 text-amber-700' :
                          'bg-emerald-100 text-emerald-700'
                        }`}>{aiClassification.severity}</span>
                      )}
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        aiClassification.confidence >= 70 ? 'bg-emerald-100 text-emerald-700' :
                        aiClassification.confidence >= 40 ? 'bg-amber-100 text-amber-700' :
                        'bg-rose-100 text-rose-700'
                      }`}>{aiClassification.confidence}% sure</span>
                    </div>
                  </div>

                  {/* Detected type + short label */}
                  <div className="flex items-center gap-2">
                    <span className={`text-xs font-black px-3 py-1 rounded-full text-white ${
                      aiClassification.type === 'Water Wastage' ? 'bg-sky-500' :
                      aiClassification.type === 'Garbage' ? 'bg-stone-500' : 'bg-amber-500'
                    }`}>{aiClassification.type}</span>
                    {aiClassification.shortLabel && (
                      <span className="text-sm font-semibold text-slate-700">{aiClassification.shortLabel}</span>
                    )}
                  </div>

                  {/* Full AI-generated description */}
                  <div className="bg-white rounded-xl p-3 border border-purple-100">
                    <p className="text-[10px] font-bold text-purple-500 uppercase mb-1">AI Incident Report</p>
                    <p className="text-sm text-slate-700 leading-relaxed">{aiClassification.description}</p>
                  </div>

                  <p className="text-[10px] text-purple-500 font-semibold">✅ Description auto-filled below. Tap the highlighted button to submit.</p>
                </div>
              )}

              {image && (
                <button onClick={() => { setImage(null); setAiClassification(null); setSelectedType(null); }} className="text-xs text-rose-500 font-bold mt-2 ml-2 hover:underline">
                  Remove Photo
                </button>
              )}
            </div>

            <div className="pt-4 border-t border-slate-100">
              <label className="text-sm font-semibold text-slate-700 ml-2 flex items-center gap-2">
                Issue Description
                {aiClassification && <span className="text-[10px] bg-purple-100 text-purple-600 font-bold px-2 py-0.5 rounded-full">🤖 AI Generated</span>}
              </label>
              <textarea 
                className="w-full mt-2 p-3 bg-slate-50 rounded-2xl border border-slate-200 focus:ring-2 focus:ring-emerald-500 outline-none resize-none text-sm leading-relaxed"
                rows={aiClassification ? 5 : 3}
                placeholder="Describe the issue... (AI will auto-fill when you take a photo)"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>
            
            <div className="pt-4 border-t border-slate-100">
              <label className="text-sm font-semibold text-slate-700 ml-2">Specify Material (If reporting Material Waste)</label>
              <select 
                className="w-full mt-2 p-3 bg-slate-50 rounded-2xl border-none focus:ring-2 focus:ring-emerald-500"
                value={materialType}
                onChange={(e) => setMaterialType(e.target.value)}
              >
                <option value="Plastic">Plastic</option>
                <option value="E-Waste">E-Waste</option>
                <option value="Glass">Glass</option>
                <option value="Metal">Metal</option>
                <option value="Cardboard/Paper">Cardboard / Paper</option>
                <option value="Other">Other</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 w-full">
            {aiClassification && (
              <p className="text-center text-xs text-purple-600 font-bold -mb-2">🤖 AI Suggestion highlighted below — tap to confirm or choose manually</p>
            )}
            <button 
              disabled={isLocating}
              onClick={() => handleReport("Water Wastage")}
              className={`w-full relative group overflow-hidden text-white rounded-3xl p-6 flex items-center gap-6 transition-all active:scale-95 shadow-xl disabled:opacity-50 ${
                selectedType === "Water Wastage"
                  ? "bg-sky-600 ring-4 ring-sky-300 ring-offset-2 scale-105 shadow-sky-600/40"
                  : "bg-sky-500 hover:bg-sky-600 shadow-sky-500/20"
              }`}
            >
              <div className="absolute inset-0 bg-gradient-to-r from-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
              <div className="bg-white/20 p-4 rounded-2xl">
                <Droplet className="w-10 h-10" strokeWidth={2} />
              </div>
              <div className="text-left">
                <span className="text-xl font-bold block">Water Wastage</span>
                {selectedType === "Water Wastage" && <span className="text-xs text-sky-100 font-bold">🤖 AI Detected</span>}
              </div>
            </button>

            <button 
              disabled={isLocating}
              onClick={() => handleReport("Garbage")}
              className={`w-full relative group overflow-hidden text-white rounded-3xl p-6 flex items-center gap-6 transition-all active:scale-95 shadow-xl disabled:opacity-50 ${
                selectedType === "Garbage"
                  ? "bg-stone-600 ring-4 ring-stone-300 ring-offset-2 scale-105 shadow-stone-600/40"
                  : "bg-stone-500 hover:bg-stone-600 shadow-stone-500/20"
              }`}
            >
              <div className="absolute inset-0 bg-gradient-to-r from-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
              <div className="bg-white/20 p-4 rounded-2xl">
                <Trash2 className="w-10 h-10" strokeWidth={2} />
              </div>
              <div className="text-left">
                <span className="text-xl font-bold block">Garbage Pile</span>
                {selectedType === "Garbage" && <span className="text-xs text-stone-200 font-bold">🤖 AI Detected</span>}
              </div>
            </button>

            <button 
              disabled={isLocating}
              onClick={() => handleReport("Material Waste")}
              className={`w-full relative group overflow-hidden text-white rounded-3xl p-6 flex items-center gap-6 transition-all active:scale-95 shadow-xl disabled:opacity-50 ${
                selectedType === "Material Waste"
                  ? "bg-amber-600 ring-4 ring-amber-300 ring-offset-2 scale-105 shadow-amber-600/40"
                  : "bg-amber-500 hover:bg-amber-600 shadow-amber-500/20"
              }`}
            >
              <div className="absolute inset-0 bg-gradient-to-r from-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
              <div className="bg-white/20 p-4 rounded-2xl">
                <Box className="w-10 h-10" strokeWidth={2} />
              </div>
              <div className="text-left">
                <span className="text-xl font-bold block">Material Waste</span>
                {selectedType === "Material Waste" && <span className="text-xs text-amber-100 font-bold">🤖 AI Detected ({materialType})</span>}
              </div>
            </button>
          </div>
        </div>
      )}

      {activeTab === "history" && (
        <div className="w-full flex flex-col gap-4 animate-fade-in mt-4">
          <div className="flex items-center justify-between bg-emerald-600 text-white rounded-3xl p-6 shadow-lg shadow-emerald-600/20">
            <div>
              <p className="text-sm font-bold text-emerald-100 uppercase tracking-widest">Your Trust Score</p>
              <div className="flex items-end gap-2 mt-1">
                <span className="text-4xl font-black">{session.user.trustScore || 0}</span>
                <span className="text-sm font-bold text-emerald-200 mb-1">XP</span>
              </div>
            </div>
            <Award className="w-16 h-16 text-emerald-400 opacity-50" />
          </div>

          <h2 className="text-lg font-bold text-slate-800 ml-2 mt-2">Past Reports</h2>
          
          {isLoadingData ? (
            <div className="flex justify-center py-10"><Loader2 className="w-8 h-8 animate-spin text-emerald-500" /></div>
          ) : myReports.length === 0 ? (
            <div className="bg-white rounded-3xl p-8 text-center border border-slate-100 shadow-sm">
              <Clock className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <p className="text-slate-500 font-medium">You haven't submitted any reports yet.</p>
            </div>
          ) : (
            myReports.map((report) => (
              <div key={report._id} className="bg-white p-5 rounded-3xl shadow-sm border border-slate-100 flex flex-col gap-2 relative overflow-hidden">
                <div className={`absolute top-0 left-0 w-1.5 h-full ${report.status === 'Resolved' ? 'bg-emerald-500' : report.status === 'Flagged' ? 'bg-rose-500' : 'bg-amber-400'}`}></div>
                <div className="flex justify-between items-start pl-2">
                  <div>
                    <h3 className="font-bold text-slate-800 text-lg">{report.type}</h3>
                    <p className="text-xs text-slate-400 font-medium">{new Date(report.timestamp).toLocaleString()}</p>
                  </div>
                  <span className={`text-[10px] uppercase font-black px-3 py-1 rounded-full ${report.status === 'Resolved' ? 'bg-emerald-100 text-emerald-700' : report.status === 'Flagged' ? 'bg-rose-100 text-rose-700' : 'bg-amber-100 text-amber-700'}`}>
                    {report.status}
                  </span>
                </div>
                {report.description && (
                  <p className="text-sm text-slate-600 mt-2 pl-2 bg-slate-50 p-2 rounded-xl">{report.description}</p>
                )}
              </div>
            ))
          )}
        </div>
      )}

      {activeTab === "leaderboard" && (
        <div className="w-full flex flex-col gap-4 animate-fade-in mt-4">
          <div className="text-center mb-4">
            <Trophy className="w-12 h-12 text-amber-500 mx-auto mb-2 drop-shadow-md" />
            <h2 className="text-2xl font-black text-slate-800">Top Eco-Warriors</h2>
            <p className="text-sm text-slate-500 font-medium">Most active community members</p>
          </div>

          {isLoadingData ? (
             <div className="flex justify-center py-10"><Loader2 className="w-8 h-8 animate-spin text-emerald-500" /></div>
          ) : (
            <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
              {leaderboard.map((user, idx) => (
                <div key={user._id} className={`p-4 flex items-center justify-between border-b border-slate-50 ${idx === 0 ? 'bg-amber-50' : idx === 1 ? 'bg-slate-50' : idx === 2 ? 'bg-orange-50' : 'bg-white'}`}>
                  <div className="flex items-center gap-4">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center font-black text-sm ${idx === 0 ? 'bg-amber-400 text-amber-900' : idx === 1 ? 'bg-slate-300 text-slate-700' : idx === 2 ? 'bg-orange-300 text-orange-900' : 'bg-slate-100 text-slate-500'}`}>
                      #{idx + 1}
                    </div>
                    <div>
                      <p className="font-bold text-slate-800">{user.name}</p>
                      {user.houseNumber && <p className="text-[10px] text-slate-400 font-bold uppercase">House: {user.houseNumber}</p>}
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-black text-emerald-600">{user.trustScore} XP</p>
                  </div>
                </div>
              ))}
              {leaderboard.length === 0 && (
                <p className="p-8 text-center text-slate-500 font-medium italic">Leaderboard is empty. Be the first!</p>
              )}
            </div>
          )}
        </div>
      )}

      {activeTab === "water" && (
        <WaterManagement user={session?.user} />
      )}

      {activeTab === "electricity" && (
        <ElectricityManagement user={session?.user} />
      )}
    </div>
  );
}

// ─── Electricity Management Component ───────────────────────────────────────
function ElectricityManagement({ user }) {
  const [units, setUnits] = useState("");
  const [loading, setLoading] = useState(false);
  const [history, setHistory] = useState([]);
  const [average, setAverage] = useState(0);
  const [message, setMessage] = useState(null);

  useEffect(() => {
    fetchHistory();
  }, []);

  const fetchHistory = async () => {
    try {
      const res = await fetch("/api/electricity-usage");
      const data = await res.json();
      setHistory(data.history || []);
      setAverage(data.currentAverage || 0);
    } catch (e) { console.error(e); }
  };

  const handleLogUsage = async (e) => {
    e.preventDefault();
    if (!units || units <= 0) return;
    setLoading(true);
    try {
      const res = await fetch("/api/electricity-usage", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ units: parseFloat(units) })
      });
      const data = await res.json();
      if (data.success) {
        setMessage({ type: data.usage.scoreImpact >= 0 ? "success" : "warning", text: data.message });
        setUnits("");
        fetchHistory();
      }
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  return (
    <div className="w-full flex flex-col gap-6 animate-fade-in pb-10">
      <div className="text-center mb-2 mt-4">
        <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 flex items-center justify-center gap-2">
          <Zap className="w-8 h-8 text-amber-500" /> Power Tracking
        </h1>
        <p className="text-slate-500 mt-2 font-medium">EcoLedger AI Electricity Conservation</p>
      </div>

      <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100 flex flex-col gap-4">
        <div className="bg-amber-50 border border-amber-100 rounded-2xl p-4 flex items-start gap-3">
          <TrendingDown className="w-6 h-6 text-amber-600 mt-1" />
          <div>
            <h3 className="text-amber-800 font-bold">Conservation Logic</h3>
            <p className="text-amber-700 text-xs mt-1">
              Current Bill is compared against your **Monthly Average ({average.toFixed(1)} units)**. 
              Stay below average to earn **+25 XP**. 
              Exceeding it deducts **-30 XP**.
            </p>
          </div>
        </div>

        {message && (
          <div className={`p-4 rounded-2xl text-sm font-bold flex items-center gap-2 ${
            message.type === "success" ? "bg-emerald-100 text-emerald-700" : "bg-rose-100 text-rose-700"
          }`}>
            {message.type === "success" ? <CheckCircle2 className="w-5 h-5" /> : <AlertTriangle className="w-5 h-5" />}
            {message.text}
          </div>
        )}

        <form onSubmit={handleLogUsage} className="flex flex-col gap-4">
          <div>
            <label className="text-xs font-black text-slate-500 uppercase tracking-widest ml-1 mb-1 block">Current Month Usage (Units)</label>
            <div className="relative">
              <Zap className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-amber-400" />
              <input 
                type="number" 
                value={units}
                onChange={(e) => setUnits(e.target.value)}
                placeholder="e.g. 150"
                required
                className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm focus:ring-2 focus:ring-amber-500 outline-none transition"
              />
            </div>
          </div>
          <button 
            type="submit" 
            disabled={loading}
            className="w-full bg-amber-600 hover:bg-amber-700 text-white font-black py-3.5 rounded-2xl transition shadow-lg shadow-amber-600/20 disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : "Log Monthly Bill"}
          </button>
        </form>
      </div>

      <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100 flex flex-col gap-4">
        <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
          <Clock className="w-5 h-5 text-slate-400" /> Billing History
        </h3>
        <div className="flex flex-col gap-3">
          {history.length === 0 ? (
            <p className="text-slate-400 italic text-sm text-center py-4">No electricity logs yet.</p>
          ) : (
            history.map((log) => (
              <div key={log._id} className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100">
                <div>
                  <p className="text-sm font-bold text-slate-800">{log.units} Units</p>
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Avg was {log.previousAverage} &middot; {new Date(log.date).toLocaleDateString()}</p>
                </div>
                <div className={`px-3 py-1 rounded-full text-xs font-black ${
                  log.scoreImpact > 0 ? "bg-emerald-100 text-emerald-700" : log.scoreImpact < 0 ? "bg-rose-100 text-rose-700" : "bg-slate-200 text-slate-600"
                }`}>
                  {log.scoreImpact > 0 ? "+" : ""}{log.scoreImpact} XP
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Water Management Component ──────────────────────────────────────────────
function WaterManagement({ user }) {
  const [amount, setAmount] = useState("");
  const [loading, setLoading] = useState(false);
  const [history, setHistory] = useState([]);
  const [message, setMessage] = useState(null);

  useEffect(() => {
    fetchHistory();
  }, []);

  const fetchHistory = async () => {
    try {
      const res = await fetch("/api/water-usage");
      const data = await res.json();
      setHistory(data.history || []);
    } catch (e) { console.error(e); }
  };

  const handleLogUsage = async (e) => {
    e.preventDefault();
    if (!amount || amount <= 0) return;
    setLoading(true);
    try {
      const res = await fetch("/api/water-usage", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount: parseFloat(amount) })
      });
      const data = await res.json();
      if (data.success) {
        setMessage({ type: data.scoreImpact > 0 ? "success" : "warning", text: data.message });
        setAmount("");
        fetchHistory();
      }
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  return (
    <div className="w-full flex flex-col gap-6 animate-fade-in pb-10">
      <div className="text-center mb-2 mt-4">
        <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 flex items-center justify-center gap-2">
          <Droplet className="w-8 h-8 text-sky-500" /> Water Management
        </h1>
        <p className="text-slate-500 mt-2 font-medium">EcoLedger AI Family Water Savings</p>
      </div>

      <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100 flex flex-col gap-4">
        <div className="bg-sky-50 border border-sky-100 rounded-2xl p-4">
          <h3 className="text-sky-800 font-bold flex items-center gap-2">
            <ShieldAlert className="w-5 h-5" /> Daily Limit Logic
          </h3>
          <p className="text-sky-700 text-sm mt-1">
            Limit = 3 Liters per family member. 
            Keep usage within limit to earn **+10 XP**. 
            Exceeding limit results in **-15 XP**.
          </p>
        </div>

        {message && (
          <div className={`p-4 rounded-2xl text-sm font-bold flex items-center gap-2 ${
            message.type === "success" ? "bg-emerald-100 text-emerald-700" : "bg-rose-100 text-rose-700"
          }`}>
            {message.type === "success" ? <CheckCircle2 className="w-5 h-5" /> : <AlertTriangle className="w-5 h-5" />}
            {message.text}
          </div>
        )}

        <form onSubmit={handleLogUsage} className="flex flex-col gap-4">
          <div>
            <label className="text-xs font-black text-slate-500 uppercase tracking-widest ml-1 mb-1 block">Log Today's Water Usage (Liters)</label>
            <div className="relative">
              <Droplet className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-sky-400" />
              <input 
                type="number" 
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="e.g. 12"
                required
                className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm focus:ring-2 focus:ring-sky-500 outline-none transition"
              />
            </div>
          </div>
          <button 
            type="submit" 
            disabled={loading}
            className="w-full bg-sky-600 hover:bg-sky-700 text-white font-black py-3.5 rounded-2xl transition shadow-lg shadow-sky-600/20 disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : "Log Usage & Update Score"}
          </button>
        </form>
      </div>

      {/* History List */}
      <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100 flex flex-col gap-4">
        <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
          <Clock className="w-5 h-5 text-slate-400" /> Recent Activity
        </h3>
        <div className="flex flex-col gap-3">
          {history.length === 0 ? (
            <p className="text-slate-400 italic text-sm text-center py-4">No water logs yet.</p>
          ) : (
            history.map((log) => (
              <div key={log._id} className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100">
                <div>
                  <p className="text-sm font-bold text-slate-800">{log.amount} Liters Used</p>
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">{new Date(log.date).toLocaleDateString()}</p>
                </div>
                <div className={`px-3 py-1 rounded-full text-xs font-black ${
                  log.scoreImpact > 0 ? "bg-emerald-100 text-emerald-700" : "bg-rose-100 text-rose-700"
                }`}>
                  {log.scoreImpact > 0 ? "+" : ""}{log.scoreImpact} XP
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

