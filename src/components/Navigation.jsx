"use client";

import Link from "next/link";
import { useSession, signOut } from "next-auth/react";

export default function Navigation() {
  const { data: session } = useSession();

  return (
    <nav className="p-4 bg-white shadow-sm flex items-center justify-between">
      <Link href="/" className="font-extrabold text-xl text-emerald-600">
        EcoLedger
      </Link>
      
      <div className="flex gap-4 items-center">
        {session ? (
          <>
            <span className="text-sm font-medium text-slate-600 hidden sm:block">
              Hi, {session.user.name}
            </span>
            {session.user.role === "admin" && (
              <Link href="/admin" className="text-sm font-semibold text-emerald-600 hover:underline">
                Admin Map
              </Link>
            )}
            <button 
              onClick={() => signOut()}
              className="text-sm font-semibold text-rose-600 hover:underline"
            >
              Sign Out
            </button>
          </>
        ) : (
          <>
            <Link href="/login" className="text-sm font-semibold text-emerald-600 hover:underline">Log In</Link>
            <Link href="/signup" className="text-sm font-semibold bg-emerald-600 text-white px-3 py-1.5 rounded-full hover:bg-emerald-700 transition">Sign Up</Link>
          </>
        )}
      </div>
    </nav>
  );
}
