/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverActions: {
      bodySizeLimit: "10mb",
    },
  },
  // Enable standalone output for better Amplify compatibility
  output: process.env.NODE_ENV === 'production' ? 'standalone' : undefined,
  // Ensure images work with Amplify
  images: {
    unoptimized: true,
  },
};

export default nextConfig;
