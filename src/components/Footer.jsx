"use client";

import Link from "next/link";
import { Heart } from "lucide-react";

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="mt-auto pt-10 pb-6 border-t border-border">
      <div className="flex flex-col md:flex-row justify-between items-center gap-4 text-[10px] font-bold text-text-muted uppercase tracking-widest">
        <div className="flex items-center gap-2">
          <span>&copy; {currentYear} EcoLedger Smart Systems</span>
          <span className="hidden md:inline text-border">|</span>
          <span className="hidden md:inline">Dharwad Municipal Corporation Partner</span>
        </div>

        <div className="flex items-center gap-6">
          <Link href="#" className="hover:text-primary transition-colors">Privacy Policy</Link>
          <Link href="#" className="hover:text-primary transition-colors">Terms of Service</Link>
          <Link href="#" className="hover:text-primary transition-colors">Contact Support</Link>
        </div>

        <div className="flex items-center gap-1.5 text-text-muted">
          <span>Made with</span>
          <Heart className="w-3 h-3 text-rose-500 fill-rose-500" />
          <span>for Sustainable Cities</span>
        </div>
      </div>
    </footer>
  );
}
