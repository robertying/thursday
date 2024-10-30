import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    formats: ["image/avif", "image/webp"],
  },
  output: "standalone",
  compress: false,
  experimental: {
    reactCompiler: true,
  },
};

export default nextConfig;
