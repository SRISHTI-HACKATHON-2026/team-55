"use client";

import { createContext, useContext, useState, useEffect, Suspense } from "react";
import { useSession } from "next-auth/react";
import { useSearchParams } from "next/navigation";

const UIContext = createContext();

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

  return (
    <UIContext.Provider value={{ activeTab, setActiveTab, sidebarOpen, setSidebarOpen }}>
      <Suspense fallback={null}>
        <UITabSyncer activeTab={activeTab} setActiveTab={setActiveTab} session={session} />
      </Suspense>
      {children}
    </UIContext.Provider>
  );
}

export const useUI = () => useContext(UIContext);
