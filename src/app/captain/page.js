"use client";

import { useState, useEffect } from "react";
import { Check, X, ShieldAlert } from "lucide-react";

export default function CaptainPage() {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchReports();
  }, []);

  const fetchReports = async () => {
    try {
      const res = await fetch("/api/reports?status=pending");
      const data = await res.json();
      setReports(data.reports || []);
    } catch (error) {
      console.error("Failed to fetch reports", error);
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async (id, action) => {
    try {
      await fetch("/api/reports/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reportId: id, action }),
      });
      // Remove from list
      setReports((prev) => prev.filter((r) => r._id !== id));
    } catch (error) {
      console.error("Verification failed", error);
    }
  };

  if (loading) {
    return <div className="text-center mt-12 text-slate-500 font-medium">Loading pending reports...</div>;
  }

  return (
    <div className="flex flex-col gap-6 w-full animate-fade-in pb-16">
      <div className="text-center mb-2 mt-6">
        <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 flex items-center justify-center gap-2">
          <ShieldAlert className="w-8 h-8 text-emerald-600" />
          Verification
        </h1>
        <p className="text-slate-500 mt-2 font-medium">Review community reports.</p>
      </div>

      {reports.length === 0 ? (
        <div className="bg-white rounded-3xl p-8 text-center shadow-sm border border-slate-100">
          <p className="text-slate-500 font-medium">All caught up! No pending reports.</p>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {reports.map((report) => (
            <div key={report._id} className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100 flex items-center justify-between">
              <div>
                <span className="uppercase text-xs font-bold tracking-wider text-slate-400">
                  {new Date(report.timestamp).toLocaleDateString()}
                </span>
                <h3 className="text-lg font-bold capitalize text-slate-800 mt-1">{report.type} Usage</h3>
                <p className="text-slate-500 text-sm">Amount: {report.amount} units</p>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => handleVerify(report._id, "verify")}
                  className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center hover:bg-emerald-200 transition-colors active:scale-95"
                >
                  <Check className="w-6 h-6" />
                </button>
                <button
                  onClick={() => handleVerify(report._id, "flag")}
                  className="w-12 h-12 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center hover:bg-rose-200 transition-colors active:scale-95"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
