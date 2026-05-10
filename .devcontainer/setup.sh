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

echo ""
echo "=== セットアップ完了 ==="
echo "開発サーバー: npm run dev  (http://localhost:3000)"
echo ""
echo "schedule.json の生成手順:"
echo "  1. web_data_original/{year}/ に公式HTMLを配置"
echo "  2. npm run generate:json {year}"
