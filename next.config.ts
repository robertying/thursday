import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  compress: false,
  reactCompiler: true,
  experimental: {
    // typescript is aliased to @typescript/typescript6, which only ships
    // bin/tsc6 (no bin/tsc), so Next's TypeScript-CLI type-check can't find it.
    useTypeScriptCli: false,
  },
};

export default nextConfig;
