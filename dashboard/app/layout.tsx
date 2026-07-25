import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const jetbrains = JetBrains_Mono({
  variable: "--font-jetbrains",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Triage | OTel-Powered Blue Team SOC",
  description:
    "Real-time Blue Team SOC and Threat Intel Dashboard powered by SigNoz and Supabase",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${inter.variable} ${jetbrains.variable} min-h-screen dark`}
    >
      <body className="relative min-h-screen bg-[var(--background)] font-sans text-[var(--foreground)] antialiased selection:bg-[#0ff]/30 selection:text-[#0ff]">
        
        {/* Animated Background Orbs */}
        <div className="pointer-events-none fixed inset-0 z-[-1] overflow-hidden">
          <div className="absolute top-[-10%] left-[-10%] h-[50vh] w-[50vw] animate-orb-float-1 rounded-full bg-[var(--orb-1)] blur-[100px]" />
          <div className="absolute bottom-[-20%] right-[-10%] h-[60vh] w-[60vw] animate-orb-float-2 rounded-full bg-[var(--orb-2)] blur-[120px]" />
          <div className="absolute top-[40%] left-[30%] h-[40vh] w-[40vw] animate-orb-float-3 rounded-full bg-[var(--orb-3)] blur-[90px]" />
        </div>

        {/* Dynamic Glass Content Container */}
        <div className="relative z-0 h-full w-full">
          {children}
        </div>
      </body>
    </html>
  );
}
