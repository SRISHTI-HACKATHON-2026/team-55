"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import { useUI } from "./UIProvider";
import { useTranslation } from "react-i18next";
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
  Phone
} from "lucide-react";
import { useState } from "react";

export default function Sidebar() {
  const { data: session, status } = useSession();
  const pathname = usePathname();
  const router = useRouter();
  const { activeTab, setActiveTab } = useUI();
  const { t } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);

  if (status !== "authenticated" || !session) return null;

  const isAdmin = session.user.role === "admin";

  const navItems = isAdmin 
    ? [
        { name: t("report_issue"), href: "/admin", tab: "reports", icon: LayoutDashboard },
        { name: t("community"), href: "/admin", tab: "community", icon: Users },
        { name: t("voice_logs"), href: "/admin", tab: "voice", icon: Mic },
        { name: "IVR Simulator", href: "/mock-ivr", tab: "mock-ivr", icon: Phone },
      ]
    : [
        { name: t("report_issue"), href: "/resident", tab: "report", icon: MapPin },
        { name: t("community_feed"), href: "/resident", tab: "feed", icon: Globe },
        { name: t("water_usage"), href: "/resident", tab: "water", icon: Droplet },
        { name: t("power_tracker"), href: "/resident", tab: "electricity", icon: Zap },
        { name: t("leaderboard"), href: "/resident", tab: "leaderboard", icon: Award },
      ];

  const NavLink = ({ item }) => {
    const isActive = activeTab === item.tab && pathname === item.href;
    
    return (
      <button
        onClick={() => {
          setActiveTab(item.tab);
          setIsOpen(false);
          // Use Next.js router for smooth navigation
          if (pathname !== item.href) {
            router.push(`${item.href}?tab=${item.tab}`);
          }
        }}
        className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all duration-200 ${
          isActive 
            ? "bg-primary text-white shadow-lg shadow-primary/20" 
            : "text-text-muted hover:bg-slate-100 hover:text-text-main"
        }`}
      >
        <item.icon className={`w-5 h-5 ${isActive ? "text-white" : "text-text-muted"}`} />
        {item.name}
      </button>
    );
  };

  return (
    <>
      {/* Mobile Menu Toggle */}
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="lg:hidden fixed top-4 left-4 z-50 p-2 bg-white rounded-xl shadow-md border border-border"
      >
        {isOpen ? <X className="w-6 h-6 text-primary" /> : <Menu className="w-6 h-6 text-primary" />}
      </button>

      {/* Overlay */}
      {isOpen && (
        <div 
          onClick={() => setIsOpen(false)}
          className="lg:hidden fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-40"
        />
      )}

      {/* Sidebar Content */}
      <aside className={`fixed lg:static inset-y-0 left-0 w-72 bg-surface border-r border-border z-40 transform transition-transform duration-300 lg:translate-x-0 ${isOpen ? "translate-x-0" : "-translate-x-full"}`}>
        <div className="flex flex-col h-full p-6">
          {/* Logo */}
          <div className="flex items-center gap-3 mb-10 px-2">
            <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center shadow-lg shadow-primary/20">
              <div className="w-5 h-5 bg-white rounded-sm rotate-45" />
            </div>
            <span className="text-xl font-black tracking-tighter text-text-main">EcoLedger</span>
          </div>

          {/* Navigation */}
          <nav className="flex-1 flex flex-col gap-2">
            <p className="text-[10px] font-black text-text-muted uppercase tracking-[0.2em] mb-2 px-2">Main Menu</p>
            {navItems.map((item, idx) => (
              <NavLink key={idx} item={item} />
            ))}
            
            <div className="my-6 border-t border-border" />
            
            <p className="text-[10px] font-black text-text-muted uppercase tracking-[0.2em] mb-2 px-2">Support</p>
            <Link href="#" className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold text-text-muted hover:bg-slate-100 hover:text-text-main transition-all">
              <Settings className="w-5 h-5" /> {t("settings")}
            </Link>
            <Link href="#" className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold text-text-muted hover:bg-slate-100 hover:text-text-main transition-all">
              <HelpCircle className="w-5 h-5" /> {t("help_center")}
            </Link>
          </nav>

          {/* User Section */}
          <div className="mt-auto pt-6 border-t border-border">
            <div className="flex items-center gap-3 px-2 mb-4">
              <div className="w-10 h-10 bg-slate-100 rounded-full flex items-center justify-center font-black text-primary border-2 border-primary/10">
                {session.user.name?.charAt(0) || "U"}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-black text-text-main truncate">{session.user.name}</p>
                <p className="text-[10px] font-bold text-text-muted uppercase tracking-wider">{session.user.role}</p>
              </div>
            </div>
            <button 
              onClick={() => signOut({ callbackUrl: "/login" })}
              className="w-full flex items-center justify-center gap-2 py-3 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-xl text-sm font-bold transition-all border border-rose-100"
            >
              <LogOut className="w-4 h-4" /> {t("logout")}
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}
