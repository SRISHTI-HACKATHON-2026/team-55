"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import { useUI } from "./UIProvider";
import { useTranslation } from "react-i18next";
import { motion, AnimatePresence } from "framer-motion";
import {
  LayoutDashboard,
  MapPin,
  Users,
  Droplet,
  Zap,
  Mic,
  LogOut,
  Award,
  Globe,
  Settings,
  HelpCircle,
  Menu,
  X,
  Heart,
  User as UserIcon,
  ChevronRight,
  ChevronLeft
} from "lucide-react";

export default function Sidebar() {
  const { data: session, status } = useSession();
  const pathname = usePathname();
  const router = useRouter();
  const { activeTab, setActiveTab, sidebarOpen: isOpen, setSidebarOpen: setIsOpen } = useUI();
  const { t } = useTranslation();

  if (status !== "authenticated" || !session) return null;

  const isAdmin = session.user.role === "admin";
  const isNgo = session.user.role === "ngo";

  let navItems = [];
  if (isAdmin) {
    navItems = [
      { name: t("report_issue"), href: "/admin", tab: "reports", icon: LayoutDashboard },
      { name: t("community"), href: "/admin", tab: "community", icon: Users },
      { name: t("voice_logs"), href: "/admin", tab: "voice", icon: Mic },
    ];
  } else if (isNgo) {
    navItems = [
      { name: "Recovery Hub", href: "/ngo", tab: "recovery", icon: Heart },
      { name: "Community Feed", href: "/resident", tab: "feed", icon: Globe },
    ];
  } else {
    navItems = [
      { name: t("report_issue"), href: "/resident", tab: "report", icon: MapPin },
      { name: t("community_feed"), href: "/resident", tab: "feed", icon: Globe },
      { name: t("water_usage"), href: "/resident", tab: "water", icon: Droplet },
      { name: t("power_tracker"), href: "/resident", tab: "electricity", icon: Zap },
      { name: t("leaderboard"), href: "/resident", tab: "leaderboard", icon: Award },
    ];
  }

  const NavLink = ({ item }) => {
    const isActive = activeTab === item.tab && pathname === item.href;
    
    return (
      <button
        onClick={() => {
          setIsOpen(false);
          router.push(`${item.href}?tab=${item.tab}`, { scroll: false });
        }}
        className={`w-full relative flex items-center justify-between px-4 py-3.5 rounded-2xl text-sm font-bold transition-all duration-300 group outline-none ${
          isActive ? "bg-primary text-white shadow-lg shadow-primary/20" : "text-slate-500 hover:bg-slate-50 hover:text-primary"
        }`}
      >
        <div className="flex items-center gap-3.5">
          <item.icon className={`w-5 h-5 transition-colors ${isActive ? "text-white" : "text-slate-400 group-hover:text-primary"}`} />
          <span>{item.name}</span>
        </div>
        {isActive && (
          <div className="w-1.5 h-1.5 bg-white rounded-full shadow-sm" />
        )}
      </button>
    );
  };

  return (
    <>
      {/* Overlay for mobile */}
      {isOpen && (
        <div
          onClick={() => setIsOpen(false)}
          className="lg:hidden fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[115] animate-in fade-in duration-300"
        />
      )}

      {/* Sidebar Content */}
      <aside className={`fixed lg:static inset-y-0 left-0 w-[280px] bg-white border-r border-slate-200 z-[120] transform transition-all duration-500 ease-in-out lg:translate-x-0 ${isOpen ? "translate-x-0 shadow-2xl" : "-translate-x-full"
        }`}>
        <div className="flex flex-col h-full p-5">

          {/* Section: Context Title (Mobile only since Header handles desktop) */}
          <div className="lg:hidden flex items-center justify-between mb-8 px-2 pt-2">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center text-white shadow-lg shadow-primary/20">
                <Globe className="w-5 h-5" />
              </div>
              <span className="text-xl font-black tracking-tighter text-slate-900">EcoLedger</span>
            </div>
            <button 
              onClick={() => setIsOpen(false)}
              className="p-2 hover:bg-slate-100 rounded-xl text-slate-400 transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* Navigation Group */}
          <nav className="flex-1 flex flex-col gap-1.5 overflow-y-auto pr-1 custom-scrollbar">
            <div className="px-3 mb-4">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">{t("main_menu") || "Main Menu"}</p>
            </div>

            {navItems.map((item, idx) => (
              <NavLink key={idx} item={item} />
            ))}

            <div className="my-6 mx-3 border-t border-slate-100" />

            <div className="px-3 mb-4">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">System</p>
            </div>

            <Link href="#" className="flex items-center gap-3.5 px-4 py-3.5 rounded-2xl text-sm font-bold text-slate-500 hover:bg-slate-50 hover:text-primary transition-all group">
              <Settings className="w-5 h-5 text-slate-400 group-hover:text-primary" />
              <span>{t("settings")}</span>
            </Link>
            <Link href="#" className="flex items-center gap-3.5 px-4 py-3.5 rounded-2xl text-sm font-bold text-slate-500 hover:bg-slate-50 hover:text-primary transition-all group">
              <HelpCircle className="w-5 h-5 text-slate-400 group-hover:text-primary" />
              <span>{t("help_center")}</span>
            </Link>
          </nav>

          {/* User Profile Card */}
          <div className="mt-auto pt-6 border-t border-slate-100">
            <div className="bg-slate-50 rounded-3xl p-4 mb-4 border border-slate-200/50">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center font-black text-primary border-2 border-primary/10 shadow-sm">
                  {session.user.name?.charAt(0) || <UserIcon className="w-5 h-5" />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-black text-slate-900 truncate">{session.user.name}</p>
                  <div className="flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full" />
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{session.user.role}</p>
                  </div>
                </div>
              </div>

              <button
                onClick={() => signOut({ callbackUrl: "/login" })}
                className="w-full flex items-center justify-center gap-2 py-3 bg-white hover:bg-rose-50 text-slate-600 hover:text-rose-600 rounded-xl text-xs font-black transition-all border border-slate-200 hover:border-rose-100 active:scale-95"
              >
                <LogOut className="w-3.5 h-3.5" />
                {t("logout")}
              </button>
            </div>

            <p className="text-[10px] text-center text-slate-400 font-bold uppercase tracking-widest">
              v2.4.0 Stable Build
            </p>
          </div>
        </div>
      </aside>
    </>
  );
}
