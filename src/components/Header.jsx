"use client";

import { useSession } from "next-auth/react";
import { usePathname } from "next/navigation";
import { Bell, Search, Globe, ChevronRight } from "lucide-react";

export default function Header() {
  const { data: session } = useSession();
  const pathname = usePathname();

  if (!session) return null;

  // Determine page title based on path/role
  const isAdmin = session.user.role === "admin";
  let pageTitle = "Dashboard";
  if (pathname === "/admin") pageTitle = "Admin Control Center";
  if (pathname === "/" && !isAdmin) pageTitle = "Resident Portal";

  return (
    <header className="h-20 bg-surface border-b border-border flex items-center justify-between px-6 lg:px-10 sticky top-0 z-30">
      {/* Breadcrumbs / Title */}
      <div className="flex items-center gap-4">
        <div className="hidden md:flex items-center gap-2 text-[10px] font-black text-text-muted uppercase tracking-widest">
          <span>EcoLedger</span>
          <ChevronRight className="w-3 h-3" />
          <span className="text-primary">{isAdmin ? "Admin" : "Resident"}</span>
        </div>
        <h1 className="text-xl font-black text-text-main tracking-tight">{pageTitle}</h1>
      </div>

      {/* Global Actions */}
      <div className="flex items-center gap-3 lg:gap-6">
        {/* Search - Desktop only for now */}
        <div className="hidden lg:flex items-center relative">
          <Search className="absolute left-3 w-4 h-4 text-text-muted" />
          <input 
            type="text" 
            placeholder="Search resources..." 
            className="pl-10 pr-4 py-2 bg-slate-50 border border-border rounded-xl text-xs focus:ring-2 focus:ring-primary outline-none transition-all w-64"
          />
        </div>

        <div className="flex items-center gap-2">
          <button className="p-2.5 hover:bg-slate-50 text-text-muted hover:text-text-main rounded-xl transition-all relative">
            <Bell className="w-5 h-5" />
            <span className="absolute top-2 right-2 w-2 h-2 bg-rose-500 rounded-full border-2 border-white" />
          </button>
          
          <button className="p-2.5 hover:bg-slate-50 text-text-muted hover:text-text-main rounded-xl transition-all">
            <Globe className="w-5 h-5" />
          </button>
        </div>

        <div className="h-8 w-px bg-border mx-2 hidden md:block" />

        {/* Status Indicator */}
        <div className="hidden md:flex items-center gap-3 bg-emerald-50 px-4 py-2 rounded-xl border border-emerald-100">
          <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
          <span className="text-[10px] font-black text-emerald-700 uppercase tracking-wider">System Live</span>
        </div>
      </div>
    </header>
  );
}
