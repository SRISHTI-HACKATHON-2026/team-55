"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { Loader2 } from "lucide-react";
import Link from "next/link";
import { useTranslation } from "react-i18next";

export default function RootPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const { t } = useTranslation();

  useEffect(() => {
    if (status === "loading") return;
    if (!session) return;
    if (session.user.role === "admin") {
      router.replace("/admin");
    } else {
      router.replace("/resident");
    }
  }, [session, status, router]);

  if (status === "loading") {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <Loader2 className="w-10 h-10 text-emerald-500 animate-spin" />
        <p className="text-slate-500 font-medium">{t("loading")}</p>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center gap-4">
        <h1 className="text-3xl font-extrabold text-slate-900">{t("welcome_ecoledger")}</h1>
        <p className="text-slate-500">{t("please_login_dashboard")}</p>
        <Link href="/login" className="bg-emerald-600 text-white font-bold px-6 py-3 rounded-full hover:bg-emerald-700 transition">
          {t("login_now")}
        </Link>
      </div>
    );
  }

  return null;
}
