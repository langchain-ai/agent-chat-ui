import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "standalone",
  outputFileTracingRoot: path.join(__dirname), // Explicitly use current directory
  // Disable telemetry for faster builds
  telemetry: false,
  // Optimize build performance
  swcMinify: true,
  experimental: {
    serverActions: {
      bodySizeLimit: "10mb",
    },
    // Enable build cache
    optimizePackageImports: ['lucide-react', '@radix-ui/react-dialog', '@radix-ui/react-dropdown-menu'],
  },
  // Compiler optimizations
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production' ? {
      exclude: ['error', 'warn'],
    } : false,
  },
  // Headers for NextAuth to handle proxy scenarios
  async headers() {
    return [
      {
        source: '/api/auth/:path*',
        headers: [
          // Ensure proper protocol forwarding if behind a proxy
          ...(process.env.NEXTAUTH_URL?.startsWith('https://') ? [
            { key: 'X-Forwarded-Proto', value: 'https' },
          ] : [
            { key: 'X-Forwarded-Proto', value: 'http' },
          ]),
        ],
      },
    ];
  },
};

export default nextConfig;
