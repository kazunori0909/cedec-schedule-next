import path from "path";
import { defineConfig } from "vitest/config";

// @ エイリアスは全プロジェクト共通で使用する。
const alias = {
  "@": path.resolve(__dirname, "./src"),
};

export default defineConfig({
  resolve: { alias },
  test: {
    // カバレッジ対象は実行時ロジック（src）に限定する。
    // テストは対象ファイルと同じディレクトリに同居させているため計測対象から除外する。
    coverage: {
      provider: "v8",
      include: ["src/lib/**", "src/hooks/**"],
      exclude: ["**/*.test.{ts,tsx}"],
      reporter: ["text", "html"],
    },
    projects: [
      {
        // 種類A: 生成段階（ビルド時）テスト。
        // schedule.json / cedil.json を事前生成するスクリプトのロジックを検証する。
        // 実行時には不要なため app プロジェクトと分離している。
        resolve: { alias },
        test: {
          name: "scripts",
          globals: true,
          environment: "node",
          include: ["scripts/**/*.test.ts"],
        },
      },
      {
        // 種類B: 実行時テスト。
        // アプリが JSON を取得して変換・描画する実行時ロジックとコンポーネントを検証する。
        // コンポーネントテストは各ファイル先頭の `// @vitest-environment jsdom` で jsdom に切り替わる。
        resolve: { alias },
        test: {
          name: "app",
          globals: true,
          environment: "node",
          setupFiles: ["./src/test/setup.ts"],
          include: ["src/**/*.test.{ts,tsx}"],
        },
      },
    ],
  },
});
