"use client";

import { createContext, useContext, useState, useEffect, Suspense } from "react";
import { useSession } from "next-auth/react";
import { useSearchParams } from "next/navigation";

const UIContext = createContext();

// Cross-tab notification sync
let notificationChannel;
if (typeof window !== "undefined") {
  notificationChannel = new BroadcastChannel("ecoledger_notifications");
}

function UITabSyncer({ activeTab, setActiveTab, session }) {
  const searchParams = useSearchParams();

  useEffect(() => {
    const tabFromUrl = searchParams.get("tab");
    if (tabFromUrl) {
      if (tabFromUrl !== activeTab) {
        setActiveTab(tabFromUrl);
      }
    } else if (session && !activeTab) {
      // Set default tab if none in URL
      setActiveTab(session.user.role === "admin" ? "reports" : "report");
    }
  }, [searchParams, activeTab, setActiveTab, session]);

  return null;
}

export function UIProvider({ children }) {
  const { data: session } = useSession();
  const [activeTab, setActiveTab] = useState("");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [notifications, setNotifications] = useState([
    {
      id: 1,
      title: "Welcome to EcoLedger",
      message: "Start reporting local issues to earn trust points!",
      type: "info",
      timestamp: new Date().toISOString(),
      read: false
    }
  ]);

  useEffect(() => {
    if (notificationChannel) {
      notificationChannel.onmessage = (event) => {
        addNotification(event.data);
      };
    }
  }, []);

  const addNotification = (notif) => {
    const newNotif = {
      id: Date.now(),
      timestamp: new Date().toISOString(),
      read: false,
      ...notif
    };
    setNotifications(prev => [newNotif, ...prev]);
    
    // Broadcast to other tabs if this was triggered locally (not from another tab)
    if (notif.broadcast !== false && notificationChannel) {
      notificationChannel.postMessage({ ...newNotif, broadcast: false });
    }
  };

  const markAllRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

  return (
    <UIContext.Provider value={{ 
      activeTab, setActiveTab, 
      sidebarOpen, setSidebarOpen, 
      sidebarCollapsed, setSidebarCollapsed,
      notifications, addNotification, markAllRead
    }}>
      <Suspense fallback={null}>
        <UITabSyncer activeTab={activeTab} setActiveTab={setActiveTab} session={session} />
      </Suspense>
      {children}
    </UIContext.Provider>
  );
}

export const useUI = () => useContext(UIContext);
