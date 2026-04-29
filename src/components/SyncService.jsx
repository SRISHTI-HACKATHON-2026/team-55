"use client";

import { useEffect, useState } from "react";
import { db } from "../lib/db/dexie";
import { CloudOff, CloudUpload } from "lucide-react";

export default function SyncService() {
  const [isOnline, setIsOnline] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);

  useEffect(() => {
    setIsOnline(navigator.onLine);

    const handleOnline = () => {
      setIsOnline(true);
      syncData();
    };
    const handleOffline = () => setIsOnline(false);

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    // Initial sync if online
    if (navigator.onLine) {
      syncData();
    }

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

    const syncData = async () => {
    if (isSyncing) return;
    setIsSyncing(true);

    try {
      const pendingReports = await db.reports.where("synced").equals(0).toArray();
      
      if (pendingReports.length === 0) {
        setIsSyncing(false);
        return;
      }

      const response = await fetch("/api/reports", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reports: pendingReports }),
      });

      if (response.ok) {
        // Mark all as synced in Dexie
        const ids = pendingReports.map((r) => r.id);
        await db.reports.bulkUpdate(
          ids.map(id => ({ key: id, changes: { synced: 1 } }))
        );
      }
    } catch (error) {
      console.error("Sync failed", error);
    } finally {
      setIsSyncing(false);
    }
  };

  if (!isOnline) {
    return (
      <div className="fixed bottom-4 right-4 bg-amber-100 text-amber-800 px-4 py-2 rounded-full shadow-lg flex items-center gap-2 text-sm font-semibold z-50">
        <CloudOff className="w-4 h-4" />
        Offline Mode
      </div>
    );
  }

  if (isSyncing) {
    return (
      <div className="fixed bottom-4 right-4 bg-emerald-100 text-emerald-800 px-4 py-2 rounded-full shadow-lg flex items-center gap-2 text-sm font-semibold z-50">
        <CloudUpload className="w-4 h-4 animate-bounce" />
        Syncing...
      </div>
    );
  }

  return null;
}
