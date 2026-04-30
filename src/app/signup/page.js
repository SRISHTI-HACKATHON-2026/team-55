"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { signIn } from "next-auth/react";
import { useTranslation } from "react-i18next";
import { User, Shield, Mail, Lock, Phone, Eye, EyeOff, CheckCircle2, Loader2, Home, Users } from "lucide-react";

export default function SignupPage() {
  const router = useRouter();
  const { t } = useTranslation();
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [role, setRole] = useState("resident");

  // Family gender state
  const [familyGenders, setFamilyGenders] = useState({ male: 0, female: 0, other: 0 });

  const totalFamily = familyGenders.male + familyGenders.female + familyGenders.other;

  const handleGenderChange = (gender, val) => {
    const num = Math.max(0, parseInt(val) || 0);
    setFamilyGenders(prev => ({ ...prev, [gender]: num }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    const name = e.target.name.value.trim();
    const email = e.target.email.value.trim();
    const password = e.target.password.value;
    const phone = e.target.phone?.value?.trim() || "";
    const houseNumber = role === "resident" ? (e.target.houseNumber?.value?.trim() || "") : "";

    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      setIsLoading(false);
      return;
    }

    if (role === "resident" && totalFamily === 0) {
      setError("Please enter at least 1 family member in the gender breakdown.");
      setIsLoading(false);
      return;
    }

    const res = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name, email, password, phone, role,
        houseNumber,
        familySize: totalFamily || 1,
        familyGenders,
      }),
    });

    const data = await res.json();

    if (!res.ok) {
      setError(data.error || "Registration failed. Please try again.");
      setIsLoading(false);
      return;
    }

    setSuccess(true);
    await signIn("credentials", { email, password, redirect: false });
    setTimeout(() => { router.push("/"); router.refresh(); }, 1800);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-50 p-4">
      <div className="w-full max-w-md">

        {/* Header */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-14 h-14 bg-emerald-600 rounded-2xl shadow-lg shadow-emerald-600/30 mb-3">
            <span className="text-2xl">🌿</span>
          </div>
          <h1 className="text-3xl font-black text-slate-800">{t("join_ecoledger")}</h1>
          <p className="text-slate-500 mt-1 text-sm font-medium">{t("help_keep_dharwad_clean")}</p>
        </div>

        <div className="bg-white rounded-3xl shadow-xl shadow-slate-200/60 border border-slate-100 overflow-hidden">

          {/* Role Tabs */}
          <div className="p-1.5 bg-slate-50 border-b border-slate-100 flex gap-1">
            <button type="button" onClick={() => setRole("resident")}
              className={`flex-1 py-2.5 rounded-2xl text-sm font-bold transition-all flex items-center justify-center gap-2 ${role === "resident" ? "bg-emerald-600 text-white shadow-md" : "text-slate-500 hover:bg-white"
                }`}>
              <User className="w-4 h-4" /> {t("resident")}
            </button>
            <button type="button" onClick={() => setRole("admin")}
              className={`flex-1 py-2.5 rounded-2xl text-sm font-bold transition-all flex items-center justify-center gap-2 ${role === "admin" ? "bg-indigo-600 text-white shadow-md" : "text-slate-500 hover:bg-white"
                }`}>
              <Shield className="w-4 h-4" /> {t("admin")}
            </button>
          </div>

          <div className="p-6">
            {success ? (
              <div className="flex flex-col items-center gap-4 py-10 text-center">
                <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center">
                  <CheckCircle2 className="w-10 h-10 text-emerald-600" />
                </div>
                <h3 className="text-xl font-black text-slate-800">{t("account_created")}</h3>
                <p className="text-slate-500 text-sm">{t("saved_to_mongodb")}</p>
                <div className="flex gap-1">
                  {[0, 150, 300].map(d => (
                    <div key={d} className="w-2 h-2 bg-emerald-400 rounded-full animate-bounce" style={{ animationDelay: `${d}ms` }} />
                  ))}
                </div>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                {error && (
                  <div className="bg-rose-50 border border-rose-200 text-rose-700 p-3 rounded-2xl text-sm font-medium">
                    ⚠️ {error}
                  </div>
                )}

                {/* Role badge */}
                <div className={`text-xs font-black px-3 py-1.5 rounded-full self-start flex items-center gap-1.5 ${role === "admin" ? "bg-indigo-100 text-indigo-700" : "bg-emerald-100 text-emerald-700"
                  }`}>
                  {role === "admin" ? <Shield className="w-3 h-3" /> : <User className="w-3 h-3" />}
                  {role === "admin" ? t("registering_as_admin") : t("registering_as_resident")}
                </div>

                {/* Full Name */}
                <div>
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">{t("full_name")} *</label>
                  <div className="relative mt-1">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input name="name" type="text" required placeholder="e.g. Yashodhan Gurav"
                      className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm focus:ring-2 focus:ring-emerald-500 outline-none transition" />
                  </div>
                </div>

                {/* Email */}
                <div>
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">{t("email_label")} *</label>
                  <div className="relative mt-1">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input name="email" type="email" required placeholder="you@example.com"
                      className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm focus:ring-2 focus:ring-emerald-500 outline-none transition" />
                  </div>
                </div>

                {/* Phone */}
                <div>
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">{t("phone_label")}</label>
                  <div className="relative mt-1">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input name="phone" type="tel" placeholder="+91 98765 43210"
                      className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm focus:ring-2 focus:ring-emerald-500 outline-none transition" />
                  </div>
                </div>

                {/* Password */}
                <div>
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">{t("password_label")} *</label>
                  <div className="relative mt-1">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input name="password" type={showPassword ? "text" : "password"} required placeholder="Min. 6 characters"
                      className="w-full pl-10 pr-10 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm focus:ring-2 focus:ring-emerald-500 outline-none transition" />
                    <button type="button" onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* ── RESIDENT ONLY FIELDS ─────────────────────────────── */}
                {role === "resident" && (
                  <div className="flex flex-col gap-4 bg-emerald-50 rounded-2xl p-4 border border-emerald-100">
                    <p className="text-xs font-black text-emerald-700 uppercase tracking-wider flex items-center gap-1.5">
                      <Home className="w-3.5 h-3.5" /> {t("household_info")}
                    </p>

                    {/* House Number */}
                    <div>
                      <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">{t("house_number_label")} *</label>
                      <div className="relative mt-1">
                        <Home className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <input name="houseNumber" type="text" required={role === "resident"} placeholder="e.g. 12A, Flat 3B, Door 204"
                          className="w-full pl-10 pr-4 py-3 bg-white border border-slate-200 rounded-2xl text-sm focus:ring-2 focus:ring-emerald-500 outline-none transition" />
                      </div>
                    </div>

                    {/* Family Size Summary */}
                    <div className="flex items-center justify-between bg-white rounded-xl p-3 border border-slate-200">
                      <div className="flex items-center gap-2">
                        <Users className="w-4 h-4 text-emerald-600" />
                        <span className="text-sm font-bold text-slate-700">{t("total_family_size")}</span>
                      </div>
                      <span className={`text-lg font-black ${totalFamily > 0 ? "text-emerald-600" : "text-slate-400"}`}>
                        {totalFamily} {totalFamily === 1 ? t("member") : t("members")}
                      </span>
                    </div>

                    {/* Gender Breakdown */}
                    <div>
                      <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1 mb-2 block">
                        {t("family_gender_breakdown")} *
                      </label>
                      <div className="grid grid-cols-3 gap-2">
                        {/* Male */}
                        <div className="flex flex-col items-center bg-white rounded-2xl p-3 border border-slate-200 gap-2">
                          <span className="text-2xl">👨</span>
                          <span className="text-xs font-bold text-slate-600">{t("male")}</span>
                          <div className="flex items-center gap-1">
                            <button type="button" onClick={() => handleGenderChange("male", familyGenders.male - 1)}
                              className="w-6 h-6 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-sm flex items-center justify-center transition">−</button>
                            <span className="text-base font-black text-slate-800 w-6 text-center">{familyGenders.male}</span>
                            <button type="button" onClick={() => handleGenderChange("male", familyGenders.male + 1)}
                              className="w-6 h-6 rounded-full bg-emerald-100 hover:bg-emerald-200 text-emerald-700 font-bold text-sm flex items-center justify-center transition">+</button>
                          </div>
                        </div>

                        {/* Female */}
                        <div className="flex flex-col items-center bg-white rounded-2xl p-3 border border-slate-200 gap-2">
                          <span className="text-2xl">👩</span>
                          <span className="text-xs font-bold text-slate-600">{t("female")}</span>
                          <div className="flex items-center gap-1">
                            <button type="button" onClick={() => handleGenderChange("female", familyGenders.female - 1)}
                              className="w-6 h-6 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-sm flex items-center justify-center transition">−</button>
                            <span className="text-base font-black text-slate-800 w-6 text-center">{familyGenders.female}</span>
                            <button type="button" onClick={() => handleGenderChange("female", familyGenders.female + 1)}
                              className="w-6 h-6 rounded-full bg-emerald-100 hover:bg-emerald-200 text-emerald-700 font-bold text-sm flex items-center justify-center transition">+</button>
                          </div>
                        </div>

                        {/* Other */}
                        <div className="flex flex-col items-center bg-white rounded-2xl p-3 border border-slate-200 gap-2">
                          <span className="text-2xl">🧑</span>
                          <span className="text-xs font-bold text-slate-600">{t("other")}</span>
                          <div className="flex items-center gap-1">
                            <button type="button" onClick={() => handleGenderChange("other", familyGenders.other - 1)}
                              className="w-6 h-6 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-sm flex items-center justify-center transition">−</button>
                            <span className="text-base font-black text-slate-800 w-6 text-center">{familyGenders.other}</span>
                            <button type="button" onClick={() => handleGenderChange("other", familyGenders.other + 1)}
                              className="w-6 h-6 rounded-full bg-emerald-100 hover:bg-emerald-200 text-emerald-700 font-bold text-sm flex items-center justify-center transition">+</button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
                {/* ─────────────────────────────────────────────────────── */}

                {/* Submit */}
                <button type="submit" disabled={isLoading}
                  className={`w-full py-3.5 rounded-2xl font-black text-white mt-1 transition-all flex items-center justify-center gap-2 shadow-lg disabled:opacity-70 ${role === "admin"
                      ? "bg-indigo-600 hover:bg-indigo-700 shadow-indigo-600/30"
                      : "bg-emerald-600 hover:bg-emerald-700 shadow-emerald-600/30"
                    }`}>
                  {isLoading
                    ? <><Loader2 className="w-5 h-5 animate-spin" /> {t("creating_account")}</>
                    : role === "admin" ? t("create_admin_account") : t("create_resident_account")
                  }
                </button>

                <p className="text-center text-sm text-slate-500 mt-1">
                  {t("already_have_account")}{" "}
                  <Link href="/login" className="text-emerald-600 hover:underline font-bold">{t("login")}</Link>
                </p>
              </form>
            )}
          </div>
        </div>

        <p className="text-center text-xs text-slate-400 mt-5">
          🔒 Your data is securely stored in MongoDB Atlas
        </p>
      </div>
    </div>
  );
}