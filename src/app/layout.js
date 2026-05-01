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
  themeColor: "#1e40af", // Official navy blue
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
      <body
        suppressHydrationWarning
        className="bg-slate-50 text-slate-900 h-screen flex flex-col overflow-hidden selection:bg-primary/20"
      >
        <AuthProvider>
          <I18nProvider>
            <UIProvider>
              <Suspense fallback={null}>
                <NavigationProgressBar />
              </Suspense>



              {/* --- UNIFIED DEDICATED NAVBAR --- */}
              <Header />

              {/* Main Wrapper */}
              <div className="flex-1 flex overflow-hidden relative">
                {/* Sidebar */}
                <Sidebar />

                {/* Main Content Area */}
                <main className="flex-1 overflow-y-auto bg-white scroll-smooth flex flex-col">
                  {/* Content Wrapper */}
                  <div className="flex-1 flex flex-col">
                    {children}
                  </div>

                  {/* Global Footer */}
                  <footer className="w-full border-t border-slate-100 bg-white px-6 md:px-10 py-12 shrink-0">
                    <Footer />
                  </footer>
                </main>
              </div>

            </UIProvider>
          </I18nProvider>
        </AuthProvider>
      </body>
    </html>
  );
}