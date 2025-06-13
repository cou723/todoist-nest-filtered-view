#!/bin/bash

# フロントエンドとプロキシサーバーを同時起動するスクリプト

# 並列実行のため関数を定義
start_frontend() {
    echo "Starting frontend development server..."
    cd frontend
    pnpm dev
}

start_proxy() {
    echo "Starting proxy server..."
    cd proxy
    deno task dev
}

# 背景色付きでステータス表示
echo -e "\033[32m=== Todoist Task List Development Environment ===\033[0m"
echo "Frontend: http://localhost:5173"
echo "Proxy:    http://localhost:8000"
echo ""
echo "Press Ctrl+C to stop all servers"
echo ""

# バックグラウンドで両方のサーバーを起動
start_frontend &
FRONTEND_PID=$!

start_proxy &
PROXY_PID=$!

# Ctrl+Cで全てのプロセスを終了
trap 'echo ""; echo "Stopping servers..."; kill $FRONTEND_PID $PROXY_PID 2>/dev/null; exit 0' INT

# プロセスが生きている間は待機
wait