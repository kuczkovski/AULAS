import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  // o Next gera AGENTS.md/CLAUDE.md sozinho em desenvolvimento; não queremos isso no repositório
  agentRules: false,
};

export default nextConfig;
