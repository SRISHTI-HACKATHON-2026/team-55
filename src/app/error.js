"use client";

import { useEffect } from "react";
import { AlertCircle, RefreshCcw } from "lucide-react";

export default function Error({ error, reset }) {
  useEffect(() => {
    // Log the error to an error reporting service in a real app
    console.error("Next.js Error Boundary Caught:", error);
  }, [error]);

  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center p-6 animate-fade-in">
      <div className="bg-white p-8 rounded-3xl shadow-lg border border-rose-100 max-w-md w-full text-center flex flex-col items-center">
        <div className="w-16 h-16 bg-rose-100 rounded-full flex items-center justify-center mb-6 text-rose-600 shadow-sm">
          <AlertCircle className="w-8 h-8" />
        </div>
        
        <h2 className="text-2xl font-black text-slate-800 mb-2">Oops! Something broke.</h2>
        
        <p className="text-slate-500 font-medium text-sm mb-6">
          We encountered an unexpected issue while loading this page. Our team has been notified.
        </p>

        <div className="bg-slate-50 w-full p-4 rounded-2xl border border-slate-100 mb-6 text-left overflow-hidden">
          <p className="text-xs font-mono text-rose-600 break-words">
            {error.message || "Unknown rendering error occurred."}
          </p>
        </div>

        <button
          onClick={() => reset()}
          className="w-full flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3.5 px-6 rounded-xl transition-all shadow-md hover:shadow-lg active:scale-95"
        >
          <RefreshCcw className="w-4 h-4" /> Try Again
        </button>
      </div>
    </div>
  );
}
