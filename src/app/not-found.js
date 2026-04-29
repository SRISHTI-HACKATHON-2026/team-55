import Link from "next/link";
import { Search, Home } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6 animate-fade-in">
      <div className="bg-white p-10 rounded-[2rem] shadow-xl border border-slate-100 max-w-lg w-full text-center flex flex-col items-center">
        <div className="w-24 h-24 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mb-8 relative">
          <Search className="w-10 h-10 absolute" />
          <div className="absolute -bottom-2 -right-2 bg-rose-500 text-white text-xs font-black px-2 py-1 rounded-lg shadow-sm transform rotate-12">
            404
          </div>
        </div>
        
        <h1 className="text-3xl font-black text-slate-900 mb-3 tracking-tight">Page Not Found</h1>
        <p className="text-slate-500 font-medium text-base mb-8 max-w-xs mx-auto">
          We looked everywhere, but the page you are trying to visit does not exist or has been moved.
        </p>

        <Link
          href="/"
          className="w-full flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-4 px-6 rounded-2xl transition-all shadow-md hover:shadow-lg active:scale-95"
        >
          <Home className="w-5 h-5" /> Return Home
        </Link>
      </div>
    </div>
  );
}
