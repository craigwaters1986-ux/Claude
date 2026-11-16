import { execSync } from "node:child_process";
import type { NextConfig } from "next";

/**
 * Identifies this build, so an open app can tell when a newer version is live
 * (see use-app-update.ts). Must be the same everywhere in one build: this file
 * is evaluated more than once per build, so never use a timestamp here.
 */
function buildId(): string {
  if (process.env.VERCEL_GIT_COMMIT_SHA) return process.env.VERCEL_GIT_COMMIT_SHA;
  if (process.env.BUILD_ID) return process.env.BUILD_ID;
  try {
    return execSync("git rev-parse HEAD", { stdio: ["ignore", "pipe", "ignore"] }).toString().trim();
  } catch {
    return "dev";
  }
}

const nextConfig: NextConfig = {
  env: {
    NEXT_PUBLIC_BUILD_ID: buildId(),
  },
};

export default nextConfig;
