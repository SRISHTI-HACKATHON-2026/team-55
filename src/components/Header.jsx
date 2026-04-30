"use client";

import { useSession } from "next-auth/react";
import { usePathname, useRouter } from "next/navigation";
import { useUI } from "./UIProvider";
import { useTranslation } from "react-i18next";
import { useEffect, useState } from "react";
import { Bell, Search, Globe, ChevronRight, CloudOff, Zap, Menu, X, ArrowLeft, Home } from "lucide-react";

export default function Header() {
  const { data: session, status } = useSession();
  const pathname = usePathname();
  const router = useRouter();
  const { activeTab, sidebarOpen, setSidebarOpen } = useUI();
  const { t, i18n } = useTranslation();
  const [isOnline, setIsOnline] = useState(true);
  const [langOpen, setLangOpen] = useState(false);

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

  const languages = [
    { code: 'en', name: 'English', flag: '🇺🇸' },
    { code: 'hi', name: 'हिन्दी', flag: '🇮🇳' },
    { code: 'kn', name: 'ಕನ್ನಡ', flag: '🇮🇳' },
    { code: 'mr', name: 'मराठी', flag: '🇮🇳' },
  ];

  const changeLanguage = (code) => {
    i18n.changeLanguage(code);
  };

  if (status === "loading") return null;

  // 🏛️ Official Gateway Navbar (Unauthenticated)
  if (status !== "authenticated" || !session) {
    return (
      <header className="h-16 w-full bg-white flex items-center justify-between px-4 lg:px-10 border-b border-slate-200">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center text-white shadow-lg shadow-primary/20">
            <Globe className="w-5 h-5" />
          </div>
          <span className="font-extrabold text-lg tracking-tight text-slate-800">
            Eco<span className="text-primary">Ledger</span>
          </span>
          <div className="hidden sm:block h-4 w-px bg-slate-300 mx-2" />
          <span className="hidden sm:block text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none">
            Institutional Gateway
          </span>
        </div>
        
        <div className="flex items-center gap-2 md:gap-4">
          <div className="flex items-center gap-2">
            {languages.map((lang) => (
              <button
                key={lang.code}
                onClick={() => changeLanguage(lang.code)}
                className={`text-lg md:text-xl hover:scale-125 transition-all duration-200 ${i18n.language === lang.code ? 'grayscale-0 scale-110 drop-shadow-sm' : 'grayscale opacity-40 hover:opacity-80'}`}
                title={lang.name}
              >
                {lang.flag}
              </button>
            ))}
          </div>
          <div className="h-6 w-px bg-slate-200 mx-1 md:mx-2" />
          <div className="flex items-center gap-2">
             <span className="hidden lg:block text-[10px] font-bold text-slate-400 uppercase tracking-wider mr-2">Please Login to Access Data</span>
             <a href="/login" className="text-xs font-black text-primary hover:text-primary-dark transition-colors border border-primary/20 px-3 py-1.5 rounded-lg bg-primary/5">
                {t("login", "LOG IN")}
             </a>
             <a href="/signup" className="text-xs font-black bg-primary text-white px-4 py-1.5 rounded-lg hover:bg-primary-dark transition-colors shadow-sm uppercase">
                {t("signup", "JOIN")}
             </a>
          </div>
        </div>
      </header>
    );
  }

  // Determine page title based on path/role
  const isAdmin = session.user.role === "admin";
  let pageTitle = t("dashboard");
  if (pathname === "/admin") pageTitle = t("admin_control");
  if (pathname.startsWith("/resident") || (pathname === "/" && !isAdmin)) pageTitle = t("resident_portal");

  return (
    <header className="h-16 w-full bg-white flex items-center justify-between px-4 lg:px-10 sticky top-0 z-[100] border-b border-slate-100">
      <div className="flex items-center gap-2 md:gap-4 flex-1">
        {/* Mobile Sidebar Toggle */}
        <button 
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="lg:hidden p-2 hover:bg-slate-50 rounded-xl transition-colors text-slate-600"
        >
          {sidebarOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>

        {/* 🧭 NAVIGATION CONTROLS */}
        <div className="flex items-center gap-1 mr-2">
          <button 
            onClick={() => router.back()}
            title="Go Back"
            className="p-1.5 hover:bg-slate-50 text-slate-400 hover:text-primary rounded-lg transition-all border border-transparent hover:border-slate-100"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <button 
            onClick={() => router.push(isAdmin ? "/admin" : "/resident")}
            title="Go Home"
            className="p-1.5 hover:bg-slate-50 text-slate-400 hover:text-primary rounded-lg transition-all border border-transparent hover:border-slate-100"
          >
            <Home className="w-4 h-4" />
          </button>
        </div>

        <div className="hidden md:flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-widest shrink-0">
          <span>EcoLedger</span>
          <ChevronRight className="w-3 h-3" />
          <span className="text-primary">{isAdmin ? "Admin" : "Resident"}</span>
          {activeTab && (
            <>
              <ChevronRight className="w-3 h-3" />
              <span className="text-slate-500">{t(activeTab)}</span>
            </>
          )}
        </div>
        <h1 className="text-sm md:text-lg font-black text-slate-800 tracking-tight capitalize truncate max-w-[100px] xs:max-w-[150px] md:max-w-none">
          {activeTab ? t(activeTab) : pageTitle}
        </h1>
      </div>

      {/* Global Actions */}
      <div className="flex items-center gap-2 md:gap-6 shrink-0">
        {/* Language Switcher */}
        <div className="relative">
          <button 
            onClick={() => setLangOpen(!langOpen)}
            className={`flex items-center gap-2 p-2 md:p-2.5 rounded-xl transition-all font-bold text-xs border ${
              langOpen ? "bg-primary-light border-primary-light text-primary shadow-sm" : "bg-slate-50 border-slate-200 hover:bg-white text-slate-600"
            }`}
          >
            <Globe className="w-4 h-4 text-primary" />
            <span className="hidden sm:inline">{t("language")}</span>
            <span className="sm:hidden">{i18n.language.toUpperCase()}</span>
          </button>
          
          {/* Dropdown Menu */}
          {langOpen && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setLangOpen(false)} />
              <div className="absolute right-0 mt-2 w-48 bg-white border border-slate-100 rounded-2xl shadow-2xl z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
                <div className="p-2 bg-slate-50 border-b border-slate-100">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-2">{t("select_language")}</p>
                </div>
                {languages.map((lang) => (
                  <button
                    key={lang.code}
                    onClick={() => {
                      changeLanguage(lang.code);
                      setLangOpen(false);
                    }}
                    className={`w-full text-left px-4 py-3.5 text-sm font-bold transition-colors flex items-center justify-between ${
                      i18n.language === lang.code ? "bg-primary-light text-primary" : "text-slate-600 hover:bg-slate-50"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-xl">{lang.flag}</span>
                      <span>{lang.name}</span>
                    </div>
                    {i18n.language === lang.code && <Zap className="w-3 h-3 fill-primary text-primary" />}
                  </button>
                ))}
              </div>
            </>
          )}
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
          isOnline ? "bg-blue-50 border-blue-100 text-blue-700" : "bg-amber-50 border-amber-100 text-amber-700 animate-pulse"
        }`}>
          {isOnline ? (
            <>
              <div className="w-2 h-2 bg-primary rounded-full animate-pulse" />
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
