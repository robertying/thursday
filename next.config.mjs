/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "standalone",
  compress: false,
  experimental: {
    reactCompiler: true,
    ppr: true,
  },
};

export default nextConfig;
