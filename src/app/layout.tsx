import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Navigation from '@/app/navigation';
import AuthNav from '@/app/nav';
import Providers from '@/app/providers';

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "提示词管理工具",
  description: "管理和分享你的 AI 提示词",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;  
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <Providers>
          <header className="border-b bg-white">
            <div className="max-w-full flex items-center justify-between h-14 md:h-12 px-3 md:px-4">
              <Navigation />
              <div className="flex items-center gap-2 md:gap-4">
                <AuthNav />
              </div>
            </div>
          </header>
          <main className="h-[calc(100vh-3.5rem)] md:h-[calc(100vh-3rem)]">{children}</main>
        </Providers>
      </body>
    </html>
  );
}
