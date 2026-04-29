"use client";

import { createContext, useContext, useState, useEffect } from "react";
import { useSession } from "next-auth/react";

const UIContext = createContext();

export function UIProvider({ children }) {
  const { data: session } = useSession();
  const [activeTab, setActiveTab] = useState("");

  // Set default tab based on role when session loads
  useEffect(() => {
    if (session && !activeTab) {
      setActiveTab(session.user.role === "admin" ? "reports" : "report");
    }
  }, [session, activeTab]);

  return (
    <UIContext.Provider value={{ activeTab, setActiveTab }}>
      {children}
    </UIContext.Provider>
  );
}

export const useUI = () => useContext(UIContext);
