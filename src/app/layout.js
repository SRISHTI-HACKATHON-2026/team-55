import { Inter } from "next/font/google";
import AuthProvider from "../components/AuthProvider";
import Sidebar from "../components/Sidebar";
import Header from "../components/Header";
import Footer from "../components/Footer";
import { UIProvider } from "../components/UIProvider";
import I18nProvider from "../components/I18nProvider";
import "./globals.css";
import { ShieldCheck } from "lucide-react"; 
import NavigationProgressBar from "../components/NavigationProgressBar";
import { Suspense } from "react";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: 'swap',
});

export const viewport = {
  themeColor: "#064e3b", // Official deep forest green
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export const metadata = {
  title: "EcoLedger | Official Resource Reporting Portal",
  description: "Official government-standard resource management and sustainability tracking.",
  manifest: "/manifest.json",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={`${inter.variable} antialiased`}>
      {/* Professional Gov Aesthetic: 
        - High contrast (bg-slate-50 vs white)
        - Sharp edges (rounded-md instead of rounded-2xl)
        - Clear grid borders
      */}
      <body
        suppressHydrationWarning
        className="bg-slate-50 text-slate-900 h-screen flex overflow-hidden selection:bg-emerald-200"
      >
        <AuthProvider>
          <I18nProvider>
            <UIProvider>
              <Suspense fallback={null}>
                <NavigationProgressBar />
              </Suspense>

              {/* --- OFFICIAL TOP BANNER --- */}
              {/* This mimics the "An official website of the government" banner for authority */}
              <div className="fixed top-0 left-0 w-full h-7 bg-slate-100 border-b border-slate-200 z-[60] flex items-center px-4">
                <div className="flex items-center gap-2 text-[10px] uppercase tracking-widest font-bold text-slate-500">
                  <ShieldCheck className="w-3 h-3" />
                  Official EcoLedger Institutional Portal
                </div>
              </div>

              {/* Sidebar: Now with a more formal, slightly wider footprint */}
              <aside className="mt-7 border-r border-slate-200 bg-white shadow-sm z-50">
                <Sidebar />
              </aside>

              <div className="flex-1 flex flex-col min-w-0 mt-7 overflow-hidden">
                {/* Header: Clean, white, focused on utility */}
                <header className="bg-white border-b border-slate-200 h-16 flex items-center shrink-0">
                  <Header />
                </header>

                {/* Main Scrollable Content */}
                <main className="flex-1 overflow-y-auto bg-slate-50/50">
                  {/* Container uses more formal spacing (p-8) and standard widths */}
                  <div className="max-w-screen-2xl mx-auto w-full p-6 lg:p-10 flex flex-col min-h-full">

                    {/* Content Wrapper */}
                    <div className="flex-1 flex flex-col animate-in fade-in slide-in-from-bottom-2 duration-700">
                      {children}
                    </div>

                    {/* Footer: Styled with more formal alignment and clear divisions */}
                    <footer className="mt-12 pt-8 border-t border-slate-200">
                      <Footer />
                    </footer>
                  </div>
                </main>
              </div>

            </UIProvider>
          </I18nProvider>
        </AuthProvider>
      </body>
    </html>
  );
}