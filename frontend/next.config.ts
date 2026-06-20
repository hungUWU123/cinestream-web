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
};

export default nextConfig;
