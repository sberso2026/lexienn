import type { Metadata, Viewport } from "next";
import { AppErrorBoundary } from "@/components/app/AppErrorBoundary";
import { AppShell } from "@/components/AppShell";
import { MobileAppShell } from "@/components/layout/MobileAppShell";
import { withBrandAssetVersion } from "@/lib/brand/brandAssetVersion";
import "./globals.css";

const faviconUrl = withBrandAssetVersion("/favicon.png");
const appleTouchIconUrl = withBrandAssetVersion("/apple-touch-icon.png");
const icon192Url = withBrandAssetVersion("/icons/icon-192x192.png");
const icon512Url = withBrandAssetVersion("/icons/icon-512x512.png");

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
      { url: faviconUrl, sizes: "32x32", type: "image/png" },
      { url: icon192Url, sizes: "192x192", type: "image/png" },
      { url: icon512Url, sizes: "512x512", type: "image/png" },
    ],
    apple: [{ url: appleTouchIconUrl, sizes: "180x180", type: "image/png" }],
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
      <head>
        <link rel="apple-touch-icon" href={appleTouchIconUrl} />
        <link rel="manifest" href="/manifest.webmanifest" />
      </head>
      <body className="antialiased">
        <a href="#main-content" className="skip-link">
          Skip to main content
        </a>
        <AppShell>
          <AppErrorBoundary>
            <MobileAppShell>{children}</MobileAppShell>
          </AppErrorBoundary>
        </AppShell>
      </body>
    </html>
  );
}
