import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Native modules must not be bundled by the server.
  serverExternalPackages: ["sharp", "@resvg/resvg-js"],
};

export default nextConfig;
