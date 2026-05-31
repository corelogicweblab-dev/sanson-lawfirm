import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "export",
  trailingSlash: true,
  images: { unoptimized: true },
  transpilePackages: ["@sanson/ui", "@sanson/shared", "@sanson/types", "@sanson/utils"],
};

export default nextConfig;
