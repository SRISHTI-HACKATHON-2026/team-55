"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useSearchParams } from "next/navigation";
import { useUI } from "../../components/UIProvider";
import {
  LayoutList, Droplet, Trash2, Box, CheckCircle2, MapPin, ExternalLink, Activity, Users, Home, Phone, Mail,
  User, Star, Search, UserX, Mic, Volume2, ChevronDown, ChevronUp, Loader2
} from "lucide-react";
import dynamic from "next/dynamic";
import {
  PieChart, Pie, Cell, Tooltip as RechartsTooltip,
  BarChart, Bar, XAxis, YAxis, ResponsiveContainer
} from "recharts";

const MiniMap = dynamic(() => import("../../components/MiniMap"), {
  ssr: false,
  loading: () => <div className="h-64 w-full mt-4 rounded-2xl bg-slate-100 animate-pulse border border-slate-200" />,
});

export default function AdminPage() {
  const { data: session } = useSession();
  const { activeTab, setActiveTab } = useUI();
  const [reports, setReports] = useState([]);
  const [residents, setResidents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [residentsLoading, setResidentsLoading] = useState(false);
  const [expandedId, setExpandedId] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [communitySort, setCommunitySort] = useState("house"); // 'house' | 'score'
  const [isMounted, setIsMounted] = useState(false);
  const [voiceReports, setVoiceReports] = useState([]);
  const [passthruRequests, setPassthruRequests] = useState([]);
  const [voiceLoading, setVoiceLoading] = useState(false);

  useEffect(() => {
    setIsMounted(true);
    fetchReports();
  }, []);

  useEffect(() => {
    if (activeTab === "community") {
      fetchResidents(); // Always refresh on tab switch
    } else if (activeTab === "voice") {
      fetchVoiceReports();
    }
  }, [activeTab]);

  const fetchVoiceReports = async () => {
    setVoiceLoading(true);
    try {
      const res = await fetch("/api/ivr/save");
      const data = await res.json();
      setVoiceReports(data.reports || []);
      setPassthruRequests(data.passthruRequests || []);
    } catch (e) { console.error(e); }
    finally { setVoiceLoading(false); }
  };

  const fetchReports = async () => {
    try {
      const res = await fetch("/api/reports");
      const data = await res.json();
      setReports(data.reports || []);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  const fetchResidents = async () => {
    setResidentsLoading(true);
    try {
      const res = await fetch("/api/admin/users");
      if (!res.ok) { console.error("Users fetch failed", res.status); return; }
      const data = await res.json();
      console.log("Raw users from API:", data.users); // Debug
      // Filter out admins, sort by house number
      const sorted = (data.users || [])
        .filter(u => u.role !== "admin")
        .sort((a, b) => {
          const ha = a.houseNumber || "";
          const hb = b.houseNumber || "";
          return ha.localeCompare(hb, undefined, { numeric: true });
        });
      setResidents(sorted);
    } catch (e) { console.error("fetchResidents error:", e); }
    finally { setResidentsLoading(false); }
  };

  const handleAction = async (id, actionType, e) => {
    e.stopPropagation();
    try {
      await fetch("/api/reports/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reportId: id, action: actionType }),
      });
      const newStatus = actionType === "verify" ? "Resolved" : "Flagged";
      setReports(prev => prev.map(r => r._id === id ? { ...r, status: newStatus } : r));
    } catch (e) { console.error(e); }
  };

  const handleRemoveResident = async (resident) => {
    const confirmed = window.confirm(
      `Remove household "${resident.houseNumber || "No House No."}" (${resident.name})?\n\nThis will permanently delete their account from the database.`
    );
    if (!confirmed) return;

    try {
      const res = await fetch("/api/admin/users", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: resident._id }),
      });
      if (res.ok) {
        // Remove from local state instantly
        setResidents(prev => prev.filter(r => r._id !== resident._id));
        setExpandedId(null);
      } else {
        const d = await res.json();
        alert("Failed to remove: " + (d.error || "Unknown error"));
      }
    } catch (err) {
      alert("Network error. Please try again.");
    }
  };

  const handleDeleteReport = async (reportId, e) => {
    e.stopPropagation();
    const confirmed = window.confirm("Are you sure you want to delete this issue report? This action cannot be undone.");
    if (!confirmed) return;

    try {
      const res = await fetch("/api/reports", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reportId }),
      });
      if (res.ok) {
        setReports(prev => prev.filter(r => r._id !== reportId));
        setExpandedId(null);
      } else {
        const d = await res.json();
        alert("Failed to delete: " + (d.error || "Unknown error"));
      }
    } catch (err) {
      alert("Network error. Please try again.");
    }
  };

  if (!session || session.user.role !== "admin") {
    return (
      <div className="flex flex-col items-center justify-center mt-20 text-center gap-4">
        <div className="w-16 h-16 bg-rose-100 rounded-full flex items-center justify-center">
          <span className="text-3xl">🔒</span>
        </div>
        <h1 className="text-2xl font-extrabold text-slate-900">Access Denied</h1>
        <p className="text-slate-500">You must be logged in as an Admin.</p>
      </div>
    );
  }

  if (loading) {
    return <div className="text-center mt-12 text-slate-500 font-medium">Loading Dashboard...</div>;
  }

  // Analytics
  const pendingCount  = reports.filter(r => r.status === "Pending").length;
  const resolvedCount = reports.filter(r => r.status === "Resolved").length;
  const waterReports    = reports.filter(r => r.type === "Water Wastage");
  const garbageReports  = reports.filter(r => r.type === "Garbage");
  const materialReports = reports.filter(r => r.type?.startsWith("Material Waste"));

  const pieData = [
    { name: "Water",    value: waterReports.length,    color: "#0ea5e9" },
    { name: "Garbage",  value: garbageReports.length,  color: "#57534e" },
    { name: "Material", value: materialReports.length, color: "#f59e0b" },
  ].filter(d => d.value > 0);

  const last7Days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(); d.setDate(d.getDate() - (6 - i));
    return d.toLocaleDateString("en-US", { weekday: "short" });
  });
  const barData = last7Days.map(day => ({
    name: day,
    Reports: reports.filter(r => new Date(r.timestamp).toLocaleDateString("en-US", { weekday: "short" }) === day).length,
  }));

  // Filtered residents by search
  const filteredResidents = residents
    .filter(r => {
      const q = searchQuery.toLowerCase();
      return !q || r.name?.toLowerCase().includes(q) || r.houseNumber?.toLowerCase().includes(q) || r.email?.toLowerCase().includes(q);
    })
    .sort((a, b) => {
      if (communitySort === "score") {
        return (b.trustScore || 0) - (a.trustScore || 0);
      }
      // Default: House number sort
      const ha = a.houseNumber || "";
      const hb = b.houseNumber || "";
      return ha.localeCompare(hb, undefined, { numeric: true });
    });

  // Summarize family stats
  const totalResidents = residents.length;
  const totalFamily    = residents.reduce((s, r) => s + (r.familySize || 0), 0);
  const totalMale      = residents.reduce((s, r) => s + (r.familyGenders?.male || 0), 0);
  const totalFemale    = residents.reduce((s, r) => s + (r.familyGenders?.female || 0), 0);

  // ── ReportCard component ──────────────────────────────────────────────────
  const ReportCard = ({ report }) => {
    const isExpanded = expandedId === report._id;
    const Icon = report.type === "Water Wastage" ? Droplet : report.type === "Garbage" ? Trash2 : Box;
    return (
      <div
        onClick={() => setExpandedId(isExpanded ? null : report._id)}
        className={`bg-white rounded-3xl border ${isExpanded ? "border-emerald-500 shadow-md" : "border-slate-100 shadow-sm"} overflow-hidden cursor-pointer transition-all`}
      >
        {/* Header */}
        <div className="p-5 flex justify-between items-center hover:bg-slate-50 transition-colors">
          <div className="flex items-center gap-4">
            <div className={`p-3 rounded-full ${isExpanded ? "bg-emerald-100 text-emerald-600" : "bg-slate-100 text-slate-500"}`}>
              <Icon className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-800">{report.type}</h3>
              <p className="text-sm text-slate-500">Reported by {report.reporterName}</p>
            </div>
          </div>
          <div className="flex items-center gap-2 flex-wrap justify-end">
            <span className={`text-xs font-bold px-3 py-1 rounded-full ${
              report.status === "Resolved" ? "bg-emerald-100 text-emerald-700" :
              report.status === "Flagged"  ? "bg-rose-100 text-rose-700" :
              "bg-amber-100 text-amber-700"}`}>{report.status}</span>
            {report.imageUrl && <span className="text-[10px] bg-purple-100 text-purple-700 font-bold px-2 py-0.5 rounded-full">📸 Photo</span>}
            {isExpanded ? <ChevronUp className="w-5 h-5 text-slate-400" /> : <ChevronDown className="w-5 h-5 text-slate-400" />}
          </div>
        </div>

        {/* Expanded */}
        {isExpanded && (
          <div className="p-5 border-t border-slate-100 bg-slate-50 flex flex-col gap-4">
            {report.imageUrl && (
              <div>
                <p className="text-xs font-bold text-purple-600 uppercase tracking-wider mb-2">📸 Photo Evidence from Resident</p>
                <div className="w-full rounded-2xl overflow-hidden border-2 border-purple-200 shadow-md" style={{ maxHeight: 280 }}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={report.imageUrl} alt="Evidence" className="w-full object-cover" style={{ maxHeight: 280 }} />
                </div>
              </div>
            )}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Date</p>
                <p className="text-sm font-medium text-slate-800">{new Date(report.timestamp).toLocaleString()}</p>
              </div>
              <div>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Contact</p>
                <p className="text-sm font-medium text-slate-800">{report.reporterEmail || "Not provided"}</p>
              </div>
            </div>
            {report.description && (
              <div>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Description</p>
                <p className="text-sm text-slate-700 mt-1 bg-white p-3 rounded-xl border border-slate-100">{report.description}</p>
              </div>
            )}
            <div>
              <div className="flex items-center gap-2 mb-2">
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Location Map</p>
                {!report.location && <span className="text-[10px] bg-rose-100 text-rose-600 px-2 py-0.5 rounded-full font-bold">GPS Missing</span>}
              </div>
              <MiniMap lat={report.location?.lat || 15.4589} lng={report.location?.lng || 75.0078} />
              <div className="mt-3">
                <a href={`https://www.google.com/maps?q=${report.location?.lat || 15.4589},${report.location?.lng || 75.0078}`}
                  target="_blank" rel="noreferrer" onClick={e => e.stopPropagation()}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold bg-indigo-50 text-indigo-600 hover:bg-indigo-100 transition">
                  <MapPin className="w-4 h-4" /> Open in Google Maps <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            </div>
            {report.status === "Pending" && (
              <div className="flex gap-2 w-full pt-4 border-t border-slate-200">
                <button onClick={e => handleAction(report._id, "verify", e)}
                  className="flex-1 bg-emerald-600 text-white text-sm font-bold py-3 px-4 rounded-xl hover:bg-emerald-700 transition">
                  ✅ Mark Resolved
                </button>
                <button onClick={e => handleAction(report._id, "flag", e)}
                  className="flex-1 bg-rose-500 text-white text-sm font-bold py-3 px-4 rounded-xl hover:bg-rose-600 transition">
                  🚩 Flag Issue
                </button>
              </div>
            )}
            <button onClick={e => handleDeleteReport(report._id, e)}
              className="w-full mt-2 flex items-center justify-center gap-2 py-3 px-4 bg-slate-100 hover:bg-rose-50 border border-slate-200 hover:border-rose-200 text-slate-600 hover:text-rose-600 font-bold text-sm rounded-xl transition-all">
              <Trash2 className="w-4 h-4" /> Remove Issue Report
            </button>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="flex flex-col gap-6 w-full animate-fade-in pb-16">
      {/* Header */}
      <div className="text-center mb-2 mt-6">
        <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 flex items-center justify-center gap-2">
          <LayoutList className="w-8 h-8 text-emerald-600" /> Admin Dashboard
        </h1>
        <p className="text-slate-500 mt-1 font-medium">EcoLedger — Dharwad Smart Civic System</p>
      </div>

      {/* Tab Navigation */}
      <div className="flex gap-2 bg-slate-100 p-1.5 rounded-2xl">
        <button onClick={() => setActiveTab("reports")}
          className={`flex-1 py-2.5 rounded-xl text-sm font-bold transition-all flex items-center justify-center gap-2 ${
            activeTab === "reports" ? "bg-white shadow text-emerald-700" : "text-slate-500 hover:text-slate-700"}`}>
          <Activity className="w-4 h-4" /> Reports
        </button>
        <button onClick={() => setActiveTab("community")}
          className={`flex-1 py-2.5 rounded-xl text-sm font-bold transition-all flex items-center justify-center gap-2 ${
            activeTab === "community" ? "bg-white shadow text-indigo-700" : "text-slate-500 hover:text-slate-700"}`}>
          <Users className="w-4 h-4" /> Community
          {totalResidents > 0 && <span className="bg-indigo-100 text-indigo-600 text-[10px] font-black px-1.5 py-0.5 rounded-full">{totalResidents}</span>}
        </button>
        <button onClick={() => setActiveTab("voice")}
          className={`flex-1 py-2.5 rounded-xl text-sm font-bold transition-all flex items-center justify-center gap-2 ${
            activeTab === "voice" ? "bg-white shadow text-amber-700" : "text-slate-500 hover:bg-slate-700"}`}>
          <Mic className="w-4 h-4" /> Voice
          {voiceReports.length > 0 && <span className="bg-amber-100 text-amber-600 text-[10px] font-black px-1.5 py-0.5 rounded-full">{voiceReports.length}</span>}
        </button>
      </div>

      {/* ── REPORTS TAB ─────────────────────────────────────────────────────── */}
      {activeTab === "reports" && (
        <>
          {/* Analytics */}
          <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100 flex flex-col gap-6">
            <div className="flex items-center gap-2 border-b border-slate-100 pb-2">
              <Activity className="w-5 h-5 text-indigo-500" />
              <h2 className="text-lg font-bold text-slate-800">Overview Analytics</h2>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-slate-50 rounded-2xl p-4 flex flex-col items-center border border-slate-100">
                <h3 className="text-3xl font-black text-slate-800">{pendingCount}</h3>
                <p className="text-[10px] text-slate-400 uppercase tracking-widest font-bold mt-1">Pending</p>
              </div>
              <div className="bg-emerald-50 rounded-2xl p-4 flex flex-col items-center border border-emerald-100">
                <h3 className="text-3xl font-black text-emerald-600">{resolvedCount}</h3>
                <p className="text-[10px] text-emerald-500 uppercase tracking-widest font-bold mt-1">Resolved</p>
              </div>
            </div>
            {reports.length > 0 && isMounted && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Pie Chart */}
                <div className="w-full flex flex-col min-w-0">
                  <p className="text-xs font-bold text-slate-400 uppercase mb-2 text-center">Issue Distribution</p>
                  <div className="w-full">
                    <ResponsiveContainer width="100%" aspect={2} debounce={300}>
                      <PieChart>
                        <Pie data={pieData} cx="50%" cy="50%" innerRadius={40} outerRadius={70} paddingAngle={5} dataKey="value">
                          {pieData.map((e, i) => <Cell key={i} fill={e.color} />)}
                        </Pie>
                        <RechartsTooltip contentStyle={{ borderRadius: "12px", border: "none", boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)" }} />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </div>
                {/* Bar Chart */}
                <div className="w-full flex flex-col min-w-0">
                  <p className="text-xs font-bold text-slate-400 uppercase mb-2 text-center">7-Day Activity</p>
                  <div className="w-full">
                    <ResponsiveContainer width="100%" aspect={2} debounce={300}>
                      <BarChart data={barData}>
                        <XAxis dataKey="name" tick={{ fontSize: 10 }} axisLine={false} tickLine={false} />
                        <RechartsTooltip cursor={{ fill: "#f8fafc" }} contentStyle={{ borderRadius: "12px", border: "none", boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)" }} />
                        <Bar dataKey="Reports" fill="#10b981" radius={[4, 4, 0, 0]} barSize={20} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Report Lists */}
          {[
            { title: "Water Issues",    icon: Droplet, items: waterReports,    color: "text-sky-600" },
            { title: "Garbage Issues",  icon: Trash2,  items: garbageReports,  color: "text-stone-600" },
            { title: "Material Waste",  icon: Box,     items: materialReports, color: "text-amber-600" },
          ].map(({ title, icon: Icon, items, color }) => (
            <div key={title} className="mt-2">
              <h2 className={`text-xl font-extrabold flex items-center gap-2 mb-3 ${color}`}>
                <Icon className="w-5 h-5" /> {title} ({items.length})
              </h2>
              <div className="flex flex-col gap-3">
                {items.length === 0
                  ? <p className="text-slate-500 italic bg-white p-4 rounded-2xl border border-slate-100">No {title.toLowerCase()} reported yet.</p>
                  : items.map(r => <ReportCard key={r._id} report={r} />)
                }
              </div>
            </div>
          ))}
        </>
      )}

      {/* ── COMMUNITY TAB ───────────────────────────────────────────────────── */}
      {activeTab === "community" && (
        <div className="flex flex-col gap-4">
          {/* Summary Stats */}
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-indigo-600 rounded-3xl p-5 text-white flex flex-col">
              <p className="text-xs font-bold text-indigo-200 uppercase tracking-widest">Registered Residents</p>
              <p className="text-4xl font-black mt-1">{totalResidents}</p>
              <p className="text-xs text-indigo-200 mt-1">households</p>
            </div>
            <div className="bg-emerald-600 rounded-3xl p-5 text-white flex flex-col">
              <p className="text-xs font-bold text-emerald-200 uppercase tracking-widest">Total Community</p>
              <p className="text-4xl font-black mt-1">{totalFamily}</p>
              <p className="text-xs text-emerald-200 mt-1">family members</p>
            </div>
          </div>

          {/* Gender Summary */}
          <div className="grid grid-cols-3 gap-2">
            {[
              { label: "Male",   count: totalMale,   emoji: "👨", color: "bg-sky-50 border-sky-100 text-sky-700" },
              { label: "Female", count: totalFemale, emoji: "👩", color: "bg-rose-50 border-rose-100 text-rose-700" },
              { label: "Other",  count: totalFamily - totalMale - totalFemale, emoji: "🧑", color: "bg-purple-50 border-purple-100 text-purple-700" },
            ].map(({ label, count, emoji, color }) => (
              <div key={label} className={`rounded-2xl p-3 border flex flex-col items-center gap-1 ${color}`}>
                <span className="text-xl">{emoji}</span>
                <p className="text-lg font-black">{count}</p>
                <p className="text-[10px] font-bold uppercase">{label}</p>
              </div>
            ))}
          </div>

          {/* Search + Refresh + Sort */}
          <div className="flex flex-col gap-3">
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search by name, house no. or email..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-white border border-slate-200 rounded-2xl text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                />
              </div>
              <button
                onClick={fetchResidents}
                disabled={residentsLoading}
                className="px-4 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl font-bold text-sm transition disabled:opacity-50 flex items-center gap-2"
              >
                {residentsLoading ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : "🔄"}
              </button>
            </div>
            
            <div className="flex gap-2 bg-slate-100 p-1 rounded-xl">
              <button 
                onClick={() => setCommunitySort("house")}
                className={`flex-1 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${communitySort === 'house' ? 'bg-white shadow-sm text-indigo-700' : 'text-slate-400'}`}
              >
                🔢 Sort by House
              </button>
              <button 
                onClick={() => setCommunitySort("score")}
                className={`flex-1 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${communitySort === 'score' ? 'bg-white shadow-sm text-amber-600' : 'text-slate-400'}`}
              >
                🏆 Sort by Score
              </button>
            </div>
          </div>

          {/* Residents List */}
          {residentsLoading ? (
            <div className="flex flex-col gap-3">
              {[1,2,3].map(i => <div key={i} className="h-28 bg-slate-100 animate-pulse rounded-3xl" />)}
            </div>
          ) : filteredResidents.length === 0 ? (
            <div className="bg-white rounded-3xl p-10 text-center border border-slate-100 flex flex-col items-center gap-3">
              <Users className="w-12 h-12 text-slate-200" />
              <p className="text-slate-700 font-bold">No residents found.</p>
              <p className="text-slate-400 text-sm">
                {searchQuery ? "Try a different search term." : "No resident accounts have been registered yet. Ask residents to sign up at /signup."}
              </p>
              {!searchQuery && (
                <button onClick={fetchResidents}
                  className="mt-2 px-4 py-2 bg-indigo-600 text-white text-sm font-bold rounded-xl hover:bg-indigo-700 transition">
                  🔄 Refresh
                </button>
              )}
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              <p className="text-xs text-slate-400 font-bold ml-2 uppercase tracking-widest">
                {filteredResidents.length} household{filteredResidents.length !== 1 ? "s" : ""} &middot; {communitySort === 'score' ? 'Ranked by XP' : 'Sorted by House No.'}
              </p>
              {filteredResidents.map((resident) => {
                const isOpen = expandedId === resident._id;
                const male   = resident.familyGenders?.male   || 0;
                const female = resident.familyGenders?.female || 0;
                const other  = resident.familyGenders?.other  || 0;
                const total  = resident.familySize || (male + female + other) || 0;

                return (
                  <div key={resident._id}
                    className={`bg-white rounded-3xl border shadow-sm overflow-hidden transition-all ${
                      isOpen ? "border-indigo-400 shadow-indigo-100" : "border-slate-100"
                    }`}
                  >
                    {/* ── Card Header (always visible) ── */}
                    <button
                      type="button"
                      onClick={() => setExpandedId(isOpen ? null : resident._id)}
                      className="w-full p-4 flex items-center gap-4 hover:bg-slate-50 transition-colors text-left"
                    >
                      {/* House No badge */}
                      <div className="flex-shrink-0 w-14 h-14 bg-indigo-600 rounded-2xl flex flex-col items-center justify-center shadow-md shadow-indigo-200">
                        <Home className="w-4 h-4 text-indigo-200 mb-0.5" />
                        <span className="text-xs font-black text-white leading-tight text-center px-1">
                          {resident.houseNumber || "—"}
                        </span>
                      </div>

                      {/* Name + contact */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="font-black text-slate-800">{resident.name}</h3>
                          <span className="text-[10px] bg-slate-100 text-slate-500 font-bold px-2 py-0.5 rounded-full">Family Head</span>
                          {(resident.trustScore || 0) > 0 && (
                            <span className="text-[10px] bg-amber-100 text-amber-700 font-black px-1.5 py-0.5 rounded-full flex items-center gap-0.5">
                              <Star className="w-2.5 h-2.5" /> {resident.trustScore} XP
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-slate-500 truncate mt-0.5">
                          <Mail className="w-3 h-3 inline mr-1" />{resident.email}
                        </p>
                        {resident.phone && (
                          <p className="text-xs text-slate-400 mt-0.5">
                            <Phone className="w-3 h-3 inline mr-1" />{resident.phone}
                          </p>
                        )}
                      </div>

                      {/* Family size + chevron */}
                      <div className="flex-shrink-0 flex flex-col items-end gap-1">
                        <div className="bg-indigo-50 rounded-xl px-3 py-1 text-center">
                          <p className="text-xl font-black text-indigo-700">{total}</p>
                          <p className="text-[9px] text-indigo-400 font-bold uppercase">members</p>
                        </div>
                        {isOpen
                          ? <ChevronUp className="w-4 h-4 text-slate-400" />
                          : <ChevronDown className="w-4 h-4 text-slate-400" />
                        }
                      </div>
                    </button>

                    {/* ── Expanded Detail Panel ── */}
                    {isOpen && (
                      <div className="border-t border-slate-100 bg-slate-50 p-4 flex flex-col gap-4">

                        {/* House Details grid */}
                        <div className="grid grid-cols-2 gap-3">
                          <div className="bg-white rounded-2xl p-3 border border-slate-100">
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">House / Flat No.</p>
                            <p className="text-base font-black text-slate-800 mt-1">{resident.houseNumber || "Not provided"}</p>
                          </div>
                          <div className="bg-white rounded-2xl p-3 border border-slate-100">
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Total Family Size</p>
                            <p className="text-base font-black text-slate-800 mt-1">{total} members</p>
                          </div>
                          <div className="bg-white rounded-2xl p-3 border border-slate-100">
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Member Since</p>
                            <p className="text-sm font-bold text-slate-700 mt-1">
                              {resident.createdAt ? new Date(resident.createdAt).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }) : "—"}
                            </p>
                          </div>
                          <div className="bg-white rounded-2xl p-3 border border-slate-100">
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Eco Trust Score</p>
                            <p className="text-base font-black text-amber-600 mt-1">⭐ {resident.trustScore || 0} XP</p>
                          </div>
                        </div>

                        {/* Gender Breakdown */}
                        <div className="bg-white rounded-2xl p-4 border border-slate-100">
                          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-3">Family Gender Breakdown</p>
                          <div className="grid grid-cols-3 gap-2 mb-3">
                            <div className="flex flex-col items-center bg-sky-50 rounded-xl p-2 border border-sky-100">
                              <span className="text-2xl">👨</span>
                              <p className="text-lg font-black text-sky-700">{male}</p>
                              <p className="text-[10px] font-bold text-sky-500">Male</p>
                            </div>
                            <div className="flex flex-col items-center bg-rose-50 rounded-xl p-2 border border-rose-100">
                              <span className="text-2xl">👩</span>
                              <p className="text-lg font-black text-rose-600">{female}</p>
                              <p className="text-[10px] font-bold text-rose-400">Female</p>
                            </div>
                            <div className="flex flex-col items-center bg-purple-50 rounded-xl p-2 border border-purple-100">
                              <span className="text-2xl">🧑</span>
                              <p className="text-lg font-black text-purple-600">{other}</p>
                              <p className="text-[10px] font-bold text-purple-400">Other</p>
                            </div>
                          </div>
                          {/* Proportion bar */}
                          {total > 0 && (
                            <div className="h-3 w-full rounded-full flex overflow-hidden bg-slate-100">
                              {male > 0 && <div className="bg-sky-400 h-full" style={{width:`${(male/total)*100}%`}} />}
                              {female > 0 && <div className="bg-rose-400 h-full" style={{width:`${(female/total)*100}%`}} />}
                              {other > 0 && <div className="bg-purple-400 h-full" style={{width:`${(other/total)*100}%`}} />}
                            </div>
                          )}
                        </div>

                        {/* Contact */}
                        <div className="bg-white rounded-2xl p-4 border border-slate-100 flex flex-col gap-2">
                          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Contact Details</p>
                          <a href={`mailto:${resident.email}`}
                            className="flex items-center gap-2 text-sm text-indigo-600 font-semibold hover:underline">
                            <Mail className="w-4 h-4" /> {resident.email}
                          </a>
                          {resident.phone ? (
                            <a href={`tel:${resident.phone}`}
                              className="flex items-center gap-2 text-sm text-emerald-600 font-semibold hover:underline">
                              <Phone className="w-4 h-4" /> {resident.phone}
                            </a>
                          ) : (
                            <p className="text-xs text-slate-400">No phone number provided</p>
                          )}
                        </div>

                        {/* Remove Button */}
                        <button
                          onClick={() => handleRemoveResident(resident)}
                          className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-600 font-black text-sm rounded-2xl transition-all active:scale-95"
                        >
                          <UserX className="w-4 h-4" />
                          Remove Household from Registry
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
      {/* ── VOICE TAB ───────────────────────────────────────────────────────── */}
      {activeTab === "voice" && (
        <div className="w-full flex flex-col gap-6 animate-fade-in">
          <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100">
            <div className="flex items-center gap-3 border-b border-slate-50 pb-4 mb-4">
              <div className="p-2 bg-amber-100 rounded-xl text-amber-600">
                <Volume2 className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-xl font-black text-slate-800">IVR Voice Reports</h2>
                <p className="text-sm text-slate-500 font-medium">Reports received via automated phone calls</p>
              </div>
            </div>

            {voiceLoading ? (
              <div className="flex justify-center py-10"><Loader2 className="w-8 h-8 animate-spin text-amber-500" /></div>
            ) : (voiceReports.length === 0 && passthruRequests.length === 0) ? (
              <div className="text-center py-10 text-slate-400 italic">No voice reports received yet.</div>
            ) : (
              <div className="flex flex-col gap-6">
                {/* Manual Voice Reports (House Number based) */}
                {voiceReports.length > 0 && (
                  <div className="flex flex-col gap-3">
                    <p className="text-xs font-black text-slate-400 uppercase tracking-widest ml-2">Manual Issue Reports</p>
                    {voiceReports.map(report => (
                      <div key={report._id} className="bg-slate-50 p-4 rounded-2xl border border-slate-100 flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center shadow-sm text-lg font-black text-slate-700 border border-slate-100">
                            {report.houseNumber}
                          </div>
                          <div>
                            <h3 className="font-bold text-slate-800">{report.issueType}</h3>
                            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">{new Date(report.timestamp).toLocaleString()}</p>
                          </div>
                        </div>
                        <div className="flex flex-col items-end gap-1">
                          <span className="text-[10px] bg-amber-100 text-amber-700 font-black px-2 py-0.5 rounded-full uppercase">📞 Voice Log</span>
                          <p className="text-[9px] text-slate-300 font-mono">SID: {report.callSid?.substring(0, 8)}...</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Passthru Requests (Menu based) */}
                {passthruRequests.length > 0 && (
                  <div className="flex flex-col gap-3">
                    <p className="text-xs font-black text-slate-400 uppercase tracking-widest ml-2">Menu Passthru Requests (Exotel/Twilio)</p>
                    {passthruRequests.map(req => (
                      <div key={req._id} className="bg-indigo-50/50 p-4 rounded-2xl border border-indigo-100 flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center shadow-sm text-lg font-black text-indigo-700 border border-indigo-100">
                            {req.inputDigit}
                          </div>
                          <div>
                            <h3 className="font-bold text-slate-800 uppercase">Request for {req.type}</h3>
                            <p className="text-[10px] text-slate-400 font-bold tracking-widest flex items-center gap-1.5">
                              <Phone className="w-3 h-3" /> {req.phone}
                            </p>
                          </div>
                        </div>
                        <div className="flex flex-col items-end gap-1">
                          <span className="text-[10px] bg-indigo-100 text-indigo-700 font-black px-2 py-0.5 rounded-full uppercase">⚡ Menu Input</span>
                          <p className="text-[10px] text-slate-400 font-bold uppercase">{new Date(req.timestamp).toLocaleString()}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
