import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  compress: false,
  experimental: {
    reactCompiler: true,
  },
};

export default nextConfig;
