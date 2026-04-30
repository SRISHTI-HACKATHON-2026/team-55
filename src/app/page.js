"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { Loader2, Leaf, ShieldCheck, BarChart3 } from "lucide-react";
import Link from "next/link";
import { useTranslation } from "react-i18next";

export default function RootPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const { t } = useTranslation();

  useEffect(() => {
    if (status === "loading") return;
    if (!session) return;

    if (session.user.role === "admin") {
      router.replace("/admin");
    } else {
      router.replace("/resident");
    }
  }, [session, status, router]);

  // 🔄 Loading State (Improved UI)
  if (status === "loading") {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-emerald-50 to-white gap-4">
        <Loader2 className="w-12 h-12 text-emerald-500 animate-spin" />
        <p className="text-slate-600 font-medium text-lg animate-pulse">
          {t("loading")}
        </p>
      </div>
    );
  }

  // 🚀 Official Institutional Gateway (Unauthenticated Landing Page)
  if (!session) {
    return (
      <div className="min-h-screen flex flex-col bg-white">

        {/* 🏛️ INSTITUTIONAL HERO SECTION */}
        <section className="flex flex-col items-center justify-center text-center px-6 py-24 bg-gradient-to-br from-primary to-primary-dark text-white relative overflow-hidden">
          {/* Subtle Government Pattern */}
          <div className="absolute inset-0 opacity-10 pointer-events-none bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]" />
          
          <div className="z-10 animate-in fade-in zoom-in duration-1000">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/10 rounded-full border border-white/20 mb-8 backdrop-blur-md">
              <ShieldCheck className="w-4 h-4 text-accent" />
              <span className="text-[10px] font-black uppercase tracking-[0.2em]">Secure Civic Environment</span>
            </div>
            
            <h1 className="text-4xl md:text-8xl font-black mb-6 leading-tight tracking-tighter">
              {t("welcome_ecoledger")}
            </h1>

            <p className="text-lg md:text-2xl text-blue-100 max-w-3xl mx-auto mb-12 font-medium leading-relaxed">
              Official municipal gateway for sustainable resource tracking, geospatial analysis, and community-driven civic accountability.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link
                href="/login"
                className="w-full sm:w-auto bg-accent text-white font-black px-12 py-5 rounded-xl shadow-2xl hover:scale-105 hover:bg-orange-600 active:scale-95 transition-all duration-300 uppercase tracking-widest text-sm"
              >
                {t("login_now")}
              </Link>
              <Link
                href="/signup"
                className="w-full sm:w-auto bg-white/10 text-white border border-white/30 backdrop-blur-md font-black px-12 py-5 rounded-xl hover:bg-white hover:text-primary transition-all duration-300 uppercase tracking-widest text-sm"
              >
                Request Access
              </Link>
            </div>
          </div>
        </section>

        {/* 📊 PLATFORM CAPABILITIES SECTION */}
        <section className="py-24 px-6 bg-slate-50 border-y border-slate-200">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-sm font-black text-primary uppercase tracking-[0.3em] mb-4">Core Infrastructure</h2>
              <h3 className="text-3xl md:text-4xl font-black text-slate-900 tracking-tight">Platform Capabilities</h3>
            </div>

            <div className="grid md:grid-cols-3 gap-10">
              <div className="bg-white p-10 rounded-3xl border border-slate-200 shadow-sm hover:shadow-2xl hover:-translate-y-2 transition-all duration-500">
                <div className="w-14 h-14 bg-primary/10 rounded-2xl flex items-center justify-center text-primary mb-8">
                  <Globe className="w-8 h-8" />
                </div>
                <h3 className="font-black text-2xl mb-4 tracking-tight">Geospatial Intelligence</h3>
                <p className="text-slate-500 leading-relaxed font-medium">
                  High-precision street-level mapping and real-time community cluster analysis for municipal oversight.
                </p>
              </div>

              <div className="bg-white p-10 rounded-3xl border border-slate-200 shadow-sm hover:shadow-2xl hover:-translate-y-2 transition-all duration-500">
                <div className="w-14 h-14 bg-primary/10 rounded-2xl flex items-center justify-center text-primary mb-8">
                  <BarChart3 className="w-8 h-8" />
                </div>
                <h3 className="font-black text-2xl mb-4 tracking-tight">AI Analysis</h3>
                <p className="text-slate-500 leading-relaxed font-medium">
                  Integrated Gemini AI for automated waste classification and severity assessment of reported field issues.
                </p>
              </div>

              <div className="bg-white p-10 rounded-3xl border border-slate-200 shadow-sm hover:shadow-2xl hover:-translate-y-2 transition-all duration-500">
                <div className="w-14 h-14 bg-primary/10 rounded-2xl flex items-center justify-center text-primary mb-8">
                  <ShieldCheck className="w-8 h-8" />
                </div>
                <h3 className="font-black text-2xl mb-4 tracking-tight">Secure Governance</h3>
                <p className="text-slate-500 leading-relaxed font-medium">
                  Institutional-grade authentication and role-specific workflows for residents and city administrators.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* 🔐 ACCESS NOTICE */}
        <section className="py-24 text-center bg-white px-6">
          <div className="max-w-2xl mx-auto bg-slate-900 text-white p-12 rounded-[2rem] shadow-3xl">
            <h2 className="text-3xl font-black mb-6 tracking-tight">
              Authorized Personnel Only
            </h2>
            <p className="text-slate-400 mb-10 font-medium leading-relaxed">
              To view real-time datasets, civic reports, or municipal analytics, please authenticate through the secure gateway.
            </p>

            <Link
              href="/login"
              className="inline-block bg-primary text-white px-12 py-4 rounded-xl font-black uppercase tracking-widest text-xs hover:bg-primary-dark transition-all shadow-xl"
            >
              Secure Login
            </Link>
          </div>
        </section>

        {/* ⚡ OFFICIAL FOOTER */}
        <footer className="bg-slate-50 border-t border-slate-200 py-12 px-6">
           <div className="max-w-6xl mx-auto flex flex-col md:flex-row justify-between items-center gap-6">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 bg-primary rounded flex items-center justify-center text-white text-[10px] font-bold">EL</div>
                <span className="font-black text-slate-900 tracking-tighter">EcoLedger Institutional</span>
              </div>
              <div className="text-slate-400 text-[10px] font-black uppercase tracking-[0.2em]">
                © {new Date().getFullYear()} Official Municipal Service Portal
              </div>
           </div>
        </footer>
      </div>
    );
  }

  return null;
}