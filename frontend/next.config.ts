import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  devIndicators: false,
  async rewrites() {
    return [
      {
        source: '/api/v1/:path*',
        destination: 'https://aurora-erp-backend.onrender.com/api/v1/:path*',
      },
    ]
  },
};

export default nextConfig;
