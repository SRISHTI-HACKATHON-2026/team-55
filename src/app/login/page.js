"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useTranslation } from "react-i18next";
import { motion } from "framer-motion";
import { ShieldCheck, Mail, Lock, UserPlus, LogIn, ChevronRight, Loader2, Globe, Leaf, Zap, Landmark } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const { t } = useTranslation();
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    const res = await signIn("credentials", {
      email: e.target.email.value,
      password: e.target.password.value,
      redirect: false,
    });

    if (res?.error) {
      setError(res.error);
      setIsLoading(false);
    } else {
      const { getSession } = await import("next-auth/react");
      const session = await getSession();
      if (session?.user?.role === "admin") {
        router.push("/admin");
      } else if (session?.user?.role === "ngo") {
        router.push("/ngo");
      } else {
        router.push("/resident");
      }
      router.refresh();
    }
  };

  return (
    <div className="min-h-screen bg-white flex flex-col md:flex-row overflow-hidden selection:bg-primary-light">

      {/* 🏛️ LEFT PANEL: Institutional Branding */}
      <motion.div
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        className="hidden md:flex md:w-1/2 bg-primary p-16 flex-col justify-between relative overflow-hidden"
      >
        {/* Modern Geometric Pattern Overlay */}
        <div className="absolute inset-0 z-0 opacity-10 pointer-events-none bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]" />
        <div className="absolute top-[-10%] right-[-10%] w-[500px] h-[500px] bg-white/5 rounded-full blur-3xl" />
        <div className="absolute bottom-[-10%] left-[-10%] w-[300px] h-[300px] bg-accent/10 rounded-full blur-2xl" />

        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-16">
            <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center shadow-2xl">
              <ShieldCheck className="text-primary w-7 h-7" />
            </div>
            <div className="flex flex-col">
              <span className="text-2xl font-black tracking-tighter text-white">EcoLedger</span>
              <span className="text-[10px] font-black text-blue-200 uppercase tracking-[0.3em] leading-none">Institutional Portal</span>
            </div>
          </div>

          <h1 className="text-5xl lg:text-7xl font-black leading-tight text-white mb-8 tracking-tighter">
            Smart City <br />
            <span className="text-accent">Governance</span> <br />
            Simplified.
          </h1>

          <p className="text-xl text-blue-100 max-w-md mb-12 font-medium leading-relaxed">
            Access the official municipal resource tracking and community accountability network.
          </p>

          <div className="grid grid-cols-1 gap-6 mt-12">
            <div className="flex items-center gap-4 p-4 bg-white/5 rounded-2xl border border-white/10 backdrop-blur-md">
              <div className="w-10 h-10 bg-accent rounded-xl flex items-center justify-center shrink-0 shadow-lg shadow-accent/20">
                <Landmark className="text-white w-5 h-5" />
              </div>
              <div>
                <h4 className="font-bold text-white text-sm">Official Authority</h4>
                <p className="text-blue-200 text-xs">Direct integration with municipal departments.</p>
              </div>
            </div>
            <div className="flex items-center gap-4 p-4 bg-white/5 rounded-2xl border border-white/10 backdrop-blur-md">
              <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center shrink-0">
                <Zap className="text-accent w-5 h-5" />
              </div>
              <div>
                <h4 className="font-bold text-white text-sm">Real-time Intelligence</h4>
                <p className="text-blue-200 text-xs">AI-driven reporting and geospatial tracking.</p>
              </div>
            </div>
          </div>
        </div>

        <div className="relative z-10 pt-12 flex items-center gap-4 text-[10px] font-black text-blue-300 uppercase tracking-widest">
          <span>Official Secure Gateway</span>
          <span className="w-1 h-1 bg-blue-400 rounded-full" />
          <span>SDMShrishti 2026</span>
        </div>
      </motion.div>

      {/* 🔐 RIGHT PANEL: Secure Authentication */}
      <motion.div
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        className="flex-1 flex items-center justify-center p-6 md:p-12 bg-white"
      >
        <div className="w-full max-w-[440px]">
          {/* Mobile-only Header */}
          <div className="md:hidden flex flex-col items-center mb-10 text-center">
            <div className="w-14 h-14 bg-primary rounded-2xl flex items-center justify-center shadow-xl mb-4">
              <ShieldCheck className="text-white w-8 h-8" />
            </div>
            <h1 className="text-3xl font-black tracking-tighter text-slate-900">EcoLedger</h1>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mt-1">Official Municipal Gateway</p>
          </div>

          <div className="mb-10">
            <h2 className="text-3xl font-black text-slate-900 mb-2 tracking-tight">Authorized Access</h2>
            <p className="text-slate-500 font-medium">Please authenticate to access your personal or administrative dashboard.</p>
          </div>

          {error && (
            <div className="mb-8 p-4 bg-rose-50 border border-rose-100 rounded-2xl flex items-start gap-3 animate-in slide-in-from-top-2">
              <div className="w-8 h-8 bg-rose-500 rounded-lg flex items-center justify-center shrink-0 text-white shadow-lg shadow-rose-200">
                <Lock className="w-4 h-4" />
              </div>
              <div>
                <p className="font-black text-rose-700 text-xs uppercase tracking-wider">Security Notice</p>
                <p className="text-rose-600 text-sm font-medium mt-0.5">{error}</p>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">Terminal Identity</label>
              <div className="relative group">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-primary transition-colors" />
                <input
                  name="email" type="email" required placeholder="name@official.com"
                  className="w-full bg-slate-50 border border-slate-200 rounded-2xl pl-11 pr-4 py-4 text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-4 focus:ring-primary/5 focus:border-primary transition-all font-medium"
                />
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between items-center px-1">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Secure Key</label>
                <Link href="#" className="text-[10px] font-black text-primary hover:underline uppercase tracking-wider">Lost Key?</Link>
              </div>
              <div className="relative group">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-primary transition-colors" />
                <input
                  name="password" type="password" required placeholder="••••••••"
                  className="w-full bg-slate-50 border border-slate-200 rounded-2xl pl-11 pr-4 py-4 text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-4 focus:ring-primary/5 focus:border-primary transition-all font-medium"
                />
              </div>
            </div>

            <div className="flex flex-col gap-4 pt-6">
              {/* Primary Login Button */}
              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-primary hover:bg-primary-dark text-white font-black py-4 rounded-2xl transition-all flex items-center justify-center gap-3 shadow-2xl shadow-primary/20 active:scale-[0.98] disabled:opacity-70"
              >
                {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <><LogIn className="w-4 h-4" /> AUTHENTICATE & ENTER</>}
              </button>

              <div className="flex items-center gap-4 my-2">
                <div className="h-px flex-1 bg-slate-100" />
                <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest">New Personnel</span>
                <div className="h-px flex-1 bg-slate-100" />
              </div>

              {/* Secondary Signup Button */}
              <Link
                href="/signup"
                className="w-full bg-white border-2 border-slate-100 hover:border-primary text-slate-700 font-black py-4 rounded-2xl transition-all flex items-center justify-center gap-2 group"
              >
                <UserPlus className="w-4 h-4 text-primary" />
                ENROLL FOR ACCESS
                <ChevronRight className="w-4 h-4 ml-auto text-slate-300 group-hover:translate-x-1 group-hover:text-primary transition-all" />
              </Link>
            </div>
          </form>

          <footer className="mt-16 text-center">
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest leading-loose">
              By accessing this terminal, you agree to the <br />
              <Link href="#" className="text-primary hover:underline">Institutional Security Protocols</Link>
            </p>
          </footer>
        </div>
      </motion.div>
    </div>
  );
}