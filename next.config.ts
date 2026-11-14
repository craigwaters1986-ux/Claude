import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  env: {
    // Identifies this build, so an open app can tell when a newer version is live (see use-app-update.ts).
    NEXT_PUBLIC_BUILD_ID: process.env.VERCEL_GIT_COMMIT_SHA || process.env.BUILD_ID || `local-${Date.now()}`,
  },
};

export default nextConfig;
