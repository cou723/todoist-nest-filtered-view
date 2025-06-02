#!/bin/bash

# Deno Deploy用のデプロイスクリプト
echo "🚀 Deno Deployへのデプロイ準備"

# Denoがインストールされているかチェック
if ! command -v deno &> /dev/null; then
    echo "❌ Denoがインストールされていません"
    echo "📥 Denoをインストールしてください: https://deno.land/manual/getting_started/installation"
    exit 1
fi

echo "✅ Deno $(deno --version | head -n1)"

# 構文チェック
echo "🔍 TypeScript構文チェック中..."
deno check main.ts

if [ $? -eq 0 ]; then
    echo "✅ 構文チェック完了"
else
    echo "❌ 構文エラーがあります"
    exit 1
fi

# ローカルテスト（オプション）
echo "🧪 ローカルテストを実行しますか? (y/N)"
read -r response
if [[ "$response" =~ ^([yY][eE][sS]|[yY])$ ]]; then
    echo "🌐 ローカルサーバーを起動中... (Ctrl+Cで停止)"
    deno run --allow-net --allow-env main.ts
fi

echo ""
echo "📋 Deno Deployでのデプロイ手順:"
echo "1. https://deno.com/deploy にアクセス"
echo "2. GitHubリポジトリを連携"
echo "3. Entry Point: proxy/main.ts を指定"
echo "4. 環境変数 ALLOWED_ORIGIN を設定"
echo "5. デプロイ完了！"