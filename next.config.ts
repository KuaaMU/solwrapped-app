import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // sharp is a native image module and must not be bundled by the server
  serverExternalPackages: ["sharp"],
};

export default nextConfig;
