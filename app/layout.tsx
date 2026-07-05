import type { Metadata, Viewport } from "next";
import { MobileAppShell } from "@/components/layout/MobileAppShell";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "Lexienn",
    template: "%s | Lexienn",
  },
  description:
    "AI dictionary, translator, offline phrase packs, camera translation, and voice communication",
  applicationName: "Lexienn",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Lexienn",
  },
  icons: {
    icon: [
      { url: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [{ url: "/icons/icon-192.png", sizes: "192x192", type: "image/png" }],
  },
};

export const viewport: Viewport = {
  themeColor: "#1e3a5f",
  width: "device-width",
  initialScale: 1,
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
        <MobileAppShell>{children}</MobileAppShell>
      </body>
    </html>
  );
}
