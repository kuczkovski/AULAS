import type { NextConfig } from "next";

// Exportação estática: a aplicação roda inteiramente no navegador
// (IndexedDB + Supabase), o que permite que o service worker
// armazene todas as rotas e funcione offline.
const nextConfig: NextConfig = {
  output: "export",
  trailingSlash: true,
  images: { unoptimized: true },
  reactStrictMode: true,
};

export default nextConfig;
