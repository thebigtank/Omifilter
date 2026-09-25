import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Deploys build into a side directory (NEXT_DIST_DIR=.next-new) and swap it
  // in only once the build succeeds, so a failed build never takes down the
  // live site. See DEPLOYMENT.md.
  distDir: process.env.NEXT_DIST_DIR || ".next",
};

export default nextConfig;
