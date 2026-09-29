import type { Metadata, Viewport } from "next";
import { AvisoConexao, PwaRegistro } from "@/components/Pwa";
import "./globals.css";

export const metadata: Metadata = {
  title: "Torre Infinita",
  description: "Treino adaptativo de matemática para o Fundamental 2: sobe de andar quem aprende.",
  applicationName: "Torre Infinita",
  appleWebApp: { capable: true, title: "Torre Infinita", statusBarStyle: "default" },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#5b3df5",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <body>
        {children}
        <PwaRegistro />
        <AvisoConexao />
      </body>
    </html>
  );
}
