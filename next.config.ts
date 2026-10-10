import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  compress: false,
  reactCompiler: true,
};

export default nextConfig;
