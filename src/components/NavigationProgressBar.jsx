"use client";

import { useEffect, useState } from "react";
import { usePathname, useSearchParams } from "next/navigation";

export default function NavigationProgressBar() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Show progress bar on path or tab change
    setLoading(true);
    const timer = setTimeout(() => setLoading(false), 500);
    return () => clearTimeout(timer);
  }, [pathname, searchParams]);

  if (!loading) return null;

  return (
    <div className="fixed top-7 left-0 w-full h-[2px] z-[100] pointer-events-none">
      <div className="h-full bg-emerald-500 animate-progress-bar shadow-[0_0_10px_rgba(16,185,129,0.5)]" />
      <style jsx>{`
        @keyframes progress {
          0% { width: 0; opacity: 1; }
          50% { width: 70%; opacity: 1; }
          100% { width: 100%; opacity: 0; }
        }
        .animate-progress-bar {
          animation: progress 0.6s ease-out forwards;
        }
      `}</style>
    </div>
  );
}
