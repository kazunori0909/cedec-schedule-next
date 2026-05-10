import nextConfig from "eslint-config-next/core-web-vitals";
import typescript from "eslint-config-next/typescript";
import prettier from "eslint-config-prettier";

/** @type {import("eslint").Linter.Config[]} */
const eslintConfig = [
  {
    ignores: [
      ".next/**",
      "out/**",
      "node_modules/**",
      "public/web_data/**",
      "web_data_original/**",
      // シークレットを含むため解析対象外
      ".env",
      ".env.*",
      "!.env.example",
    ],
  },
  ...nextConfig,
  ...typescript,
  prettier,
  {
    rules: {
      "@typescript-eslint/no-unused-vars": ["error", { argsIgnorePattern: "^_" }],
      // マウントフラグ・ローディングリセット等の標準パターンを誤検知するため warn に下げる
      "react-hooks/set-state-in-effect": "warn",
    },
  },
];

export default eslintConfig;
