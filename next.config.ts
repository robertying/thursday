import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  compress: false,
  reactCompiler: true,
  experimental: {
    // Keep regenerated pages in the in-memory cache only; don't write them to disk.
    isrFlushToDisk: false,
  },
};

export default nextConfig;
