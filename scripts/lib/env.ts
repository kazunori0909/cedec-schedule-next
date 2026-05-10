import { existsSync, readFileSync } from "node:fs";
import { ENV_PATH } from "./paths";

/**
 * リポジトリルートの .env ファイルを読み込み、process.env に展開する。
 * 既に環境変数として設定済みの値は上書きしない。
 *
 * 書式: KEY=VALUE（# コメント・空行は無視）
 */
export function loadEnv(path: string = ENV_PATH): void {
  if (!existsSync(path)) return;

  const content = readFileSync(path, "utf8");
  for (const raw of content.split(/\r?\n/)) {
    const line = raw.trim();
    if (line === "" || line.startsWith("#")) continue;
    const eq = line.indexOf("=");
    if (eq < 0) continue;
    const key = line.slice(0, eq).trim();
    const value = line.slice(eq + 1).trim();
    if (process.env[key] === undefined) {
      process.env[key] = value;
    }
  }
}
