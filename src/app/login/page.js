"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useTranslation } from "react-i18next";

export default function LoginPage() {
  const router = useRouter();
  const { t } = useTranslation();
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    const res = await signIn("credentials", {
      email: e.target.email.value,
      password: e.target.password.value,
      redirect: false,
    });

    if (res?.error) {
      setError(res.error);
    } else {
      // Fetch session to determine role-based redirect
      const { getSession } = await import("next-auth/react");
      const session = await getSession();
      if (session?.user?.role === "admin") {
        router.push("/admin");
      } else {
        router.push("/resident");
      }
      router.refresh();
    }
  };

  return (
    <div className="flex justify-center items-center h-full pt-12">
      <div className="w-full max-w-sm bg-white p-8 rounded-3xl shadow-sm border border-slate-100">
        <h2 className="text-2xl font-bold text-slate-800 text-center mb-6">{t("login")}</h2>
        {error && <div className="bg-rose-100 text-rose-600 p-3 rounded-lg text-sm mb-4">{error}</div>}
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div>
            <label className="text-sm font-medium text-slate-600">Email</label>
            <input name="email" type="email" required className="w-full mt-1 p-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500" />
          </div>
          <div>
            <label className="text-sm font-medium text-slate-600">Password</label>
            <input name="password" type="password" required className="w-full mt-1 p-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500" />
          </div>
          <button type="submit" className="w-full bg-emerald-600 text-white font-bold py-3 rounded-xl mt-4 hover:bg-emerald-700 transition">
            {t("login")}
          </button>
        </form>
        <p className="text-center text-sm text-slate-500 mt-6">
          {t("dont_have_account")} <Link href="/signup" className="text-emerald-600 hover:underline">{t("signup")}</Link>
        </p>
      </div>
    </div>
  );
}
