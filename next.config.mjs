/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',
  experimental: {
    serverActions: {
      bodySizeLimit: "10mb",
    },
  },
};

export default nextConfig;
