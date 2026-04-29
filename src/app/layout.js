import { Inter } from "next/font/google";
import AuthProvider from "../components/AuthProvider";
import Navigation from "../components/Navigation";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

export const viewport = {
  themeColor: "#10b981",
  width: "device-width",
  initialScale: 1,
  minimumScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
};

export const metadata = {
  title: "EcoLedger",
  description: "Offline-first resource reporting PWA",
  manifest: "/manifest.json",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={inter.variable}>
      <body suppressHydrationWarning className="bg-slate-50 text-slate-900 min-h-screen flex flex-col">
        <AuthProvider>
          <Navigation />
          <main className="flex-1 p-4 max-w-2xl mx-auto w-full">
            {children}
          </main>
        </AuthProvider>
      </body>
    </html>
  );
}
