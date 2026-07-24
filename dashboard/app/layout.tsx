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
      className={`${inter.variable} ${jetbrains.variable} h-full dark`}
    >
      <body className="crt-vignette min-h-full bg-soc-bg font-sans text-zinc-100 antialiased">
        {children}
      </body>
    </html>
  );
}
