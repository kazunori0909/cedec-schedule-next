#!/bin/bash
set -e

# web_data_original/ ディレクトリを作成（gitignore対象のため）
mkdir -p web_data_original

# web_data/ の既存年度ディレクトリ構造を作成
for year in 2020 2021 2022 2023 2024 2025; do
    mkdir -p "public/web_data/${year}"
done

# .env が未作成の場合はテンプレートからコピー
if [ ! -f .env ]; then
    cp .env.example .env
    echo ".env を作成しました。YouTube API を使う場合は YOUTUBE_API_KEY を設定してください。"
fi

# Node.js 依存パッケージをインストール
npm install

# Claude Code CLI を最新化する
# devcontainer feature はイメージビルド時にしか実行されないため、イメージ層がキャッシュ
# されているとビルド当時のバージョンのまま固定される。postCreate で毎回更新して回避する。
sudo npm install -g @anthropic-ai/claude-code@latest || echo "Claude Code CLI の更新に失敗しました（既存バージョンのまま継続します）"

echo ""
echo "=== セットアップ完了 ==="
echo "開発サーバー: npm run dev  (http://localhost:3000)"
echo ""
echo "schedule.json の生成手順:"
echo "  1. web_data_original/{year}/ に公式HTMLを配置"
echo "  2. npm run generate:json {year}"
