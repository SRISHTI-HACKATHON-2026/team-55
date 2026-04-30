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

  // 🚀 Unauthenticated Landing Page (Redesigned)
  if (!session) {
    return (
      <div className="min-h-screen flex flex-col bg-white">

        {/* 🌿 HERO SECTION */}
        <section className="flex flex-col items-center justify-center text-center px-6 py-24 bg-gradient-to-br from-primary to-primary-dark text-white relative overflow-hidden">
          {/* Decorative government-style seal/pattern background element can be added here */}
          <div className="absolute inset-0 opacity-10 pointer-events-none bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]" />
          
          <h1 className="text-4xl md:text-7xl font-black mb-6 leading-tight tracking-tighter">
            {t("welcome_ecoledger")}
          </h1>

          <p className="text-lg md:text-2xl text-blue-100 max-w-3xl mb-10 font-medium leading-relaxed">
            {t("please_login_dashboard")}
          </p>

          <Link
            href="/login"
            className="bg-accent text-white font-black px-10 py-4 rounded-xl shadow-2xl hover:scale-105 hover:bg-orange-600 transition-all duration-300 uppercase tracking-widest text-sm"
          >
            {t("login_now")}
          </Link>
        </section>

        {/* ✨ FEATURES SECTION */}
        <section className="py-16 px-6 bg-slate-50">
          <div className="max-w-6xl mx-auto grid md:grid-cols-3 gap-8">

            <div className="bg-white p-6 rounded-2xl shadow-md hover:shadow-xl transition">
              <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center text-white mb-4">
                <Globe className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-xl mb-2">Eco Tracking</h3>
              <p className="text-slate-500">
                Monitor sustainability efforts and reduce environmental impact.
              </p>
            </div>

            <div className="bg-white p-6 rounded-2xl shadow-md hover:shadow-xl transition">
              <BarChart3 className="w-10 h-10 text-primary mb-4" />
              <h3 className="font-bold text-xl mb-2">Smart Analytics</h3>
              <p className="text-slate-500">
                Gain insights with powerful dashboards and reporting tools.
              </p>
            </div>

            <div className="bg-white p-6 rounded-2xl shadow-md hover:shadow-xl transition">
              <ShieldCheck className="w-10 h-10 text-emerald-500 mb-4" />
              <h3 className="font-bold text-xl mb-2">Secure System</h3>
              <p className="text-slate-500">
                Role-based access with secure and reliable authentication.
              </p>
            </div>

          </div>
        </section>

        {/* 🔥 CTA SECTION */}
        <section className="py-16 text-center bg-white">
          <h2 className="text-3xl font-bold mb-4 text-slate-900">
            Start your sustainable journey today 🌱
          </h2>

          <Link
            href="/login"
            className="inline-block mt-4 bg-emerald-600 text-white px-8 py-3 rounded-full font-semibold hover:bg-emerald-700 transition"
          >
            {t("login_now")}
          </Link>
        </section>

        {/* ⚡ FOOTER */}
        <footer className="text-center py-6 text-slate-400 text-sm">
          © {new Date().getFullYear()} EcoLedger. All rights reserved.
        </footer>
      </div>
    );
  }

  return null;
}