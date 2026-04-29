"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useTranslation } from "react-i18next";
import { motion } from "framer-motion";
import { ShieldCheck, Mail, Lock, UserPlus, LogIn, ChevronRight, Loader2, Globe, Leaf, Zap } from "lucide-react";

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
      } else {
        router.push("/resident");
      }
      router.refresh();
    }
  };

  return (
    <div className="min-h-screen bg-white flex flex-col md:flex-row overflow-hidden font-sans text-slate-900">

      {/* LEFT PANEL: The "Home Page" Content */}
      <motion.div
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        className="hidden md:flex md:w-1/2 bg-slate-50 border-r border-slate-100 p-16 flex-col justify-between relative overflow-hidden"
      >
        {/* Subtle grid background for the left side only */}
        <div className="absolute inset-0 z-0 opacity-[0.03] pointer-events-none"
          style={{ backgroundImage: `radial-gradient(#000 1px, transparent 1px)`, backgroundSize: '40px 40px' }} />

        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-12">
            <div className="w-10 h-10 bg-emerald-600 rounded-xl flex items-center justify-center shadow-lg shadow-emerald-600/20">
              <ShieldCheck className="text-white w-6 h-6" />
            </div>
            <span className="text-2xl font-bold tracking-tight text-slate-900 uppercase">EcoLedger</span>
          </div>

          <h1 className="text-6xl font-serif leading-[1.1] text-slate-900 mb-8">
            Manage your <br />
            <span className="text-emerald-600">resources</span> with <br />
            intelligence.
          </h1>

          <div className="space-y-8 mt-12">
            <div className="flex gap-5">
              <div className="w-12 h-12 bg-white rounded-2xl shadow-sm flex items-center justify-center shrink-0 border border-slate-100">
                <Leaf className="text-emerald-500 w-5 h-5" />
              </div>
              <div>
                <h4 className="font-bold text-slate-800">Sustainability First</h4>
                <p className="text-slate-500 text-sm">Real-time monitoring of water and energy conservation efforts.</p>
              </div>
            </div>
            <div className="flex gap-5">
              <div className="w-12 h-12 bg-white rounded-2xl shadow-sm flex items-center justify-center shrink-0 border border-slate-100">
                <Zap className="text-amber-500 w-5 h-5" />
              </div>
              <div>
                <h4 className="font-bold text-slate-800">AI Classification</h4>
                <p className="text-slate-500 text-sm">Automated issue reporting using advanced computer vision.</p>
              </div>
            </div>
          </div>
        </div>

        <div className="relative z-10 pt-12 flex items-center gap-4 text-xs font-bold text-slate-400 uppercase tracking-widest">
          <span>Karnataka Digital Infrastructure</span>
          <span className="w-1 h-1 bg-slate-300 rounded-full" />
          <span>2026</span>
        </div>
      </motion.div>

      {/* RIGHT PANEL: The Login/Auth Logic */}
      <motion.div
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        className="flex-1 flex items-center justify-center p-8 bg-white"
      >
        <div className="w-full max-w-[400px]">
          {/* Mobile-only Logo */}
          <div className="md:hidden flex flex-col items-center mb-10">
            <ShieldCheck className="text-emerald-600 w-12 h-12 mb-4" />
            <h1 className="text-3xl font-bold">EcoLedger</h1>
          </div>

          <div className="mb-10">
            <h2 className="text-3xl font-serif text-slate-900 mb-2">Welcome Back</h2>
            <p className="text-slate-500">Enter your credentials to manage your estate.</p>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-red-50 border-l-4 border-red-500 text-red-700 text-sm animate-shake">
              <p className="font-bold">Access Denied</p>
              <p>{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">Email Terminal</label>
              <div className="relative group">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-emerald-600 transition-colors" />
                <input
                  name="email" type="email" required placeholder="resident@ecoledger.com"
                  className="w-full bg-white border border-slate-200 rounded-xl pl-11 pr-4 py-3.5 text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-slate-900 transition-all"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">Secure Password</label>
              <div className="relative group">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-emerald-600 transition-colors" />
                <input
                  name="password" type="password" required placeholder="••••••••"
                  className="w-full bg-white border border-slate-200 rounded-xl pl-11 pr-4 py-3.5 text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-slate-900 transition-all"
                />
              </div>
            </div>

            <div className="flex flex-col gap-4 pt-4">
              {/* Primary Login Button */}
              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-slate-900 hover:bg-black text-white font-bold py-4 rounded-xl transition-all flex items-center justify-center gap-3 shadow-xl active:scale-[0.98]"
              >
                {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <><LogIn className="w-4 h-4" /> Sign In to Portal</>}
              </button>

              {/* Secondary Signup Button */}
              <Link
                href="/signup"
                className="w-full bg-white border border-slate-200 hover:border-slate-800 text-slate-800 font-bold py-4 rounded-xl transition-all flex items-center justify-center gap-2 group"
              >
                <UserPlus className="w-4 h-4 text-emerald-600" />
                Enroll New Resident
                <ChevronRight className="w-4 h-4 ml-auto group-hover:translate-x-1 transition-transform" />
              </Link>
            </div>
          </form>

          <footer className="mt-12 text-center">
            <p className="text-xs text-slate-400 font-medium">
              Experiencing login issues? <Link href="#" className="text-slate-900 underline font-bold">Contact Estate Support</Link>
            </p>
          </footer>
        </div>
      </motion.div>
    </div>
  );
}