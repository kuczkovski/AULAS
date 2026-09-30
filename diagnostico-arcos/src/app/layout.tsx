import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Avaliação Diagnóstica — Arcos e Ângulos",
  description: "Avaliação diagnóstica sobre relações entre arcos e ângulos na circunferência, para o 1º ano do Ensino Médio.",
  robots: { index: false, follow: false },
};

export const viewport: Viewport = { width: "device-width", initialScale: 1, themeColor: "#1f4fb8" };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <body>{children}</body>
    </html>
  );
}
