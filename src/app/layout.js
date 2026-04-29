import { Inter } from "next/font/google";
import AuthProvider from "../components/AuthProvider";
import Sidebar from "../components/Sidebar"; // Redesigned Navigation
import Header from "../components/Header";   // New component for profile/actions
import Footer from "../components/Footer";
import { UIProvider } from "../components/UIProvider";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

export const viewport = {
  themeColor: "#059669", // Deeper professional green
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export const metadata = {
  title: "EcoLedger | Enterprise Resource Reporting",
  description: "Secure, offline-first resource management for modern teams.",
  manifest: "/manifest.json",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={`${inter.variable} antialiased`}>
      <body suppressHydrationWarning className="bg-bg text-text-main h-screen flex overflow-hidden">
        <AuthProvider>
          <UIProvider>
            {/* Desktop Sidebar */}
            <Sidebar />

            <div className="flex-1 flex flex-col min-w-0 bg-bg overflow-hidden">
              {/* Top Navigation / Global Actions */}
              <Header />

              {/* Main Scrollable Content */}
              <main className="flex-1 overflow-y-auto p-6 lg:p-10 flex flex-col">
                <div className="max-w-7xl mx-auto w-full flex-1 flex flex-col animate-in fade-in duration-500">
                  {children}
                  <Footer />
                </div>
              </main>
            </div>
          </UIProvider>
        </AuthProvider>
      </body>
    </html>
  );
}