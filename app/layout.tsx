import type { Metadata, Viewport } from "next";
import { AppShell } from "@/components/AppShell";
import { MobileAppShell } from "@/components/layout/MobileAppShell";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "Lexienn",
    template: "%s | Lexienn",
  },
  description:
    "AI dictionary, translator, offline phrase packs, voice, and camera translation.",
  applicationName: "Lexienn",
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Lexienn",
  },
  icons: {
    icon: [
      { url: "/favicon.png", sizes: "32x32", type: "image/png" },
      { url: "/icons/icon-192x192.png", sizes: "192x192", type: "image/png" },
      { url: "/icons/icon-512x512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [{ url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" }],
  },
};

export const viewport: Viewport = {
  themeColor: "#163a63",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">
        <a href="#main-content" className="skip-link">
          Skip to main content
        </a>
        <AppShell>
          <MobileAppShell>{children}</MobileAppShell>
        </AppShell>
      </body>
    </html>
  );
}
