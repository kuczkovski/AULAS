import type { NextConfig } from "next";

// Exportação estática: a aplicação roda inteiramente no navegador
// (IndexedDB + Supabase), o que permite que o service worker
// armazene todas as rotas e funcione offline.
// NEXT_PUBLIC_BASE_PATH permite publicar num subcaminho (ex.: GitHub Pages
// em https://usuario.github.io/repositorio/treino).
const basePath = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

const nextConfig: NextConfig = {
  output: "export",
  basePath,
  trailingSlash: true,
  images: { unoptimized: true },
  reactStrictMode: true,
};

export default nextConfig;
