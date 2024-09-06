/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "standalone",
  compress: false,
  experimental: {
    reactCompiler: true,
  },
};

export default nextConfig;
