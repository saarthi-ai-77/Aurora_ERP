import type { NextConfig } from "next";

// BACKEND_URL must be set as a BUILD-TIME environment variable on Vercel
// (Dashboard → Settings → Environment Variables, not runtime-only).
// It is intentionally not NEXT_PUBLIC_ so the backend origin is never
// sent to the browser. All client requests hit /api/v1/* on this origin
// and are transparently proxied server-side.
const BACKEND_ORIGIN =
  process.env.BACKEND_URL ?? "https://aurora-erp-backend.onrender.com";

const nextConfig: NextConfig = {
  devIndicators: false,
  async rewrites() {
    return [
      {
        source: "/api/v1/:path*",
        destination: `${BACKEND_ORIGIN}/api/v1/:path*`,
      },
    ];
  },
};

export default nextConfig;
