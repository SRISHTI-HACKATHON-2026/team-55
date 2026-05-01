"use client";

import { useSession } from "next-auth/react";
import { usePathname, useRouter } from "next/navigation";
import { useUI } from "./UIProvider";
import { useTranslation } from "react-i18next";
import { useEffect, useState } from "react";
import { 
  Bell, 
  Search, 
  Globe, 
  ChevronRight, 
  CloudOff, 
  Zap, 
  Menu, 
  X, 
  ArrowLeft, 
  Home,
  ShieldCheck,
  User
} from "lucide-react";
import Link from "next/link";

export default function Header() {
  const { data: session, status } = useSession();
  const pathname = usePathname();
  const router = useRouter();
  const { activeTab, sidebarOpen, setSidebarOpen, notifications, markAllRead } = useUI();
  const { t, i18n } = useTranslation();
  const [isOnline, setIsOnline] = useState(true);
  const [langOpen, setLangOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    setIsOnline(navigator.onLine);
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    const handleScroll = () => setScrolled(window.scrollY > 10);

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    window.addEventListener("scroll", handleScroll);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
      window.removeEventListener("scroll", handleScroll);
    };
  }, []);

  const languages = [
    { code: 'en', name: 'English', flag: '🇺🇸', label: 'EN' },
    { code: 'hi', name: 'हिन्दी', flag: '🇮🇳', label: 'HI' },
    { code: 'kn', name: 'ಕನ್ನಡ', flag: '🇮🇳', label: 'KN' },
    { code: 'mr', name: 'मराठी', flag: '🇮🇳', label: 'MR' },
  ];

  const changeLanguage = (code) => {
    i18n.changeLanguage(code);
    // Optional: add a small haptic feedback or animation trigger here
  };

  if (status === "loading") return null;

  const isAuthenticated = status === "authenticated" && session;
  const isAdmin = session?.user?.role === "admin";
  const isNgo = session?.user?.role === "ngo";

  // Determine page title based on path/role
  let pageTitle = t("dashboard");
  if (pathname === "/admin") pageTitle = t("admin_control");
  if (pathname === "/ngo") pageTitle = "Recovery Dashboard";
  if (pathname.startsWith("/resident") || (pathname === "/" && !isAdmin && !isNgo)) pageTitle = t("resident_portal");

  return (
    <header 
      className={`h-16 w-full flex items-center justify-between px-4 md:px-10 sticky top-0 z-[100] transition-all duration-300 border-b ${
        scrolled ? "bg-white/80 backdrop-blur-xl border-slate-200/60 shadow-sm" : "bg-white border-slate-100"
      } shrink-0`}
    >
      <div className="flex items-center gap-2 md:gap-4 flex-1">
        {/* Mobile Sidebar Toggle (only when authenticated) */}
        {isAuthenticated && (
          <button 
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="lg:hidden p-2 hover:bg-slate-100 rounded-xl transition-colors text-slate-600"
          >
            {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        )}

        {/* 🏛️ LOGO & BRANDING (Consistent across all states) */}
        <Link href="/" className="flex items-center gap-2.5 group">
          <div className="w-9 h-9 bg-primary rounded-xl flex items-center justify-center text-white shadow-lg shadow-primary/20 group-hover:scale-105 transition-transform duration-300">
            <Globe className="w-5 h-5" />
          </div>
          <div className="flex flex-col">
            <span className="font-black text-base md:text-lg tracking-tighter text-slate-900 leading-none">
              Eco<span className="text-primary">Ledger</span>
            </span>
            {!isAuthenticated && (
              <span className="hidden xs:block text-[8px] md:text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] mt-0.5">
                Official Portal
              </span>
            )}
          </div>
        </Link>

        {/* 🧭 NAVIGATION CONTROLS (Only when authenticated) */}
        {isAuthenticated && (
          <div className="hidden sm:flex items-center gap-1 ml-4 pl-4 border-l border-slate-200">
            <button 
              onClick={() => router.back()}
              title="Go Back"
              className="p-1.5 hover:bg-slate-100 text-slate-400 hover:text-primary rounded-lg transition-all"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
            <button 
              onClick={() => router.push(isAdmin ? "/admin" : isNgo ? "/ngo" : "/resident")}
              title="Go Home"
              className="p-1.5 hover:bg-slate-100 text-slate-400 hover:text-primary rounded-lg transition-all"
            >
              <Home className="w-4 h-4" />
            </button>
            
            <div className="hidden md:flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">
              <ChevronRight className="w-3 h-3" />
              <span className="text-primary">{isAdmin ? "Admin" : isNgo ? "NGO" : "Resident"}</span>
              {activeTab && (
                <>
                  <ChevronRight className="w-3 h-3" />
                  <span className="text-slate-500">{t(activeTab)}</span>
                </>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Global Actions */}
      <div className="flex items-center gap-2 md:gap-6 shrink-0">
        
        {/* Unauthenticated: Premium Segmented Language Switcher */}
        {!isAuthenticated && (
          <div className="hidden lg:flex items-center bg-slate-50 border border-slate-200/60 p-1 rounded-2xl gap-1">
            {languages.map((lang) => {
              const isActive = i18n.language.startsWith(lang.code);
              return (
                <button
                  key={lang.code}
                  onClick={() => changeLanguage(lang.code)}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-[10px] font-black transition-all duration-300 ${
                    isActive 
                      ? "bg-white text-primary shadow-sm ring-1 ring-slate-100" 
                      : "text-slate-400 hover:text-slate-600 hover:bg-white/50"
                  }`}
                  title={lang.name}
                >
                  <span className={`text-sm transition-transform duration-300 ${isActive ? 'scale-110' : 'grayscale opacity-50'}`}>
                    {lang.flag}
                  </span>
                  <span className="tracking-widest">{lang.label}</span>
                </button>
              );
            })}
          </div>
        )}

        {/* Unauthenticated: Mobile/Small Screen Language Switcher */}
        {!isAuthenticated && (
          <div className="lg:hidden relative">
            <button 
              onClick={() => setLangOpen(!langOpen)}
              className="p-2 bg-slate-50 border border-slate-200 rounded-xl text-primary"
            >
              <Globe className="w-5 h-5" />
            </button>
            {langOpen && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setLangOpen(false)} />
                <div className="absolute right-0 mt-2 w-40 bg-white border border-slate-100 rounded-2xl shadow-2xl z-50 overflow-hidden animate-in fade-in slide-in-from-top-2">
                  {languages.map((lang) => (
                    <button
                      key={lang.code}
                      onClick={() => {
                        changeLanguage(lang.code);
                        setLangOpen(false);
                      }}
                      className={`w-full text-left px-4 py-3 text-xs font-black transition-colors flex items-center gap-3 ${
                        i18n.language.startsWith(lang.code) ? "bg-primary-light text-primary" : "text-slate-600 hover:bg-slate-50"
                      }`}
                    >
                      <span>{lang.flag}</span>
                      <span>{lang.name.toUpperCase()}</span>
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>
        )}
        {/* Authenticated: Rich Language Switcher (Dropdown) */}
        {isAuthenticated && (
          <div className="relative">
            <button 
              onClick={() => setLangOpen(!langOpen)}
              className={`flex items-center gap-1.5 p-1.5 md:p-2 rounded-lg md:rounded-xl transition-all font-bold text-[10px] md:text-xs border ${
                langOpen ? "bg-primary-light border-primary-light text-primary shadow-sm" : "bg-slate-50 border-slate-200 hover:bg-white text-slate-600"
              }`}
            >
              <Globe className="w-3.5 h-3.5 md:w-4 h-4 text-primary" />
              <span className="hidden sm:inline">{t("language")}</span>
              <span className="sm:hidden">{i18n.language.toUpperCase()}</span>
            </button>
            
            {langOpen && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setLangOpen(false)} />
                <div className="absolute right-0 mt-2 w-48 bg-white border border-slate-100 rounded-2xl shadow-2xl z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
                  <div className="p-3 bg-slate-50 border-b border-slate-100">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{t("select_language")}</p>
                  </div>
                  {languages.map((lang) => (
                    <button
                      key={lang.code}
                      onClick={() => {
                        changeLanguage(lang.code);
                        setLangOpen(false);
                      }}
                      className={`w-full text-left px-4 py-3 text-sm font-bold transition-colors flex items-center justify-between ${
                        i18n.language.startsWith(lang.code) ? "bg-primary-light text-primary" : "text-slate-600 hover:bg-slate-50"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-xl">{lang.flag}</span>
                        <span>{lang.name}</span>
                      </div>
                      {i18n.language.startsWith(lang.code) && <Zap className="w-3 h-3 fill-primary text-primary" />}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>
        )}

        {/* Authenticated Actions: Search & Notifications */}
        {isAuthenticated && (
          <>
            <div className="hidden lg:flex items-center relative">
              <Search className="absolute left-3 w-4 h-4 text-slate-400" />
              <input 
                type="text" 
                placeholder={t("search_placeholder")} 
                className="pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all w-64"
              />
            </div>

            {/* Notification Center */}
            <div className="relative group">
              <button 
                onClick={() => {
                  // In a real app, this might toggle a persistent state
                  markAllRead();
                }}
                className="p-2 hover:bg-slate-100 text-slate-500 hover:text-slate-900 rounded-xl transition-all relative group/bell"
              >
                <Bell className="w-5 h-5 group-hover/bell:rotate-12 transition-transform" />
                {notifications.some(n => !n.read) && (
                  <span className="absolute top-2 right-2 w-2.5 h-2.5 bg-rose-500 rounded-full border-2 border-white animate-pulse" />
                )}
              </button>

              {/* Notification Dropdown */}
              <div className="absolute right-0 top-full mt-2 w-80 bg-white rounded-2xl shadow-2xl border border-slate-100 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-300 z-50 transform translate-y-2 group-hover:translate-y-0">
                <div className="p-4 border-b border-slate-50 flex items-center justify-between">
                  <h3 className="text-sm font-black text-slate-900">Notifications</h3>
                  <span className="text-[10px] font-bold text-primary bg-primary/10 px-2 py-0.5 rounded-full">
                    {notifications.length} Total
                  </span>
                </div>
                
                <div className="max-h-80 overflow-y-auto p-2 space-y-1">
                  {notifications.length === 0 ? (
                    <div className="py-8 text-center">
                      <Bell className="w-8 h-8 text-slate-200 mx-auto mb-2" />
                      <p className="text-xs text-slate-400 font-medium">No notifications yet</p>
                    </div>
                  ) : (
                    notifications.map((notif) => (
                      <div key={notif.id} className={`p-3 rounded-xl transition-colors hover:bg-slate-50 relative ${!notif.read ? "bg-blue-50/30" : ""}`}>
                        <div className="flex items-start gap-3">
                          <div className={`mt-1 w-2 h-2 rounded-full shrink-0 ${
                            notif.type === 'success' ? 'bg-emerald-500' : 
                            notif.type === 'warning' ? 'bg-amber-500' : 'bg-primary'
                          }`} />
                          <div className="flex-1">
                            <p className="text-xs font-bold text-slate-800 leading-tight">{notif.title}</p>
                            <p className="text-[10px] text-slate-500 mt-0.5 leading-snug">{notif.message}</p>
                            <p className="text-[9px] text-slate-400 font-bold mt-1.5 uppercase">
                              {new Date(notif.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>

                <div className="p-3 border-t border-slate-50 text-center">
                  <button onClick={markAllRead} className="text-[10px] font-black text-primary uppercase tracking-widest hover:underline">
                    Clear All Notifications
                  </button>
                </div>
              </div>
            </div>

            <div className="h-8 w-px bg-slate-200 hidden xs:block" />

            {/* Status Indicator - Desktop Only */}
            <div className={`hidden lg:flex items-center gap-2.5 px-4 py-2 rounded-xl border transition-all ${
              isOnline ? "bg-emerald-50 border-emerald-100 text-emerald-700" : "bg-amber-50 border-amber-100 text-amber-700 animate-pulse"
            }`}>
              <div className={`w-2 h-2 rounded-full ${isOnline ? "bg-emerald-500 animate-pulse" : "bg-amber-500"}`} />
              <span className="text-[10px] font-black uppercase tracking-wider">{isOnline ? t("system_live") : "Offline"}</span>
            </div>

            {/* User Avatar (Quick view) */}
            <div className="w-9 h-9 bg-slate-100 rounded-full flex items-center justify-center font-black text-primary border-2 border-primary/10 cursor-pointer hover:border-primary/30 transition-all">
              {session.user.name?.charAt(0) || <User className="w-4 h-4" />}
            </div>
          </>
        )}

        {/* Unauthenticated Actions: Login / Signup */}
        {!isAuthenticated && (
          <div className="flex items-center gap-2">
            <Link href="/login" className="text-[10px] font-black text-slate-500 hover:text-primary transition-colors tracking-widest px-4 py-2 hover:bg-slate-50 rounded-xl">
              LOG IN
            </Link>
            <Link href="/signup" className="text-[10px] font-black bg-primary text-white px-6 py-3 rounded-xl hover:bg-primary-dark transition-all shadow-lg shadow-primary/20 tracking-widest active:scale-95">
              JOIN PORTAL
            </Link>
          </div>
        )}
      </div>
    </header>
  );
}
