#!/bin/bash

# Todoist OAuth Proxy Server 起動スクリプト

# 色付きメッセージ用の関数
print_info() {
    echo -e "\033[36m[INFO]\033[0m $1"
}

print_success() {
    echo -e "\033[32m[SUCCESS]\033[0m $1"
}

print_error() {
    echo -e "\033[31m[ERROR]\033[0m $1"
}

print_warning() {
    echo -e "\033[33m[WARNING]\033[0m $1"
}

# Denoがインストールされているかチェック
if ! command -v deno &> /dev/null; then
    print_error "Denoがインストールされていません。"
    print_info "Denoをインストールしてください: https://deno.land/manual/getting_started/installation"
    exit 1
fi

print_success "Deno $(deno --version | head -n1 | cut -d' ' -f2) が見つかりました"

# .envファイルの存在チェック
if [ ! -f ".env" ]; then
    print_warning ".envファイルが見つかりません"
    if [ -f ".env.example" ]; then
        print_info ".env.exampleから.envファイルを作成しています..."
        cp .env.example .env
        print_success ".envファイルを作成しました"
        print_info "必要に応じて.envファイルを編集してください"
    else
        print_warning ".env.exampleファイルも見つかりません"
        print_info "環境変数ALLOWED_ORIGINを設定するか、.envファイルを作成してください"
    fi
fi

# ポート番号の設定（デフォルト: 8000）
PORT=${PORT:-8000}

print_info "プロキシサーバーを起動しています..."
print_info "ポート: $PORT"

# 環境変数を読み込んでDenoサーバーを起動
if [ -f ".env" ]; then
    print_info ".envファイルから環境変数を読み込んでいます"
    export $(cat .env | grep -v '^#' | xargs)
fi

print_info "ALLOWED_ORIGIN: ${ALLOWED_ORIGIN:-http://localhost:5173}"
print_success "サーバーを起動中..."

# Denoサーバーを起動
deno run --allow-net --allow-env --allow-read main.ts --port=$PORT