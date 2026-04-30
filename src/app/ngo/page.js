"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { 
  Heart, 
  MapPin, 
  Clock, 
  CheckCircle2, 
  Loader2, 
  Users, 
  ArrowRight, 
  Utensils, 
  ShieldCheck,
  AlertCircle,
  Phone
} from "lucide-react";
import { useTranslation } from "react-i18next";
import { motion, AnimatePresence } from "framer-motion";

export default function NgoDashboard() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const { t } = useTranslation();
  
  const [foodReports, setFoodReports] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [acceptingId, setAcceptingId] = useState(null);

  useEffect(() => {
    if (status === "loading") return;
    if (!session || session.user.role !== "ngo") {
      router.replace("/login");
      return;
    }
    fetchFoodReports();
  }, [session, status]);

  const fetchFoodReports = async () => {
    try {
      const res = await fetch("/api/reports?status=Pending");
      const data = await res.json();
      // Filter for food reports
      const foodOnly = data.reports.filter(r => r.type === "Surplus Food" || r.isNGOFeature);
      setFoodReports(foodOnly);
    } catch (error) {
      console.error("Fetch error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAccept = async (reportId) => {
    setAcceptingId(reportId);
    try {
      const res = await fetch("/api/ngo/accept", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reportId }),
      });
      const data = await res.json();
      if (data.success) {
        setFoodReports(prev => prev.filter(r => r._id !== reportId));
        alert("Request Accepted! 10 points have been awarded to the citizen.");
      } else {
        alert(data.error || "Failed to accept");
      }
    } catch (error) {
      alert("Network error");
    } finally {
      setAcceptingId(null);
    }
  };

  if (status === "loading" || isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[70vh] gap-4">
        <Loader2 className="w-12 h-12 text-rose-500 animate-spin" />
        <p className="text-slate-400 font-black uppercase tracking-widest text-xs">Loading Recovery Grid</p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto w-full space-y-10 py-6">
      
      {/* 🏛️ NGO HEADER */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-white p-8 rounded-[2rem] border border-slate-100 shadow-sm relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-rose-50 rounded-full blur-[80px] -mr-32 -mt-32 opacity-50" />
        
        <div className="relative z-10 space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-rose-50 text-rose-600 rounded-full border border-rose-100">
            <Heart className="w-3 h-3 fill-current" />
            <span className="text-[10px] font-black uppercase tracking-wider">Verified Humanitarian Partner</span>
          </div>
          <h1 className="text-4xl font-black text-slate-900 tracking-tight">Recovery Dashboard</h1>
          <p className="text-slate-500 font-medium">Manage surplus food recovery and citizen rewards.</p>
        </div>

        <div className="relative z-10 flex items-center gap-4 bg-slate-50 p-4 rounded-2xl border border-slate-100">
          <div className="w-12 h-12 bg-white rounded-xl shadow-sm flex items-center justify-center text-rose-500">
             <Utensils className="w-6 h-6" />
          </div>
          <div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Active Requests</p>
            <p className="text-2xl font-black text-slate-900">{foodReports.length}</p>
          </div>
        </div>
      </div>

      {/* 📋 LIST SECTION */}
      <div className="space-y-6">
        <div className="flex items-center justify-between px-2">
           <h2 className="text-xl font-black text-slate-800 flex items-center gap-3">
             <Clock className="w-5 h-5 text-rose-500" /> Nearby Surplus
           </h2>
           <button onClick={fetchFoodReports} className="text-[10px] font-black text-rose-600 uppercase tracking-widest hover:underline">Refresh Feed</button>
        </div>

        {foodReports.length === 0 ? (
          <div className="bg-white rounded-[2rem] p-20 text-center border border-dashed border-slate-200">
             <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-6">
                <CheckCircle2 className="w-10 h-10 text-slate-300" />
             </div>
             <h3 className="text-xl font-black text-slate-900 mb-2">All Clear!</h3>
             <p className="text-slate-400 font-medium">No active food recovery requests in your area at the moment.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <AnimatePresence mode="popLayout">
              {foodReports.map((report) => (
                <motion.div
                  key={report._id}
                  layout
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  className="bg-white rounded-3xl border border-slate-100 shadow-sm hover:shadow-xl transition-all duration-300 p-6 flex flex-col md:flex-row gap-6 relative overflow-hidden"
                >
                  {/* Servings Badge */}
                  <div className="absolute top-6 right-6 px-4 py-2 bg-emerald-50 text-emerald-700 rounded-xl border border-emerald-100 font-black text-xs flex items-center gap-2">
                    <Utensils className="w-3.5 h-3.5" />
                    {report.foodServings || 1} Servings
                  </div>

                  {/* Image/Icon */}
                  <div className="w-full md:w-32 h-32 bg-slate-50 rounded-2xl shrink-0 overflow-hidden border border-slate-100 flex items-center justify-center group">
                    {report.imageUrl ? (
                      <img src={report.imageUrl} alt="Food" className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                    ) : (
                      <Utensils className="w-10 h-10 text-slate-200" />
                    )}
                  </div>

                  {/* Details */}
                  <div className="flex-1 flex flex-col justify-between space-y-4">
                    <div>
                      <h4 className="font-black text-xl text-slate-900 mb-1">{report.reporterName}</h4>
                      <p className="text-slate-500 text-sm font-medium line-clamp-2 mb-4">{report.description || "No specific details provided."}</p>
                      
                      <div className="flex flex-wrap gap-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                        <div className="flex items-center gap-1.5 bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-100">
                          <MapPin className="w-3 h-3 text-rose-500" /> Street Level Access
                        </div>
                        <div className="flex items-center gap-1.5 bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-100">
                          <Clock className="w-3 h-3 text-rose-500" /> {new Date(report.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 pt-4 border-t border-slate-50">
                      <button
                        onClick={() => handleAccept(report._id)}
                        disabled={acceptingId === report._id}
                        className="flex-1 bg-rose-600 hover:bg-rose-700 text-white font-black py-3.5 rounded-xl shadow-lg shadow-rose-600/20 transition-all active:scale-95 flex items-center justify-center gap-2 disabled:opacity-50"
                      >
                        {acceptingId === report._id ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Heart className="w-4 h-4" /> Accept Recovery</>}
                      </button>
                      <button className="p-3.5 bg-slate-100 hover:bg-slate-200 rounded-xl text-slate-600 transition-colors shadow-sm">
                        <Phone className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>

      {/* 🛡️ SECURITY NOTICE */}
      <div className="bg-slate-900 rounded-[2.5rem] p-12 text-white relative overflow-hidden">
         <div className="absolute bottom-0 right-0 w-96 h-96 bg-primary/20 rounded-full blur-[100px] -mb-48 -mr-48" />
         <div className="relative z-10 flex flex-col md:flex-row items-center gap-10">
            <div className="w-20 h-20 bg-white/10 rounded-3xl flex items-center justify-center backdrop-blur-xl border border-white/10 shrink-0 shadow-2xl">
               <ShieldCheck className="w-10 h-10 text-rose-400" />
            </div>
            <div className="flex-1 space-y-3 text-center md:text-left">
               <h3 className="text-2xl font-black tracking-tight">Institutional Trust Protocol</h3>
               <p className="text-slate-400 font-medium leading-relaxed max-w-2xl">
                 Accepting a recovery request automatically notifies the citizen and awards them **10 Trust Points**. Please ensure timely collection to maintain system integrity and community trust scores.
               </p>
            </div>
            <div className="flex flex-col gap-3 shrink-0 w-full md:w-auto">
               <div className="bg-white/5 border border-white/10 px-6 py-4 rounded-2xl flex items-center gap-4 backdrop-blur-md">
                  <AlertCircle className="w-5 h-5 text-rose-400" />
                  <div className="text-left">
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 leading-none">Security Status</p>
                    <p className="text-sm font-bold text-rose-400 mt-1">Terminal Secured</p>
                  </div>
               </div>
            </div>
         </div>
      </div>

    </div>
  );
}
