"use client";

import Link from "next/link";
import { Heart, ShieldCheck } from "lucide-react";

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <div className="flex flex-col gap-8">
      <div className="grid grid-cols-1 md:grid-cols-3 items-center gap-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">
        <div className="flex items-center gap-3 justify-center md:justify-start">
          <ShieldCheck className="w-4 h-4 text-primary" />
          <span>&copy; {currentYear} EcoLedger Smart Systems</span>
        </div>

        <div className="flex items-center justify-center gap-6">
          <Link href="#" className="hover:text-primary transition-all hover:scale-105">Privacy</Link>
          <Link href="#" className="hover:text-primary transition-all hover:scale-105">Terms</Link>
          <Link href="#" className="hover:text-primary transition-all hover:scale-105">Support</Link>
        </div>

        <div className="flex items-center justify-center md:justify-end gap-2">
          <span>Sustainable Digital Dharwad</span>
          <Heart className="w-3.5 h-3.5 text-rose-500 fill-rose-500 animate-pulse" />
        </div>
      </div>
      
      <div className="flex flex-col items-center gap-2">
        <div className="h-px w-12 bg-slate-200" />
        <p className="text-[8px] font-black text-slate-300 uppercase tracking-[0.3em]">
          Institutional Resource Management Infrastructure
        </p>
      </div>
    </div>
  );
}
