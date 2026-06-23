import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'img.ophim.live',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'img.ophim.co',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'img.ophim1.com',
        pathname: '/**',
      },
    ],
  },
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: 'http://localhost:5000/api/:path*',
      },
      {
        source: '/uploads/:path*',
        destination: 'http://localhost:5000/uploads/:path*',
      },
      {
        source: '/downloads/:path*',
        destination: 'http://localhost:5000/downloads/:path*',
      },
    ];
  },
};

export default nextConfig;
