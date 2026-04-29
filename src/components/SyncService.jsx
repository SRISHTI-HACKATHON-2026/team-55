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
      syncAllData();
    };
    const handleOffline = () => setIsOnline(false);

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    // Initial sync if online
    if (navigator.onLine) {
      syncAllData();
    }

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  const syncAllData = async () => {
    if (isSyncing) return;
    setIsSyncing(true);

    try {
      // 1. Sync Reports
      await syncTable("reports", "/api/reports", (data) => ({ reports: data }));
      
      // 2. Sync Water Usage
      await syncTable("water_usage", "/api/water-usage/sync", (data) => ({ logs: data }));
      
      // 3. Sync Electricity Usage
      await syncTable("electricity_usage", "/api/electricity-usage/sync", (data) => ({ logs: data }));

    } catch (error) {
      console.error("Global Sync failed", error);
    } finally {
      setIsSyncing(false);
    }
  };

  const syncTable = async (tableName, endpoint, formatBody) => {
    try {
      const pendingItems = await db[tableName].where("synced").equals(0).toArray();
      
      if (pendingItems.length === 0) return;

      console.log(`Syncing ${pendingItems.length} items for ${tableName}...`);

      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formatBody(pendingItems)),
      });

      if (response.ok) {
        const ids = pendingItems.map((item) => item.id);
        await db[tableName].bulkUpdate(
          ids.map(id => ({ key: id, changes: { synced: 1 } }))
        );
        console.log(`Successfully synced ${tableName}`);
      } else {
        console.warn(`Failed to sync ${tableName}: ${response.statusText}`);
      }
    } catch (err) {
      console.error(`Error syncing ${tableName}:`, err);
    }
  };

  if (!isOnline) {
    return (
      <div className="fixed bottom-4 right-4 bg-amber-100 text-amber-800 px-4 py-2 rounded-full shadow-lg flex items-center gap-2 text-sm font-semibold z-50 animate-pulse">
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
