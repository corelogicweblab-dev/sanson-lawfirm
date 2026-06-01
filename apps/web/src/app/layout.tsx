import type { Metadata } from "next";
import { Lato, Montserrat } from "next/font/google";
import { AppProviders } from "@/components/providers/app-providers";
import "./globals.css";

const montserrat = Montserrat({
  variable: "--font-montserrat",
  subsets: ["latin"],
  weight: ["600", "700", "800"],
});

const lato = Lato({
  variable: "--font-lato",
  subsets: ["latin"],
  weight: ["400", "700"],
});

export const metadata: Metadata = {
  title: "SANSON Legal OS",
  description: "AI-Powered Premium Legal Operating System for SANSON Law Firm",
  metadataBase: new URL("https://sansonlawfirm.web.app"),
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "SANSON Legal OS",
  },
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  themeColor: "#EC4899",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${montserrat.variable} ${lato.variable} h-full`}>
      <head>
        <link rel="preconnect" href="https://sanson-lawfirm.onrender.com" crossOrigin="anonymous" />
        <link rel="dns-prefetch" href="https://sanson-lawfirm.onrender.com" />
      </head>
      <body className="min-h-full antialiased">
        <AppProviders>{children}</AppProviders>
      </body>
    </html>
  );
}
