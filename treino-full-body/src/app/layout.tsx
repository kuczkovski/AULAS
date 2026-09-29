import type { Metadata, Viewport } from "next";
import "./globals.css";
import { Providers } from "@/components/Providers";
import { BottomNav } from "@/components/BottomNav";
import { withBase } from "@/lib/base-path";

export const metadata: Metadata = {
  title: "Treino Full Body",
  description: "Acompanhamento de um programa Full Body de quatro dias semanais.",
  manifest: withBase("/manifest.webmanifest"),
  applicationName: "Treino Full Body",
  appleWebApp: { capable: true, title: "Full Body", statusBarStyle: "black-translucent" },
  icons: {
    icon: [{ url: withBase("/icons/icon.svg"), type: "image/svg+xml" }, { url: withBase("/icons/icon-192.png"), sizes: "192x192" }],
    apple: withBase("/icons/apple-touch-icon.png"),
  },
};

export const viewport: Viewport = {
  themeColor: "#0a0c0f",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  colorScheme: "dark",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <body className="min-h-dvh">
        <Providers>
          {children}
          <BottomNav />
        </Providers>
      </body>
    </html>
  );
}
