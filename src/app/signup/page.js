"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { signIn } from "next-auth/react";
import { useTranslation } from "react-i18next";
import { User, Shield, Mail, Lock, Phone, Eye, EyeOff, CheckCircle2, Loader2, Home, Users, Heart, Award, ChevronRight, Globe, ShieldCheck, Leaf, Zap } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function SignupPage() {
  const router = useRouter();
  const { t } = useTranslation();
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [role, setRole] = useState("resident"); // resident, admin, ngo

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
    const ngoId = role === "ngo" ? (e.target.ngoId?.value?.trim() || "") : "";

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

    if (role === "ngo" && !ngoId) {
      setError("Official NGO Registration ID is required.");
      setIsLoading(false);
      return;
    }

    const res = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name, email, password, phone, role,
        houseNumber,
        ngoId,
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

    // Determine redirect
    let target = "/";
    if (role === "admin") target = "/admin";
    if (role === "ngo") target = "/ngo";
    if (role === "resident") target = "/resident";

    setTimeout(() => { router.push(target); router.refresh(); }, 1800);
  };

  const themeColor = role === "admin" ? "emerald" : role === "ngo" ? "rose" : "primary";
  const primaryBg = role === "admin" ? "bg-emerald-600" : role === "ngo" ? "bg-rose-600" : "bg-[#1e40af]";
  const primaryText = role === "admin" ? "text-emerald-600" : role === "ngo" ? "text-rose-600" : "text-[#1e40af]";
  const primaryShadow = role === "admin" ? "shadow-emerald-600/20" : role === "ngo" ? "shadow-rose-600/20" : "shadow-[#1e40af]/20";

  return (
    <div className="flex-1 flex flex-col md:flex-row bg-white overflow-hidden relative">
      {/* Decorative Background Elements */}
      <div className="absolute inset-0 z-0 opacity-[0.03] pointer-events-none bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]" />
      <div className={`absolute top-[-10%] right-[-10%] w-[500px] h-[500px] ${role === 'admin' ? 'bg-emerald-500/10' : role === 'ngo' ? 'bg-rose-500/10' : 'bg-[#1e40af]/10'} rounded-full blur-[100px] pointer-events-none transition-colors duration-700`} />

      {/* LEFT PANEL: Branding & Mission (Desktop Only) */}
      <motion.div
        initial={{ opacity: 0, x: -50 }}
        animate={{ opacity: 1, x: 0 }}
        className={`hidden lg:flex lg:w-1/2 relative flex-col justify-between p-16 overflow-hidden ${primaryBg} text-white transition-colors duration-700`}
      >
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-16">
            <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center shadow-2xl transition-all duration-700">
              <ShieldCheck className={`${primaryText} w-7 h-7`} />
            </div>
            <div className="flex flex-col">
              <span className="text-2xl font-black tracking-tighter text-white">EcoLedger</span>
              <span className="text-[10px] font-black text-white/60 uppercase tracking-[0.3em] leading-none">Institutional Portal</span>
            </div>
          </div>

          <h1 className="text-6xl font-black tracking-tighter leading-[0.9] mb-8">
            Build a <br />
            <span className="text-white/70">Better City</span> <br />
            Together.
          </h1>

          <p className="text-xl text-white/80 font-medium max-w-md leading-relaxed mb-12">
            Join thousands of citizens and officials working towards a more sustainable, accountable, and digitally governed Dharwad.
          </p>

          <div className="grid grid-cols-1 gap-6 max-w-sm">
            {[
              { icon: Leaf, title: "Green Initiatives", desc: "Contribute to city-wide sustainability goals." },
              { icon: Zap, title: "Efficiency Hub", desc: "Track resource usage with AI precision." },
              { icon: Globe, title: "Global Impact", desc: "Lead the way in modern civic tech." }
            ].map((item, idx) => (
              <div key={idx} className="flex items-center gap-4 p-4 bg-white/5 rounded-2xl border border-white/10 backdrop-blur-md">
                <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center shrink-0">
                  <item.icon className="text-white w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-bold text-white text-sm">{item.title}</h4>
                  <p className="text-white/60 text-xs">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="relative z-10 flex items-center gap-4 text-[10px] font-black text-white/40 uppercase tracking-[0.3em]">
          <span>Institutional Protocol Active</span>
          <span className="w-1 h-1 bg-white/20 rounded-full" />
          <span>v4.0 Secure</span>
        </div>

        {/* Abstract Background Shapes */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-white opacity-[0.05] rounded-full blur-[120px] pointer-events-none" />
      </motion.div>

      {/* RIGHT PANEL: Form */}
      <motion.div
        initial={{ opacity: 0, x: 50 }}
        animate={{ opacity: 1, x: 0 }}
        className="flex-1 flex items-center justify-center p-6 md:p-12 relative z-10"
      >
        <div className="w-full max-w-[480px]">
          {/* Header (Page Title) */}
          <div className="mb-8">
            <h2 className="text-3xl font-black text-slate-900 mb-2 tracking-tight">Institutional Enrollment</h2>
            <p className="text-slate-500 font-medium text-sm">Please select your primary role to begin the onboarding process.</p>
          </div>

          <div className="bg-white rounded-[2.5rem] shadow-2xl shadow-slate-200/80 border border-slate-100 overflow-hidden relative">

            {/* Premium Role Tabs */}
            <div className="p-1.5 bg-slate-50 border-b border-slate-100 flex gap-1">
              {[
                { id: "resident", label: "Citizen", icon: User, color: "primary" },
                { id: "ngo", label: "NGO", icon: Heart, color: "rose" },
                { id: "admin", label: "Official", icon: Shield, color: "emerald" }
              ].map((r) => (
                <button
                  key={r.id}
                  type="button"
                  onClick={() => setRole(r.id)}
                  className={`flex-1 py-3.5 rounded-[1.25rem] text-[10px] font-black uppercase tracking-[0.15em] transition-all duration-300 flex items-center justify-center gap-2.5 ${role === r.id
                      ? `${r.id === 'admin' ? 'bg-emerald-600' : r.id === 'ngo' ? 'bg-rose-600' : 'bg-[#1e40af]'} text-white shadow-xl shadow-${r.color === 'primary' ? '[#1e40af]/20' : r.color + '-600/20'} scale-[1.02]`
                      : "text-slate-400 hover:text-slate-600 hover:bg-white"
                    }`}
                >
                  <r.icon className={`w-4 h-4 ${role === r.id ? 'text-white' : 'text-slate-400'}`} /> {r.label}
                </button>
              ))}
            </div>

            <div className="p-8">
              {success ? (
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="flex flex-col items-center gap-8 py-10 text-center"
                >
                  <div className={`w-24 h-24 ${role === 'admin' ? 'bg-emerald-100' : role === 'ngo' ? 'bg-rose-100' : 'bg-blue-100'} rounded-full flex items-center justify-center relative`}>
                    <div className={`absolute inset-0 animate-ping opacity-20 rounded-full ${role === 'admin' ? 'bg-emerald-400' : role === 'ngo' ? 'bg-rose-400' : 'bg-blue-400'}`} />
                    <CheckCircle2 className={`w-12 h-12 ${primaryText} relative z-10`} />
                  </div>
                  <div>
                    <h3 className="text-3xl font-black text-slate-900 mb-2">Enrollment Success</h3>
                    <p className="text-slate-500 font-medium italic">Initializing secure institutional terminal...</p>
                  </div>
                  <div className="flex gap-2.5">
                    {[0, 150, 300].map(d => (
                      <div key={d} className={`w-3 h-3 ${role === 'admin' ? 'bg-emerald-400' : role === 'ngo' ? 'bg-rose-400' : 'bg-indigo-400'} rounded-full animate-bounce`} style={{ animationDelay: `${d}ms` }} />
                    ))}
                  </div>
                </motion.div>
              ) : (
                <form onSubmit={handleSubmit} className="flex flex-col gap-6">
                  {error && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="bg-rose-50 border border-rose-200 text-rose-700 p-4 rounded-2xl text-xs font-black flex items-center gap-3 uppercase tracking-wider"
                    >
                      <Shield className="w-5 h-5 shrink-0" /> {error}
                    </motion.div>
                  )}

                  {/* Input Fields */}
                  <div className="space-y-5">
                    {/* Organization / Full Name */}
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">
                        {role === "ngo" ? "Organization Identity" : "Full Name"}
                      </label>
                      <div className="relative group">
                        <div className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-primary transition-colors">
                          <User className="w-full h-full" />
                        </div>
                        <input name="name" type="text" required placeholder={role === "ngo" ? "Organization Name" : "Official Name"}
                          className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm focus:bg-white focus:ring-4 focus:ring-primary/5 focus:border-primary outline-none transition duration-300 font-bold" />
                      </div>
                    </div>

                    {/* NGO Specific: Registration ID */}
                    <AnimatePresence mode="wait">
                      {role === "ngo" && (
                        <motion.div
                          initial={{ opacity: 0, height: 0, y: -10 }}
                          animate={{ opacity: 1, height: "auto", y: 0 }}
                          exit={{ opacity: 0, height: 0, y: -10 }}
                          className="space-y-2 overflow-hidden"
                        >
                          <label className="text-[10px] font-black text-rose-500 uppercase tracking-[0.2em] ml-1">NGO License ID *</label>
                          <div className="relative group">
                            <Award className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-rose-400" />
                            <input name="ngoId" type="text" required placeholder="Reg-ID-12345"
                              className="w-full pl-12 pr-4 py-4 bg-rose-50/30 border border-rose-200 rounded-2xl text-sm focus:bg-white focus:ring-4 focus:ring-rose-500/10 focus:border-rose-500 outline-none transition duration-300 font-bold" />
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>

                    {/* Email */}
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">Institutional Email</label>
                      <div className="relative group">
                        <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 transition-colors" />
                        <input name="email" type="email" required placeholder="id@ecoledger.gov"
                          className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm focus:bg-white focus:ring-4 focus:ring-primary/5 focus:border-primary outline-none transition duration-300 font-bold" />
                      </div>
                    </div>

                    {/* Resident Specific: House Details */}
                    <AnimatePresence mode="wait">
                      {role === "resident" && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: "auto" }}
                          exit={{ opacity: 0, height: 0 }}
                          className="space-y-5"
                        >
                          <div className="space-y-2">
                            <label className="text-[10px] font-black text-indigo-500 uppercase tracking-[0.2em] ml-1">Municipal Address (House #)</label>
                            <div className="relative group">
                              <Home className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-indigo-400" />
                              <input name="houseNumber" type="text" required placeholder="e.g. 24B, Sector 4"
                                className="w-full pl-12 pr-4 py-4 bg-indigo-50/20 border border-indigo-100 rounded-2xl text-sm focus:bg-white focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition duration-300 font-bold" />
                            </div>
                          </div>

                          <div className="bg-slate-50 rounded-3xl p-5 border border-slate-200 space-y-4">
                            <div className="flex items-center justify-between">
                              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Household Breakdown</p>
                              <span className="text-xs font-black text-indigo-600 px-3 py-1 bg-white rounded-full border border-indigo-100">{totalFamily} Total</span>
                            </div>
                            <div className="grid grid-cols-3 gap-3">
                              {['male', 'female', 'other'].map(g => (
                                <div key={g} className="bg-white rounded-[1.25rem] p-3 border border-slate-100 flex flex-col items-center gap-2 shadow-sm">
                                  <span className="text-[9px] font-black text-slate-400 uppercase">{g}</span>
                                  <div className="flex items-center gap-3">
                                    <button type="button" onClick={() => handleGenderChange(g, familyGenders[g] - 1)} className="w-6 h-6 flex items-center justify-center bg-slate-50 hover:bg-slate-200 rounded-lg text-xs font-black transition-colors">-</button>
                                    <span className="text-xs font-black w-4 text-center">{familyGenders[g]}</span>
                                    <button type="button" onClick={() => handleGenderChange(g, familyGenders[g] + 1)} className="w-6 h-6 flex items-center justify-center bg-indigo-50 text-indigo-600 hover:bg-indigo-100 rounded-lg text-xs font-black transition-colors">+</button>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>

                    {/* Password */}
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">Secure Key</label>
                      <div className="relative group">
                        <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 transition-colors" />
                        <input name="password" type={showPassword ? "text" : "password"} required placeholder="••••••••"
                          className="w-full pl-12 pr-12 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm focus:bg-white focus:ring-4 focus:ring-primary/5 focus:border-primary outline-none transition duration-300 font-bold" />
                        <button type="button" onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                          {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Submit Button */}
                  <div className="pt-2">
                    <button
                      type="submit"
                      disabled={isLoading}
                      className={`w-full py-5 rounded-[1.5rem] font-black text-white transition-all flex items-center justify-center gap-3 shadow-2xl ${primaryBg} ${primaryShadow} active:scale-[0.98] disabled:opacity-70 uppercase tracking-[0.25em] text-[10px]`}
                    >
                      {isLoading ? (
                        <Loader2 className="w-5 h-5 animate-spin" />
                      ) : (
                        <>Enroll As {role} <ChevronRight className="w-4 h-4" /></>
                      )}
                    </button>
                  </div>

                  <p className="text-center text-[10px] font-black text-slate-400 uppercase tracking-wider">
                    Already an authorized member?{" "}
                    <Link href="/login" className={`${primaryText} hover:underline ml-1`}>Authenticate Here</Link>
                  </p>
                </form>
              )}
            </div>
          </div>

          <p className="text-center text-[10px] font-black text-slate-300 mt-10 uppercase tracking-[0.4em]">
            Institutional Grade Security Protocol Active
          </p>
        </div>
      </motion.div>
    </div>
  );
}