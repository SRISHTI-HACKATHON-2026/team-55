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

  // 🚀 Premium Institutional Gateway (Unauthenticated Landing Page)
  if (!session) {
    return (
      <div className="min-h-screen flex flex-col bg-white selection:bg-primary-light">

        {/* 🏛️ INSTITUTIONAL HERO SECTION */}
        <section className="relative min-h-[90vh] flex flex-col items-center justify-center text-center px-6 py-24 bg-primary text-white overflow-hidden">
          {/* Layered Background Effects */}
          <div className="absolute inset-0 z-0 opacity-10 pointer-events-none bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]" />
          <div className="absolute top-[-20%] right-[-10%] w-[800px] h-[800px] bg-white/5 rounded-full blur-[120px] pointer-events-none" />
          <div className="absolute bottom-[-20%] left-[-10%] w-[600px] h-[600px] bg-accent/10 rounded-full blur-[100px] pointer-events-none" />

          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="z-10 max-w-5xl mx-auto"
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/5 rounded-lg border border-white/10 mb-6 shadow-sm">
              <ShieldCheck className="w-4 h-4 text-accent" />
              <span className="text-[10px] font-black uppercase tracking-[0.2em] opacity-80 text-blue-200">Official Municipal Network</span>
            </div>
            
            <h1 className="text-5xl md:text-9xl font-black mb-8 leading-[0.9] tracking-tighter">
              The Digital <br />
              <span className="text-accent">Nervous System</span> <br />
              of Our City.
            </h1>

            <p className="text-xl md:text-3xl text-blue-100 max-w-3xl mx-auto mb-14 font-medium leading-relaxed opacity-90">
              Transforming urban governance through AI vision, real-time geospatial tracking, and community-driven accountability.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-6">
              <Link
                href="/login"
                className="w-full sm:w-auto bg-accent text-white font-black px-14 py-6 rounded-2xl shadow-[0_20px_50px_rgba(249,115,22,0.3)] hover:scale-105 hover:bg-orange-600 active:scale-95 transition-all duration-500 uppercase tracking-[0.2em] text-sm flex items-center justify-center gap-3"
              >
                Secure Entry <ArrowRight className="w-5 h-5" />
              </Link>
              <Link
                href="/signup"
                className="w-full sm:w-auto bg-white/5 text-white border-2 border-white/20 backdrop-blur-xl font-black px-14 py-6 rounded-2xl hover:bg-white hover:text-primary transition-all duration-500 uppercase tracking-[0.2em] text-sm"
              >
                Enrollment
              </Link>
            </div>
          </motion.div>

          {/* Floating Stats Teaser */}
          <motion.div 
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5, duration: 1 }}
            className="absolute bottom-10 left-0 right-0 hidden lg:flex justify-center gap-20 opacity-40"
          >
            <div className="text-center">
              <p className="text-4xl font-black tracking-tighter">12.4k</p>
              <p className="text-[10px] uppercase font-black tracking-widest text-blue-300">Active Citizens</p>
            </div>
            <div className="text-center">
              <p className="text-4xl font-black tracking-tighter">98%</p>
              <p className="text-[10px] uppercase font-black tracking-widest text-blue-300">Resolution Rate</p>
            </div>
            <div className="text-center">
              <p className="text-4xl font-black tracking-tighter">4.2m</p>
              <p className="text-[10px] uppercase font-black tracking-widest text-blue-300">Resources Saved</p>
            </div>
          </motion.div>
        </section>

        {/* 📋 THE PROCESS SECTION */}
        <section className="py-24 px-6 bg-white relative overflow-hidden">
          <div className="max-w-7xl mx-auto">
            <div className="grid lg:grid-cols-2 gap-20 items-center">
              <motion.div 
                 initial={{ opacity: 0, x: -30 }}
                 whileInView={{ opacity: 1, x: 0 }}
                 viewport={{ once: true }}
                 className="space-y-8"
              >
                <div className="space-y-4">
                  <h2 className="text-sm font-black text-primary uppercase tracking-[0.4em]">How it works</h2>
                  <h3 className="text-4xl md:text-6xl font-black text-slate-900 leading-[1.1] tracking-tighter">
                    Citizen Reporting <br /> 
                    at the Speed of AI.
                  </h3>
                </div>
                
                <div className="space-y-6">
                   <div className="flex items-start gap-5">
                      <div className="w-12 h-12 bg-slate-50 border border-slate-100 rounded-2xl flex items-center justify-center shrink-0 shadow-sm">
                        <Camera className="w-6 h-6 text-primary" />
                      </div>
                      <div>
                        <h4 className="font-black text-xl text-slate-900">1. Snap & Identify</h4>
                        <p className="text-slate-500 font-medium leading-relaxed">Capture a photo of the resource issue. Our Gemini AI instantly classifies the material and assesses severity.</p>
                      </div>
                   </div>
                   <div className="flex items-start gap-5">
                      <div className="w-12 h-12 bg-slate-50 border border-slate-100 rounded-2xl flex items-center justify-center shrink-0 shadow-sm">
                        <MapIcon className="w-6 h-6 text-primary" />
                      </div>
                      <div>
                        <h4 className="font-black text-xl text-slate-900">2. Geospatial Tagging</h4>
                        <p className="text-slate-500 font-medium leading-relaxed">Automatic street-level location pinning ensures municipal teams reach the exact spot without delays.</p>
                      </div>
                   </div>
                   <div className="flex items-start gap-5">
                      <div className="w-12 h-12 bg-slate-50 border border-slate-100 rounded-2xl flex items-center justify-center shrink-0 shadow-sm">
                        <CheckCircle2 className="w-6 h-6 text-accent" />
                      </div>
                      <div>
                        <h4 className="font-black text-xl text-slate-900">3. Resolution & Trust</h4>
                        <p className="text-slate-500 font-medium leading-relaxed">Track progress in real-time. Successful reports boost your community trust score and leaderboard rank.</p>
                      </div>
                   </div>
                </div>
              </motion.div>

              <motion.div 
                 initial={{ opacity: 0, scale: 0.95 }}
                 whileInView={{ opacity: 1, scale: 1 }}
                 viewport={{ once: true }}
                 className="relative"
              >
                <div className="aspect-square bg-slate-100 rounded-[3rem] overflow-hidden border-[12px] border-slate-50 shadow-2xl relative">
                  {/* Mock UI/Visual can go here */}
                  <div className="absolute inset-0 bg-gradient-to-tr from-primary/10 to-transparent flex items-center justify-center p-12">
                    <div className="w-full aspect-video bg-white rounded-3xl shadow-3xl border border-slate-100 p-8 transform -rotate-2">
                       <div className="flex items-center gap-3 mb-6">
                          <div className="w-10 h-10 bg-slate-50 rounded-full flex items-center justify-center"><Users className="w-5 h-5 text-slate-400" /></div>
                          <div className="space-y-1">
                             <div className="w-24 h-2 bg-slate-100 rounded-full" />
                             <div className="w-16 h-1.5 bg-slate-50 rounded-full" />
                          </div>
                       </div>
                       <div className="space-y-3">
                          <div className="w-full h-32 bg-slate-50 rounded-2xl flex items-center justify-center"><Camera className="w-8 h-8 text-slate-200" /></div>
                          <div className="w-3/4 h-3 bg-slate-100 rounded-full" />
                          <div className="w-1/2 h-3 bg-slate-100 rounded-full" />
                       </div>
                       <div className="mt-6 pt-6 border-t border-slate-100 flex justify-end">
                          <div className="w-24 h-8 bg-primary rounded-xl" />
                       </div>
                    </div>
                  </div>
                </div>
                {/* Decorative Elements */}
                <div className="absolute -top-10 -right-10 w-40 h-40 bg-accent/20 rounded-full blur-3xl" />
                <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-primary/20 rounded-full blur-3xl" />
              </motion.div>
            </div>
          </div>
        </section>

        {/* 📊 CAPABILITIES GRID */}
        <section className="py-24 px-6 bg-slate-50">
          <div className="max-w-7xl mx-auto">
             <div className="text-center mb-20">
               <h2 className="text-[10px] font-black text-primary uppercase tracking-[0.5em] mb-4">The Infrastructure</h2>
               <h3 className="text-4xl md:text-5xl font-black text-slate-900 tracking-tight">Built for Resilience.</h3>
             </div>

             <div className="grid md:grid-cols-3 gap-8">
               <motion.div whileHover={{ y: -10 }} className="bg-white p-12 rounded-[2.5rem] border border-slate-100 shadow-sm hover:shadow-2xl transition-all duration-500">
                  <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center text-primary mb-10">
                    <Globe className="w-8 h-8" />
                  </div>
                  <h3 className="font-black text-2xl mb-6 tracking-tight text-slate-900">Geospatial Web</h3>
                  <p className="text-slate-500 leading-relaxed font-medium">Precision mapping of city resources with dynamic heatmaps and cluster analysis.</p>
               </motion.div>

               <motion.div whileHover={{ y: -10 }} className="bg-white p-12 rounded-[2.5rem] border border-slate-100 shadow-sm hover:shadow-2xl transition-all duration-500">
                  <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center text-primary mb-10">
                    <BarChart3 className="w-8 h-8" />
                  </div>
                  <h3 className="font-black text-2xl mb-6 tracking-tight text-slate-900">Resource Analytics</h3>
                  <p className="text-slate-500 leading-relaxed font-medium">Deep-dive into water and energy usage metrics to drive municipal sustainability goals.</p>
               </motion.div>

               <motion.div whileHover={{ y: -10 }} className="bg-white p-12 rounded-[2.5rem] border border-slate-100 shadow-sm hover:shadow-2xl transition-all duration-500">
                  <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center text-primary mb-10">
                    <ShieldCheck className="w-8 h-8" />
                  </div>
                  <h3 className="font-black text-2xl mb-6 tracking-tight text-slate-900">Gov-Grade Security</h3>
                  <p className="text-slate-500 leading-relaxed font-medium">Multi-factor authentication and role-based access control for institutional integrity.</p>
               </motion.div>
             </div>
          </div>
        </section>

        {/* 🔐 ACCESS NOTICE */}
        <section className="py-24 text-center bg-white px-6">
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="max-w-4xl mx-auto bg-slate-900 text-white p-16 rounded-[3rem] shadow-[0_50px_100px_-20px_rgba(15,23,42,0.3)] relative overflow-hidden"
          >
            <div className="absolute top-0 right-0 w-64 h-64 bg-primary/20 rounded-full blur-[80px]" />
            
            <div className="relative z-10">
              <h2 className="text-4xl md:text-5xl font-black mb-8 tracking-tighter">
                Enter the Secure Gateway
              </h2>
              <p className="text-slate-400 mb-12 font-medium leading-relaxed max-w-xl mx-auto text-lg">
                Authenticate your institutional identity to access live datasets, civic reports, and municipal management tools.
              </p>

              <Link
                href="/login"
                className="inline-flex items-center gap-3 bg-primary text-white px-16 py-6 rounded-2xl font-black uppercase tracking-[0.2em] text-xs hover:bg-primary-dark transition-all shadow-2xl active:scale-95"
              >
                <Lock className="w-4 h-4" /> Secure Auth Terminal
              </Link>
            </div>
          </motion.div>
        </section>

        {/* ⚡ OFFICIAL FOOTER */}
        <footer className="bg-slate-50 border-t border-slate-200 py-16 px-6">
           <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-10">
              <div className="flex flex-col gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-primary rounded flex items-center justify-center text-white text-xs font-black shadow-lg shadow-primary/20">EL</div>
                  <span className="font-black text-2xl text-slate-900 tracking-tighter">EcoLedger</span>
                </div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">Official Municipal Service Portal © 2026</p>
              </div>
              
              <div className="flex items-center gap-12 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                 <Link href="#" className="hover:text-primary transition-colors">Infrastructure</Link>
                 <Link href="#" className="hover:text-primary transition-colors">Privacy Protocols</Link>
                 <Link href="#" className="hover:text-primary transition-colors">System Status</Link>
              </div>
           </div>
        </footer>
      </div>
    );
  }

  return null;
}