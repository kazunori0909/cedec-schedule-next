#!/usr/bin/env bash
#
# pre-commit フックから呼ばれるシークレット検査
# - .env / .env.local 等のシークレットファイルがステージされていないか
# - ステージング差分に既知のシークレットパターン（API キー等）が含まれていないか
#
set -euo pipefail

# ステージされたファイル一覧（追加・修正のみ）
staged_files=$(git diff --cached --name-only --diff-filter=ACMR)

if [ -z "$staged_files" ]; then
  exit 0
fi

# 1. .env 系ファイル自体のステージングをブロック（.env.example は除外）
forbidden=$(echo "$staged_files" | grep -E '(^|/)\.env($|\.)' | grep -v -E '\.env\.example$' || true)
if [ -n "$forbidden" ]; then
  echo "[ERROR] シークレットを含む可能性のあるファイルがステージされています:" >&2
  echo "$forbidden" >&2
  echo "" >&2
  echo "これらのファイルは git に含めるべきではありません。" >&2
  echo "  git restore --staged <file>  でステージング解除してください。" >&2
  exit 1
fi

# 2. ステージング差分に既知のシークレットパターンが含まれていないか
# Google API key (AIza...) / AWS access key / 秘密鍵ヘッダ
secret_pattern='(AIza[0-9A-Za-z_-]{35}|AKIA[0-9A-Z]{16}|-----BEGIN [A-Z ]*PRIVATE KEY-----)'
match=$(git diff --cached -U0 -- $staged_files 2>/dev/null \
  | grep -E "^\+" | grep -v "^+++" \
  | grep -E "$secret_pattern" || true)

if [ -n "$match" ]; then
  echo "[ERROR] ステージング差分に秘密情報のパターンが検出されました:" >&2
  echo "$match" >&2
  echo "" >&2
  echo "コミットを中断します。該当の値を取り除いてから再度コミットしてください。" >&2
  exit 1
fi

exit 0
