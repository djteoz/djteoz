import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";

import "./globals.css";
import Navbar from "../components/Navbar";
import Sidebar from "../components/Sidebar";
import { ToastProvider } from "../components/Toast";
import PageLoader from "../components/PageLoader";
import { TokenRefreshProvider } from "../components/TokenRefreshProvider";
import { FetchInterceptor } from "../components/FetchInterceptor";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Lumina Social v2.0",
  description: "Connect, Share, Shine.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ru">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-gray-50 text-gray-900 min-h-screen`}
      >
        <FetchInterceptor />
        <TokenRefreshProvider>
          <ToastProvider>
            <PageLoader />
            <Navbar />
            <div className="max-w-7xl mx-auto flex gap-6 px-4">
              <Sidebar />
              <main className="flex-1 min-w-0 py-6">{children}</main>
            </div>
          </ToastProvider>
        </TokenRefreshProvider>
      </body>
    </html>
  );
}
