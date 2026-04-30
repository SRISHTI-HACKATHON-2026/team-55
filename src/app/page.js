"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { Loader2, Leaf, ShieldCheck, BarChart3, Globe, Zap, Landmark, ArrowRight, CheckCircle2, Users, Map as MapIcon, Camera, Lock } from "lucide-react";
import Link from "next/link";
import { useTranslation } from "react-i18next";
import { motion } from "framer-motion";

export default function RootPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const { t } = useTranslation();

  useEffect(() => {
    if (status === "loading") return;
    if (!session) return;

    if (session.user.role === "admin") {
      router.replace("/admin");
    } else if (session.user.role === "ngo") {
      router.replace("/ngo");
    } else {
      router.replace("/resident");
    }
  }, [session, status, router]);

  // 🔄 Loading State
  if (status === "loading") {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-white gap-4">
        <Loader2 className="w-12 h-12 text-primary animate-spin" />
        <p className="text-slate-600 font-bold text-lg animate-pulse uppercase tracking-widest">
          {t("loading")}
        </p>
      </div>
    );
  }

  // 🚀 Clean Institutional Gateway (Unauthenticated Landing Page)
  if (!session) {
    return (
      <div className="min-h-screen flex flex-col bg-white selection:bg-primary-light">

        {/* 🏛️ MODERN CLEAN HERO SECTION */}
        <section className="relative min-h-[85vh] flex flex-col items-center justify-center text-center px-6 py-20 bg-white overflow-hidden border-b border-slate-100">
          {/* Subtle Institutional Background */}
          <div className="absolute inset-0 z-0 opacity-[0.03] pointer-events-none bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]" />
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[600px] bg-primary/5 rounded-full blur-[120px] pointer-events-none" />

          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="z-10 max-w-5xl mx-auto"
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary/5 rounded-lg border border-primary/10 mb-10 shadow-sm">
              <ShieldCheck className="w-4 h-4 text-primary" />
              <span className="text-[10px] font-black uppercase tracking-[0.3em] text-primary">Official Municipal Resource Network</span>
            </div>
            
            <h1 className="text-5xl md:text-8xl font-black mb-8 leading-[1.0] tracking-tighter text-slate-900">
              The Digital <br />
              <span className="text-primary">Governance</span> <br />
              of Our City.
            </h1>

            <p className="text-lg md:text-2xl text-slate-500 max-w-3xl mx-auto mb-14 font-medium leading-relaxed">
              Official gateway for AI-powered civic reporting, geospatial resource tracking, and community accountability.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-6">
              <Link
                href="/login"
                className="w-full sm:w-auto bg-primary text-white font-black px-12 py-5 rounded-xl shadow-xl hover:bg-primary-dark active:scale-95 transition-all duration-300 uppercase tracking-[0.2em] text-xs flex items-center justify-center gap-3"
              >
                Secure Portal <ArrowRight className="w-5 h-5" />
              </Link>
              <Link
                href="/signup"
                className="w-full sm:w-auto bg-white text-slate-700 border-2 border-slate-100 font-black px-12 py-5 rounded-xl hover:border-primary hover:text-primary transition-all duration-300 uppercase tracking-[0.2em] text-xs"
              >
                Enrollment
              </Link>
            </div>
          </motion.div>

          {/* Clean Stats Row */}
          <div className="mt-24 grid grid-cols-2 md:grid-cols-4 gap-8 md:gap-16 items-center">
             <div className="text-center">
                <p className="text-3xl font-black text-slate-900 tracking-tighter">12.4k+</p>
                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mt-1">Verified Citizens</p>
             </div>
             <div className="text-center border-l border-slate-100 pl-8">
                <p className="text-3xl font-black text-slate-900 tracking-tighter">98.2%</p>
                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mt-1">Case Resolution</p>
             </div>
             <div className="text-center border-l border-slate-100 pl-8 hidden md:block">
                <p className="text-3xl font-black text-slate-900 tracking-tighter">4.2m</p>
                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mt-1">Resources Saved</p>
             </div>
             <div className="text-center border-l border-slate-100 pl-8 hidden md:block">
                <p className="text-3xl font-black text-slate-900 tracking-tighter">24/7</p>
                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mt-1">Active Oversight</p>
             </div>
          </div>
        </section>

        {/* 📊 CAPABILITIES GRID: Clean White Cards */}
        <section className="py-24 px-6 bg-slate-50/50">
          <div className="max-w-7xl mx-auto">
             <div className="text-center mb-20">
               <h2 className="text-[10px] font-black text-primary uppercase tracking-[0.5em] mb-4">Infrastructure</h2>
               <h3 className="text-4xl font-black text-slate-900 tracking-tight">Municipal Engineering.</h3>
             </div>

             <div className="grid md:grid-cols-3 gap-8">
               <div className="bg-white p-10 rounded-2xl border border-slate-100 shadow-sm hover:shadow-xl transition-all duration-500">
                  <div className="w-14 h-14 bg-primary/5 rounded-xl flex items-center justify-center text-primary mb-8">
                    <Globe className="w-7 h-7" />
                  </div>
                  <h3 className="font-black text-xl mb-4 tracking-tight text-slate-900">Geospatial Web</h3>
                  <p className="text-slate-500 text-sm leading-relaxed font-medium">Precision mapping of city resources with dynamic heatmaps and cluster analysis.</p>
               </div>

               <div className="bg-white p-10 rounded-2xl border border-slate-100 shadow-sm hover:shadow-xl transition-all duration-500">
                  <div className="w-14 h-14 bg-primary/5 rounded-xl flex items-center justify-center text-primary mb-8">
                    <BarChart3 className="w-7 h-7" />
                  </div>
                  <h3 className="font-black text-xl mb-4 tracking-tight text-slate-900">Resource Analytics</h3>
                  <p className="text-slate-500 text-sm leading-relaxed font-medium">Deep-dive into water and energy usage metrics to drive municipal sustainability goals.</p>
               </div>

               <div className="bg-white p-10 rounded-2xl border border-slate-100 shadow-sm hover:shadow-xl transition-all duration-500">
                  <div className="w-14 h-14 bg-primary/5 rounded-xl flex items-center justify-center text-primary mb-8">
                    <ShieldCheck className="w-7 h-7" />
                  </div>
                  <h3 className="font-black text-xl mb-4 tracking-tight text-slate-900">Gov-Grade Security</h3>
                  <p className="text-slate-500 text-sm leading-relaxed font-medium">Institutional-grade authentication and role-specific workflows for civic integrity.</p>
               </div>
             </div>
          </div>
        </section>

        {/* ⚡ OFFICIAL FOOTER */}
        <footer className="bg-white border-t border-slate-100 py-16 px-6">
           <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-10">
              <div className="flex flex-col gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-7 h-7 bg-primary rounded flex items-center justify-center text-white text-[10px] font-black">EL</div>
                  <span className="font-black text-xl text-slate-900 tracking-tighter">EcoLedger</span>
                </div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">Official Municipal Service Portal © 2026</p>
              </div>
              
              <div className="flex items-center gap-12 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                 <Link href="#" className="hover:text-primary transition-colors">Infrastructure</Link>
                 <Link href="#" className="hover:text-primary transition-colors">System Status</Link>
              </div>
           </div>
        </footer>
      </div>
    );
  }

  return null;
}