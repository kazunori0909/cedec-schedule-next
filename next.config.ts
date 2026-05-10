import type { NextConfig } from "next";

const BASE_PATH = process.env.NODE_ENV === "production" ? "/cedec_test" : "";

const nextConfig: NextConfig = {
  output: "export",
  basePath: BASE_PATH,
  env: {
    NEXT_PUBLIC_BASE_PATH: BASE_PATH,
  },
  trailingSlash: true,
  images: {
    unoptimized: true,
  },
};

export default nextConfig;
