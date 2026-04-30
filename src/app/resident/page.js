"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { useUI } from "../../components/UIProvider";
import { useTranslation } from "react-i18next";
import { Droplet, Trash2, Box, CheckCircle2, MapPin, Loader2, Navigation, Clock, Trophy, Award, ShieldAlert, AlertTriangle, Zap, TrendingDown, Globe, Heart } from "lucide-react";
import { db } from "../../lib/db/dexie";
import SyncService from "../../components/SyncService";
import dynamic from "next/dynamic";

const LocationPicker = dynamic(() => import("../../components/LocationPicker"), { ssr: false });

export default function ResidentPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const { t } = useTranslation();
  const [redirecting, setRedirecting] = useState(false);

  // Tab Navigation (Global State)
  const { activeTab, setActiveTab } = useUI();

  // Data States
  const [myReports, setMyReports] = useState([]);
  const [communityReports, setCommunityReports] = useState([]);
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
  const [servings, setServings] = useState(1);

  // Search states
  const [position, setPosition] = useState({ lat: null, lng: null });

  // ── Authentication Redirects ───────────────────────────────────────────
  useEffect(() => {
    if (status === "loading") return;
    
    if (!session) {
      router.replace("/login");
    } else if (session.user.role === "admin") {
      router.replace("/admin");
    }
  }, [session, status, router]);

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
    } else if (activeTab === "feed") {
      setIsLoadingData(true);
      fetch("/api/reports?status=Pending").then(res => res.json()).then(data => {
        setCommunityReports(data.reports || []);
        setIsLoadingData(false);
      });
    }
  }, [activeTab, session]);

  const handleVote = async (reportId) => {
    try {
      const res = await fetch("/api/reports/vote", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reportId })
      });
      const data = await res.json();
      if (data.success) {
        // Update local state
        setCommunityReports(prev => prev.map(r => {
          if (r._id === reportId) {
            const userId = session.user.id;
            const votes = r.votes || [];
            const hasVoted = votes.includes(userId);
            const newVotes = hasVoted 
              ? votes.filter(id => id !== userId)
              : [...votes, userId];
            return { ...r, votes: newVotes, voteCount: data.voteCount };
          }
          return r;
        }));
      }
    } catch (err) {
      console.error("Voting failed:", err);
    }
  };

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
        alert("Unable to acquire GPS.");
      }
    } catch (e) {
      if (!silent) alert("Unable to acquire GPS.");
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
          alert("Location access is blocked by your browser. Please allow location permissions to report an issue accurately.");
        }
        fallbackToIP();
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
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
        lat: position.lat || 0,
        lng: position.lng || 0,
        reporterName: session.user.name,
        reporterEmail: session.user.email,
        status: "Pending",
        timestamp: new Date().toISOString(),
        synced: 0,
        foodServings: baseType === "Surplus Food" ? servings : undefined,
        isNGOFeature: baseType === "Surplus Food"
      };

      // 0. Pre-check for duplicates (Same Type + Same Area within ~100m)
      const latRange = 0.001; 
      const lngRange = 0.001;
      const localDuplicate = await db.reports
        .where("type").equals(type)
        .and(r => 
          r.status === "Pending" &&
          Math.abs(r.lat - position.lat) < latRange &&
          Math.abs(r.lng - position.lng) < lngRange
        ).first();

      if (localDuplicate) {
        alert("A similar issue has already been reported in this exact area. Thank you for your vigilance!");
        setIsLocating(false);
        return;
      }

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

  if (status === "loading") {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <Loader2 className="w-10 h-10 text-emerald-500 animate-spin" />
        <p className="text-slate-500 font-medium" suppressHydrationWarning>{t("loading_dashboard")}</p>
      </div>
    );
  }

  if (!session || session.user.role === "admin") {
    return null; // Redirect handled by useEffect
  }

  // Full-screen success overlay ΓÇö shows submitted report summary
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
                <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">{t("description_label")}</p>
                <p className="text-sm text-slate-700 font-medium">{reported.description}</p>
              </div>
            ) : null}

            {/* Location */}
            <div className="bg-slate-50 rounded-2xl p-3 border border-slate-100 flex items-center gap-2">
              <MapPin className="w-4 h-4 text-emerald-600 shrink-0" />
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase">{t("exact_location")}</p>
                <p className="text-xs text-slate-600 font-medium">{reported.lat?.toFixed(4)}, {reported.lng?.toFixed(4)}</p>
              </div>
            </div>

            {/* Status */}
            <div className="bg-amber-50 rounded-2xl p-3 border border-amber-100 flex items-center gap-2">
              <Clock className="w-4 h-4 text-amber-600 shrink-0" />
              <div>
                <p className="text-[10px] font-bold text-amber-600 uppercase">{t("pending")}</p>
                <p className="text-sm text-amber-800 font-bold">{t("pending_admin_review")}</p>
              </div>
            </div>

            <p className="text-center text-xs text-slate-400 mt-1">Opening your History tab in a moment...</p>
            <div className="flex gap-1.5 justify-center">
              <div className="w-2 h-2 bg-emerald-400 rounded-full animate-bounce" style={{ animationDelay: "0ms" }}></div>
              <div className="w-2 h-2 bg-emerald-400 rounded-full animate-bounce" style={{ animationDelay: "150ms" }}></div>
              <div className="w-2 h-2 bg-emerald-400 rounded-full animate-bounce" style={{ animationDelay: "300ms" }}></div>
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


      {activeTab === "report" && (
        <div className="w-full flex flex-col gap-6 animate-fade-in">
          <div className="text-center mb-2 mt-2">
            <h1 className="text-3xl font-extrabold tracking-tight text-slate-900">{t("report_issue_title")}</h1>
            <p className="text-slate-500 mt-2 font-medium flex items-center justify-center gap-2">
              Use your device's exact GPS location
            </p>
          </div>

          {reported && (
            <div className="w-full bg-emerald-100 border border-emerald-200 text-emerald-800 px-4 py-3 rounded-2xl flex items-center gap-3 font-semibold shadow-sm animate-bounce">
              <CheckCircle2 className="w-6 h-6 text-emerald-600" />
              {reported} logged successfully!
            </div>
          )}

          {/* Interactive Location Picker */}
          <div className="w-full bg-white p-4 rounded-3xl shadow-sm border border-slate-100 relative">
            <div className="flex justify-between items-center mb-3">
              <label className="text-sm font-semibold text-slate-700 ml-1 flex items-center gap-2">
                <MapPin className="w-4 h-4 text-emerald-600" /> {t("exact_location")}
              </label>
            </div>

            <LocationPicker position={position} onPositionChange={setPosition} />
          </div>

          <div className="w-full bg-white p-4 rounded-3xl shadow-sm border border-slate-100 flex flex-col gap-4">
            {/* Camera + AI Classification */}
            <div>
              <label className="text-sm font-semibold text-slate-700 ml-2 mb-2 block">
                📸 {t("attach_photo")}
              </label>
              <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-slate-300 border-dashed rounded-2xl cursor-pointer bg-slate-50 hover:bg-slate-100 transition relative overflow-hidden">
                {image ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={image} alt="Evidence" className="w-full h-full object-cover" />
                ) : (
                  <div className="flex flex-col items-center justify-center pt-5 pb-6">
                    <p className="text-sm text-slate-500 font-bold">{t("tap_to_take_photo")}</p>
                    <p className="text-xs text-slate-400">{t("ai_auto_detect")}</p>
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
                        <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${aiClassification.severity === 'Severe' ? 'bg-rose-100 text-rose-700' :
                            aiClassification.severity === 'Moderate' ? 'bg-amber-100 text-amber-700' :
                              'bg-emerald-100 text-emerald-700'
                          }`}>{aiClassification.severity}</span>
                      )}
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${aiClassification.confidence >= 70 ? 'bg-emerald-100 text-emerald-700' :
                          aiClassification.confidence >= 40 ? 'bg-amber-100 text-amber-700' :
                            'bg-rose-100 text-rose-700'
                        }`}>{aiClassification.confidence}% sure</span>
                    </div>
                  </div>

                  {/* Detected type + short label */}
                  <div className="flex items-center gap-2">
                    <span className={`text-xs font-black px-3 py-1 rounded-full text-white ${aiClassification.type === 'Water Wastage' ? 'bg-sky-500' :
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
                  {t("remove_photo")}
                </button>
              )}
            </div>

            <div className="pt-4 border-t border-slate-100">
              <label className="text-sm font-semibold text-slate-700 ml-2 flex items-center gap-2">
                {t("description_label")}
                {aiClassification && <span className="text-[10px] bg-purple-100 text-purple-600 font-bold px-2 py-0.5 rounded-full">🤖 AI Generated</span>}
              </label>
              <textarea
                className="w-full mt-2 p-3 bg-slate-50 rounded-2xl border border-slate-200 focus:ring-2 focus:ring-emerald-500 outline-none resize-none text-sm leading-relaxed"
                rows={aiClassification ? 5 : 3}
                placeholder={t("describe_placeholder")}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>

            <div className="pt-4 border-t border-slate-100">
              <label className="text-sm font-semibold text-slate-700 ml-2">{t("specify_material")}</label>
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
              className={`w-full relative group overflow-hidden text-white rounded-3xl p-6 flex items-center gap-6 transition-all active:scale-95 shadow-xl disabled:opacity-50 ${selectedType === "Water Wastage"
                  ? "bg-sky-600 ring-4 ring-sky-300 ring-offset-2 scale-105 shadow-sky-600/40"
                  : "bg-sky-500 hover:bg-sky-600 shadow-sky-500/20"
                }`}
            >
              <div className="absolute inset-0 bg-gradient-to-r from-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
              <div className="bg-white/20 p-4 rounded-2xl">
                <Droplet className="w-10 h-10" strokeWidth={2} />
              </div>
              <div className="text-left">
                <span className="text-xl font-bold block">{t("water_wastage")}</span>
                {selectedType === "Water Wastage" && <span className="text-xs text-sky-100 font-bold">🤖 {t("ai_detected")}</span>}
              </div>
            </button>

            <button
              disabled={isLocating}
              onClick={() => handleReport("Garbage")}
              className={`w-full relative group overflow-hidden text-white rounded-3xl p-6 flex items-center gap-6 transition-all active:scale-95 shadow-xl disabled:opacity-50 ${selectedType === "Garbage"
                  ? "bg-stone-600 ring-4 ring-stone-300 ring-offset-2 scale-105 shadow-stone-600/40"
                  : "bg-stone-500 hover:bg-stone-600 shadow-stone-500/20"
                }`}
            >
              <div className="absolute inset-0 bg-gradient-to-r from-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
              <div className="bg-white/20 p-4 rounded-2xl">
                <Trash2 className="w-10 h-10" strokeWidth={2} />
              </div>
              <div className="text-left">
                <span className="text-xl font-bold block">{t("garbage_pile")}</span>
                {selectedType === "Garbage" && <span className="text-xs text-stone-200 font-bold">🤖 {t("ai_detected")}</span>}
              </div>
            </button>

            <button
              disabled={isLocating}
              onClick={() => handleReport("Material Waste")}
              className={`w-full relative group overflow-hidden text-white rounded-3xl p-6 flex items-center gap-6 transition-all active:scale-95 shadow-xl disabled:opacity-50 ${selectedType === "Material Waste"
                  ? "bg-amber-600 ring-4 ring-amber-300 ring-offset-2 scale-105 shadow-amber-600/40"
                  : "bg-amber-500 hover:bg-amber-600 shadow-amber-500/20"
                }`}
            >
              <div className="absolute inset-0 bg-gradient-to-r from-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
              <div className="bg-white/20 p-4 rounded-2xl">
                <Box className="w-10 h-10" strokeWidth={2} />
              </div>
              <div className="text-left">
                <span className="text-xl font-bold block">{t("material_waste")}</span>
                {selectedType === "Material Waste" && <span className="text-xs text-amber-100 font-bold">🤖 {t("ai_detected")} ({materialType})</span>}
              </div>
            </button>

            <div className="h-px bg-slate-100 my-2" />
            
            <div className="bg-emerald-50 rounded-3xl p-6 border-2 border-emerald-100 space-y-4">
              <div className="flex items-center gap-4">
                <div className="bg-emerald-500 text-white p-3 rounded-2xl shadow-lg shadow-emerald-500/20">
                  <Leaf className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="font-black text-emerald-900 leading-tight">Surplus Food Recovery</h4>
                  <p className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest">Help Nearby NGOs</p>
                </div>
              </div>

              <div className="flex items-center justify-between bg-white p-3 rounded-2xl border border-emerald-100">
                <span className="text-sm font-bold text-slate-700 ml-2">Approx Servings</span>
                <div className="flex items-center gap-4">
                  <button onClick={() => setServings(Math.max(1, servings - 1))} className="w-8 h-8 flex items-center justify-center bg-slate-100 rounded-lg font-black">-</button>
                  <span className="font-black text-lg w-8 text-center">{servings}</span>
                  <button onClick={() => setServings(servings + 1)} className="w-8 h-8 flex items-center justify-center bg-slate-100 rounded-lg font-black">+</button>
                </div>
              </div>

              <button
                disabled={isLocating}
                onClick={() => handleReport("Surplus Food")}
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-black py-4 rounded-2xl shadow-xl shadow-emerald-600/20 transition-all active:scale-95 flex items-center justify-center gap-2"
              >
                <CheckCircle2 className="w-5 h-5" /> REPORT SURPLUS FOOD
              </button>
            </div>
          </div>
        </div>
      )}

      {activeTab === "feed" && (
        <div className="w-full flex flex-col gap-4 animate-fade-in mt-4">
          <div className="flex items-center justify-between bg-indigo-600 text-white rounded-3xl p-6 shadow-lg shadow-indigo-600/20">
            <div>
              <h2 className="text-2xl font-black">{t("community_feed")}</h2>
              <p className="text-sm font-bold text-indigo-100 uppercase tracking-widest">{t("community_feed_subtitle")}</p>
            </div>
            <Globe className="w-12 h-12 text-indigo-400 opacity-50" />
          </div>

          {isLoadingData ? (
            <div className="flex justify-center py-10"><Loader2 className="w-8 h-8 animate-spin text-indigo-500" /></div>
          ) : communityReports.length === 0 ? (
            <div className="bg-white rounded-3xl p-8 text-center border border-slate-100 shadow-sm">
              <Globe className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <p className="text-slate-500 font-medium">{t("no_community_reports")}</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {communityReports.map((report) => {
                const hasVoted = report.votes?.includes(session.user.id);
                return (
                  <div key={report._id} className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden flex flex-col">
                    {report.imageUrl && (
                      <div className="w-full h-40 overflow-hidden border-b border-slate-50">
                        <img src={report.imageUrl} alt="Issue" className="w-full h-full object-cover" />
                      </div>
                    )}
                    <div className="p-5 flex flex-col gap-3">
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className="font-bold text-slate-800 text-lg">{report.type}</h3>
                          <p className="text-xs text-slate-400 font-medium">{new Date(report.timestamp).toLocaleDateString()}</p>
                        </div>
                        <div className="flex items-center gap-1 bg-slate-50 px-2 py-1 rounded-full border border-slate-100">
                          <Heart className={`w-3 h-3 ${report.voteCount > 0 ? "text-rose-500 fill-rose-500" : "text-slate-300"}`} />
                          <span className="text-[10px] font-black text-slate-600">{report.voteCount || 0}</span>
                        </div>
                      </div>
                      
                      <p className="text-sm text-slate-600 line-clamp-2">{report.description || "No description provided."}</p>
                      
                      <div className="flex items-center gap-2 mt-2">
                        <MapPin className="w-3.5 h-3.5 text-indigo-500" />
                        <span className="text-xs font-bold text-slate-500">Dharwad, Karnataka</span>
                      </div>

                      <div className="mt-4 pt-4 border-t border-slate-50 flex justify-between items-center">
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 bg-slate-100 rounded-full flex items-center justify-center text-[10px] font-bold text-indigo-600">
                            {report.reporterName?.charAt(0)}
                          </div>
                          <span className="text-xs font-bold text-slate-500">{report.reporterName}</span>
                        </div>
                        
                        <button 
                          onClick={() => handleVote(report._id)}
                          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-black transition-all ${
                            hasVoted 
                              ? "bg-rose-50 text-rose-600 border border-rose-100" 
                              : "bg-indigo-50 text-indigo-600 border border-indigo-50 hover:bg-indigo-100"
                          }`}
                        >
                          <Heart className={`w-3.5 h-3.5 ${hasVoted ? "fill-rose-600" : ""}`} />
                          {hasVoted ? t("voted") : t("upvote")}
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {activeTab === "history" && (
        <div className="w-full flex flex-col gap-4 animate-fade-in mt-4">
          <div className="flex items-center justify-between bg-emerald-600 text-white rounded-3xl p-6 shadow-lg shadow-emerald-600/20">
            <div>
              <p className="text-sm font-bold text-emerald-100 uppercase tracking-widest">{t("your_trust_score")}</p>
              <div className="flex items-end gap-2 mt-1">
                <span className="text-4xl font-black">{session.user.trustScore || 0}</span>
                <span className="text-sm font-bold text-emerald-200 mb-1">{t("xp")}</span>
              </div>
            </div>
            <Award className="w-16 h-16 text-emerald-400 opacity-50" />
          </div>

          <h2 className="text-lg font-bold text-slate-800 ml-2 mt-2">{t("past_reports")}</h2>

          {isLoadingData ? (
            <div className="flex justify-center py-10"><Loader2 className="w-8 h-8 animate-spin text-emerald-500" /></div>
          ) : myReports.length === 0 ? (
            <div className="bg-white rounded-3xl p-8 text-center border border-slate-100 shadow-sm">
              <Clock className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <p className="text-slate-500 font-medium">You haven't submitted any reports yet.</p>
            </div>
          ) : (
            myReports.map((report) => (
              <div key={report._id || report.localId} className="bg-white p-5 rounded-3xl shadow-sm border border-slate-100 flex flex-col gap-2 relative overflow-hidden">
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
            <h2 className="text-2xl font-black text-slate-800">{t("top_eco_warriors")}</h2>
            <p className="text-sm text-slate-500 font-medium">{t("most_active_community")}</p>
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
  const { t } = useTranslation();
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
      // 1. Get from API (cached by SW)
      const res = await fetch("/api/electricity-usage");
      if (res.ok) {
        const data = await res.json();
        setHistory(data.history || []);
        setAverage(data.currentAverage || 0);
      }
      
      // 2. Append unsynced from Dexie
      const pending = await db.electricity_usage.where("synced").equals(0).toArray();
      if (pending.length > 0) {
        setHistory(prev => [...pending.map(p => ({ ...p, _id: p.id, status: "Pending Sync" })), ...prev]);
      }
    } catch (e) { 
      // If network fails entirely, show what's in Dexie
      const allLocal = await db.electricity_usage.toArray();
      setHistory(allLocal.map(p => ({ ...p, _id: p.id, status: p.synced ? "Synced" : "Pending Sync" })));
    }
  };

  const handleLogUsage = async (e) => {
    e.preventDefault();
    if (!units || units <= 0) return;
    setLoading(true);
    
    const localLog = {
      residentId: user.id,
      units: parseFloat(units),
      date: new Date(),
      synced: 0
    };

    try {
      // 1. Save to Dexie immediately
      await db.electricity_usage.add(localLog);
      
      // 2. Attempt network sync
      const res = await fetch("/api/electricity-usage", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ units: localLog.units })
      });
      
      if (res.ok) {
        const data = await res.json();
        setMessage({ type: data.usage.scoreImpact >= 0 ? "success" : "warning", text: data.message });
        // Mark as synced locally
        await db.electricity_usage.where("date").equals(localLog.date).modify({ synced: 1 });
      } else {
        setMessage({ type: "success", text: "Saved locally. Will sync when online!" });
      }
      setUnits("");
      fetchHistory();
    } catch (e) { 
      setMessage({ type: "success", text: "Offline: Saved locally!" });
      setUnits("");
      fetchHistory();
    } finally { setLoading(false); }
  };

  return (
    <div className="w-full flex flex-col gap-6 animate-fade-in pb-10">
      <div className="text-center mb-2 mt-4">
        <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 flex items-center justify-center gap-2">
          <Zap className="w-8 h-8 text-amber-500" /> <span suppressHydrationWarning>{t("power_tracking")}</span>
        </h1>
        <p className="text-slate-500 mt-2 font-medium" suppressHydrationWarning>{t("power_tracking_subtitle")}</p>
      </div>

      <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100 flex flex-col gap-4">
        <div className="bg-amber-50 border border-amber-100 rounded-2xl p-4 flex items-start gap-3">
          <TrendingDown className="w-6 h-6 text-amber-600 mt-1" />
          <div>
            <h3 className="text-amber-800 font-bold">{t("conservation_logic")}</h3>
            <p className="text-amber-700 text-xs mt-1">
              {t("conservation_desc")}
            </p>
          </div>
        </div>

        {message && (
          <div className={`p-4 rounded-2xl text-sm font-bold flex items-center gap-2 ${message.type === "success" ? "bg-emerald-100 text-emerald-700" : "bg-rose-100 text-rose-700"
            }`}>
            {message.type === "success" ? <CheckCircle2 className="w-5 h-5" /> : <AlertTriangle className="w-5 h-5" />}
            {message.text}
          </div>
        )}

        <form onSubmit={handleLogUsage} className="flex flex-col gap-4">
          <div>
            <label className="text-xs font-black text-slate-500 uppercase tracking-widest ml-1 mb-1 block">{t("current_month_usage")}</label>
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
            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : t("log_monthly_bill")}
          </button>
        </form>
      </div>

      <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100 flex flex-col gap-4">
        <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
          <Clock className="w-5 h-5 text-slate-400" /> {t("billing_history")}
        </h3>
        <div className="flex flex-col gap-3">
          {history.length === 0 ? (
            <p className="text-slate-400 italic text-sm text-center py-4">No electricity logs yet.</p>
          ) : (
            history.map((log) => (
              <div key={log._id || `elec-${log.date}`} className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100">
                <div>
                  <p className="text-sm font-bold text-slate-800">{log.units} Units</p>
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Avg was {log.previousAverage} &middot; {new Date(log.date).toLocaleDateString()}</p>
                </div>
                <div className={`px-3 py-1 rounded-full text-xs font-black ${log.scoreImpact > 0 ? "bg-emerald-100 text-emerald-700" : log.scoreImpact < 0 ? "bg-rose-100 text-rose-700" : "bg-slate-200 text-slate-600"
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
  const { t } = useTranslation();
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
      if (res.ok) {
        const data = await res.json();
        setHistory(data.history || []);
      }
      const pending = await db.water_usage.where("synced").equals(0).toArray();
      if (pending.length > 0) {
        setHistory(prev => [...pending.map(p => ({ ...p, _id: p.id, status: "Pending Sync" })), ...prev]);
      }
    } catch (e) {
      const allLocal = await db.water_usage.toArray();
      setHistory(allLocal.map(p => ({ ...p, _id: p.id, status: p.synced ? "Synced" : "Pending Sync" })));
    }
  };

  const handleLogUsage = async (e) => {
    e.preventDefault();
    if (!amount || amount <= 0) return;
    setLoading(true);

    const localLog = {
      residentId: user.id,
      amount: parseFloat(amount),
      date: new Date(),
      synced: 0
    };

    try {
      await db.water_usage.add(localLog);

      const res = await fetch("/api/water-usage", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount: localLog.amount })
      });

      if (res.ok) {
        const data = await res.json();
        setMessage({ type: data.scoreImpact > 0 ? "success" : "warning", text: data.message });
        await db.water_usage.where("date").equals(localLog.date).modify({ synced: 1 });
      } else {
        setMessage({ type: "success", text: "Saved locally. Will sync when online!" });
      }
      setAmount("");
      fetchHistory();
    } catch (e) { 
      setMessage({ type: "success", text: "Offline: Saved locally!" });
      setAmount("");
      fetchHistory();
    } finally { setLoading(false); }
  };

  return (
    <div className="w-full flex flex-col gap-6 animate-fade-in pb-10">
      <div className="text-center mb-2 mt-4">
        <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 flex items-center justify-center gap-2">
          <Droplet className="w-8 h-8 text-sky-500" /> <span suppressHydrationWarning>{t("water_consumption")}</span>
        </h1>
        <p className="text-slate-500 mt-2 font-medium" suppressHydrationWarning>{t("water_consumption_subtitle")}</p>
      </div>

      <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100 flex flex-col gap-4">
        <div className="bg-sky-50 border border-sky-100 rounded-2xl p-4">
          <h3 className="text-sky-800 font-bold flex items-center gap-2">
            <ShieldAlert className="w-5 h-5" /> {t("daily_water_limit")}
          </h3>
          <p className="text-sky-700 text-sm mt-1">
            {t("daily_water_desc")}
          </p>
        </div>

        {message && (
          <div className={`p-4 rounded-2xl text-sm font-bold flex items-center gap-2 ${message.type === "success" ? "bg-emerald-100 text-emerald-700" : "bg-rose-100 text-rose-700"
            }`}>
            {message.type === "success" ? <CheckCircle2 className="w-5 h-5" /> : <AlertTriangle className="w-5 h-5" />}
            {message.text}
          </div>
        )}

        <form onSubmit={handleLogUsage} className="flex flex-col gap-4">
          <div>
            <label className="text-xs font-black text-slate-500 uppercase tracking-widest ml-1 mb-1 block">{t("liters_consumed")}</label>
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
            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : t("log_water_usage")}
          </button>
        </form>
      </div>

      {/* History List */}
      <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100 flex flex-col gap-4">
        <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
          <Clock className="w-5 h-5 text-slate-400" /> {t("water_usage_history")}
        </h3>
        <div className="flex flex-col gap-3">
          {history.length === 0 ? (
            <p className="text-slate-400 italic text-sm text-center py-4">No water logs yet.</p>
          ) : (
            history.map((log) => (
              <div key={log._id || `water-${log.date}`} className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100">
                <div>
                  <p className="text-sm font-bold text-slate-800">{log.amount} Liters Used</p>
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">{new Date(log.date).toLocaleDateString()}</p>
                </div>
                <div className={`px-3 py-1 rounded-full text-xs font-black ${log.scoreImpact > 0 ? "bg-emerald-100 text-emerald-700" : "bg-rose-100 text-rose-700"
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

