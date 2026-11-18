import type { NextConfig } from "next";

/**
 * API_PROXY_TARGET set ho (jaise http://localhost:5700) to /api/* isi website ke
 * through backend tak jaata hai. Tab NEXT_PUBLIC_API_URL="" rakho: ek hi link par
 * website + API (CORS ki zaroorat nahi, demo/tunnel ke liye aasaan).
 */
const proxyTarget = process.env.API_PROXY_TARGET?.replace(/\/$/, "");

const nextConfig: NextConfig = {
  poweredByHeader: false,
  // Ek hi folder se do builds (local + demo) chalane ke liye alag output folder
  distDir: process.env.NEXT_DIST_DIR || ".next",
  async rewrites() {
    if (!proxyTarget) return [];
    return [
      { source: "/api/:path*", destination: `${proxyTarget}/api/:path*` },
      { source: "/health", destination: `${proxyTarget}/health` },
    ];
  },
};

export default nextConfig;
