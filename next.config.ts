import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Fully static site: no server, deployable to Vercel or Cloudflare Pages.
  output: "export",
};

export default nextConfig;
