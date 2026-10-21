import type { NextConfig } from "next";

const BASE_PATH = process.env.BASE_PATH ?? "";

const nextConfig: NextConfig = {
  output: "export",
  // React Compiler は Babel を通さず Rust 版で動かす（→ docs/phase19-nextjs-16-4-upgrade/PLAN.md）
  reactCompiler: true,
  experimental: {
    turbopackRustReactCompiler: true,
  },
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
