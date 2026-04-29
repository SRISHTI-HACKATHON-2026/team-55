"use client";

import { useSession } from "next-auth/react";
import { usePathname } from "next/navigation";
import { useUI } from "./UIProvider";
import { useTranslation } from "react-i18next";
import { useEffect, useState } from "react";
import { Bell, Search, Globe, ChevronRight, CloudOff, Zap } from "lucide-react";

export default function Header() {
  const { data: session, status } = useSession();
  const pathname = usePathname();
  const { activeTab } = useUI();
  const { t, i18n } = useTranslation();
  const [isOnline, setIsOnline] = useState(true);

  useEffect(() => {
    setIsOnline(navigator.onLine);
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  if (status === "loading") return null;

  // Unauthenticated Navbar
  if (status !== "authenticated" || !session) {
    return (
      <header className="h-16 w-full bg-white flex items-center justify-between px-6 lg:px-10">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-emerald-600 rounded-lg flex items-center justify-center text-white">
            <Globe className="w-5 h-5" />
          </div>
          <span className="font-extrabold text-xl tracking-tight text-slate-800">
            Eco<span className="text-emerald-600">Ledger</span>
          </span>
        </div>
        
        <div className="flex items-center gap-4">
          <div className="hidden sm:flex items-center gap-2">
            {languages.map((lang) => (
              <button
                key={lang.code}
                onClick={() => i18n.changeLanguage(lang.code)}
                className={`text-lg hover:scale-110 transition-transform ${i18n.language === lang.code ? 'grayscale-0' : 'grayscale opacity-50'}`}
                title={lang.name}
              >
                {lang.flag}
              </button>
            ))}
          </div>
          <div className="h-6 w-px bg-slate-200 hidden sm:block mx-2" />
          <a href="/login" className="text-sm font-bold text-slate-600 hover:text-emerald-600 transition-colors">
            {t("login", "Login")}
          </a>
          <a href="/signup" className="text-sm font-bold bg-emerald-600 text-white px-4 py-2 rounded-full hover:bg-emerald-700 transition-colors shadow-sm">
            {t("signup", "Sign Up")}
          </a>
        </div>
      </header>
    );
  }
  // Determine page title based on path/role
  const isAdmin = session.user.role === "admin";
  let pageTitle = t("dashboard");
  if (pathname === "/admin") pageTitle = t("admin_control");
  if (pathname.startsWith("/resident") || (pathname === "/" && !isAdmin)) pageTitle = t("resident_portal");

  const languages = [
    { code: 'en', name: 'English', flag: '🇺🇸' },
    { code: 'hi', name: 'हिन्दी', flag: '🇮🇳' },
    { code: 'kn', name: 'ಕನ್ನಡ', flag: '🇮🇳' },
    { code: 'mr', name: 'मराठी', flag: '🇮🇳' },
  ];

  const changeLanguage = (code) => {
    i18n.changeLanguage(code);
  };

  return (
    <header className="h-16 w-full bg-white flex items-center justify-between px-6 lg:px-10">
      <div className="flex items-center gap-4">
        <div className="hidden md:flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-widest">
          <span>EcoLedger</span>
          <ChevronRight className="w-3 h-3" />
          <span className="text-emerald-600">{isAdmin ? "Admin" : "Resident"}</span>
        </div>
        <h1 className="text-xl font-black text-slate-800 tracking-tight">{pageTitle}</h1>
      </div>

      {/* Global Actions */}
      <div className="flex items-center gap-3 lg:gap-6">
        {/* Language Switcher */}
        <div className="relative group">
          <button className="flex items-center gap-2 p-2.5 bg-slate-50 border border-border hover:bg-white text-text-main rounded-xl transition-all font-bold text-xs">
            <Globe className="w-4 h-4 text-primary" />
            <span className="hidden sm:inline">{t("language")}</span>
          </button>
          <div className="absolute right-0 mt-2 w-40 bg-white border border-border rounded-2xl shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50 overflow-hidden">
            {languages.map((lang) => (
              <button
                key={lang.code}
                onClick={() => changeLanguage(lang.code)}
                className="w-full text-left px-4 py-3 text-xs font-bold text-slate-600 hover:bg-emerald-50 hover:text-emerald-700 transition-colors flex items-center gap-3"
              >
                <span>{lang.flag}</span>
                {lang.name}
              </button>
            ))}
          </div>
        </div>

        {/* Search - Desktop only for now */}
        <div className="hidden lg:flex items-center relative">
          <Search className="absolute left-3 w-4 h-4 text-text-muted" />
          <input 
            type="text" 
            placeholder={t("search_placeholder")} 
            className="pl-10 pr-4 py-2 bg-slate-50 border border-border rounded-xl text-xs focus:ring-2 focus:ring-primary outline-none transition-all w-64"
          />
        </div>

        <div className="flex items-center gap-2">
          <button className="p-2.5 hover:bg-slate-50 text-text-muted hover:text-text-main rounded-xl transition-all relative">
            <Bell className="w-5 h-5" />
            <span className="absolute top-2 right-2 w-2 h-2 bg-rose-500 rounded-full border-2 border-white" />
          </button>
        </div>

        <div className="h-8 w-px bg-border mx-2 hidden md:block" />

        {/* Status Indicator */}
        <div className={`hidden md:flex items-center gap-3 px-4 py-2 rounded-xl border transition-all ${
          isOnline 
            ? "bg-emerald-50 border-emerald-100 text-emerald-700" 
            : "bg-amber-50 border-amber-100 text-amber-700 animate-pulse"
        }`}>
          {isOnline ? (
            <>
              <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
              <span className="text-[10px] font-black uppercase tracking-wider">{t("system_live")}</span>
            </>
          ) : (
            <>
              <CloudOff className="w-3.5 h-3.5" />
              <span className="text-[10px] font-black uppercase tracking-wider">Offline</span>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
