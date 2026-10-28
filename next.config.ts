import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // The e2e run builds into its own folder (NEXT_DIST_DIR=.next-e2e) so it
  // never overwrites the .next of a running `next dev`.
  distDir: process.env.NEXT_DIST_DIR || ".next",
};

export default nextConfig;
