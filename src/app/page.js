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

  if (status === "loading") {
    return (
      <div className="flex flex-col items-center justify-center flex-1 bg-white gap-4">
        <Loader2 className="w-12 h-12 text-primary animate-spin" />
        <p className="text-slate-600 font-bold text-lg animate-pulse uppercase tracking-widest">
          {t("loading")}
        </p>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="flex-1 flex flex-col bg-white">
        {/* HERO SECTION */}
        <section className="relative min-h-[90vh] flex flex-col items-center justify-center text-center px-6 py-12 md:py-24 bg-white overflow-hidden">
          {/* Enhanced Premium Background */}
          <div className="absolute inset-0 z-0 opacity-[0.05] pointer-events-none bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]" />
          <div className="absolute top-[-10%] left-1/2 -translate-x-1/2 w-full max-w-[1200px] h-[800px] bg-gradient-to-b from-primary/10 to-transparent rounded-full blur-[120px] pointer-events-none" />

          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="z-10 max-w-6xl mx-auto w-full"
          >


            <h1 className="text-4xl xs:text-5xl md:text-9xl font-black mb-8 md:mb-10 leading-[1.0] md:leading-[0.95] tracking-tight md:tracking-[-0.04em] text-slate-900 max-w-5xl mx-auto">
              The Digital <span className="text-primary">Governance</span> of Our City.
            </h1>

            <p className="text-base md:text-3xl text-slate-500 max-w-4xl mx-auto mb-10 md:mb-16 font-medium leading-relaxed tracking-tight px-4 md:px-0">
              A unified platform for AI-driven reporting, geospatial infrastructure monitoring, and community-led accountability.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-5">
              <Link
                href="/login"
                className="group w-full sm:w-auto bg-primary text-white font-black px-14 py-6 rounded-2xl shadow-2xl shadow-primary/20 hover:bg-primary-dark active:scale-[0.98] transition-all duration-300 uppercase tracking-[0.2em] text-xs flex items-center justify-center gap-3"
              >
                Enter Portal <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Link>
              <Link
                href="/signup"
                className="w-full sm:w-auto bg-white text-slate-900 border-2 border-slate-200 font-black px-14 py-6 rounded-2xl hover:border-primary hover:text-primary active:scale-[0.98] transition-all duration-300 uppercase tracking-[0.2em] text-xs"
              >
                Enrollment
              </Link>
            </div>
          </motion.div>

          {/* Premium Stats Row */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5, duration: 1 }}
            className="mt-32 grid grid-cols-2 md:grid-cols-4 gap-12 md:gap-24 items-center z-10 border-t border-slate-100 pt-16 w-full max-w-6xl mx-auto"
          >
            <div className="text-center group">
              <p className="text-4xl font-black text-slate-900 tracking-tighter group-hover:text-primary transition-colors">12.4k+</p>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-2">Verified Citizens</p>
            </div>
            <div className="text-center md:border-l border-slate-100 md:pl-12 group">
              <p className="text-4xl font-black text-slate-900 tracking-tighter group-hover:text-primary transition-colors">98.2%</p>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-2">Resolution Rate</p>
            </div>
            <div className="text-center md:border-l border-slate-100 md:pl-12 hidden md:block group">
              <p className="text-4xl font-black text-slate-900 tracking-tighter group-hover:text-primary transition-colors">4.2m</p>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-2">Resource Efficiency</p>
            </div>
            <div className="text-center md:border-l border-slate-100 md:pl-12 hidden md:block group">
              <p className="text-4xl font-black text-slate-900 tracking-tighter group-hover:text-primary transition-colors">24/7</p>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-2">Active Monitoring</p>
            </div>
          </motion.div>
        </section>

        {/* CAPABILITIES SECTION */}
        <section className="py-32 px-6 bg-slate-50/50 border-t border-slate-100">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-24">
              <h2 className="text-[10px] font-black text-primary uppercase tracking-[0.6em] mb-6">Capabilities</h2>
              <h3 className="text-5xl font-black text-slate-900 tracking-tight">The Engine of Governance.</h3>
            </div>

            <div className="grid md:grid-cols-3 gap-10">
              {[
                { icon: Globe, title: "Geospatial Intelligence", desc: "Precision mapping of city resources with real-time incident heatmaps." },
                { icon: BarChart3, title: "Asset Analytics", desc: "Advanced usage tracking for water and energy to drive sustainability." },
                { icon: ShieldCheck, title: "Institutional Security", desc: "Government-grade authentication for verified civic data integrity." }
              ].map((item, idx) => (
                <div key={idx} className="bg-white p-8 md:p-12 rounded-[2rem] md:rounded-[2.5rem] border border-slate-200/60 shadow-sm hover:shadow-2xl hover:-translate-y-2 transition-all duration-500 group text-left">
                  <div className="w-14 h-14 md:w-16 h-16 bg-slate-50 group-hover:bg-primary/5 rounded-xl md:rounded-2xl flex items-center justify-center text-slate-400 group-hover:text-primary mb-8 md:mb-10 transition-colors">
                    <item.icon className="w-7 h-7 md:w-8 h-8" />
                  </div>
                  <h3 className="font-black text-xl md:text-2xl mb-4 md:mb-5 tracking-tight text-slate-900">{item.title}</h3>
                  <p className="text-slate-500 text-sm md:text-base leading-relaxed font-medium">{item.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      </div>
    );
  }

  return null;
}