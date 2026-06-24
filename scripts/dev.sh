#!/bin/bash

# =============================================================================
# Development Server Script
# Docker環境の起動 → Vite + BrowserSync → 終了時にDocker停止・ポート解放
# =============================================================================

set -e

# 色付きメッセージ
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

CLEANUP_DONE=0

# プロジェクトルートに移動
cd "$(dirname "$0")/.."

echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN} Development Server${NC}"
echo -e "${GREEN}========================================${NC}"

# 終了時のクリーンアップ（1回だけ実行）
cleanup() {
  if [ $CLEANUP_DONE -eq 1 ]; then
    return
  fi
  CLEANUP_DONE=1

  echo ""
  echo -e "${YELLOW}開発サーバーを停止しています...${NC}"

  # Vite/Node プロセスを停止
  pkill -f "vite" 2>/dev/null || true
  pkill -f "node.*watch" 2>/dev/null || true

  # ポート 5173, 5174 を使用しているプロセスを強制終了
  for port in 5173 5174; do
    pid=$(lsof -ti:$port 2>/dev/null) || true
    if [ -n "$pid" ]; then
      echo -e "${YELLOW}ポート $port を解放しています...${NC}"
      kill -9 $pid 2>/dev/null || true
    fi
  done

  # Docker コンテナを停止
  docker-compose down 2>/dev/null || true

  echo -e "${GREEN}クリーンアップ完了${NC}"
}

# シグナルをトラップ
trap cleanup SIGINT SIGTERM EXIT

# 環境変数を読み込み（値に空白を含む場合に対応するため source 方式）
if [ -f .env ]; then
  set -a
  source .env
  set +a
else
  echo -e "${RED}エラー: .env ファイルが見つかりません${NC}"
  echo -e "${YELLOW}cp env .env で作成してください${NC}"
  exit 1
fi

# ローカル IP アドレスを取得
LOCAL_IP=$(ifconfig | grep "inet " | grep -v 127.0.0.1 | head -1 | awk '{print $2}')

# 画像生成
echo -e "${YELLOW}画像を生成しています...${NC}"
node scripts/generate-images.js --dev

# Vite サーバー設定を生成
echo -e "${YELLOW}Vite サーバー設定を生成しています...${NC}"
node scripts/generate-vite-server.js

# Docker起動（THEME_IS_DEV=true で開発モード）
echo -e "${YELLOW}Docker コンテナを起動しています...${NC}"
THEME_SOURCE=src THEME_IS_DEV=true docker-compose up -d

# WordPress の起動を待機（ヘルスチェック）
echo -e "${YELLOW}WordPress の起動を待機しています...${NC}"
LOCAL_SERVER_PORT=${LOCAL_SERVER_PORT:-8000}
max_attempts=60
attempt=0

until curl -s -o /dev/null "http://localhost:${LOCAL_SERVER_PORT}" 2>/dev/null; do
  attempt=$((attempt + 1))
  if [ $attempt -ge $max_attempts ]; then
    echo -e "${RED}タイムアウト: WordPress の起動に失敗しました${NC}"
    exit 1
  fi
  sleep 1
done

echo -e "${GREEN}WordPress が起動しました${NC}"

# WordPress 初回インストール（未インストールの場合のみ管理者ユーザーを自動作成）
if ! docker-compose run --rm cli wp core is-installed >/dev/null 2>&1; then
  echo -e "${YELLOW}WordPress をインストールしています（管理者ユーザーを作成）...${NC}"
  docker-compose run --rm cli wp core install \
    --url="http://localhost:${LOCAL_SERVER_PORT}" \
    --title="${WP_SITE_TITLE:-WordPress}" \
    --admin_user="${WP_ADMIN_USER:-admin}" \
    --admin_password="${WP_ADMIN_PASS:-admin}" \
    --admin_email="${WP_ADMIN_EMAIL:-admin@example.com}" \
    --skip-email
  echo -e "${GREEN}管理者ユーザー「${WP_ADMIN_USER:-admin}」を作成しました${NC}"
else
  echo -e "${GREEN}WordPress はインストール済みです${NC}"
fi

echo ""
echo -e "${GREEN}========================================${NC}"
echo -e "  ${GREEN}【PC】${NC}"
echo -e "  開発サイト: ${GREEN}http://localhost:${LOCAL_SERVER_PORT}${NC}"
echo -e "  管理画面:   ${GREEN}http://localhost:${LOCAL_SERVER_PORT}/wp-admin${NC}"
echo -e "    ユーザー名: ${GREEN}${WP_ADMIN_USER:-admin}${NC} / パスワード: ${GREEN}${WP_ADMIN_PASS:-admin}${NC}"
echo -e "  phpMyAdmin: ${GREEN}http://localhost:${PMA_PORT:-8080}${NC}"
echo -e "${GREEN}----------------------------------------${NC}"
echo -e "  ${GREEN}【スマホ】${NC}"
echo -e "  開発サイト: ${GREEN}http://${LOCAL_IP}:${LOCAL_SERVER_PORT}${NC}"
echo -e "${GREEN}========================================${NC}"
echo -e "  ${YELLOW}※ CSS/JS/PHP 変更で自動リロード${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""
echo -e "${YELLOW}Ctrl+C で終了します（Docker・ポートも自動停止）${NC}"
echo ""

# ブラウザを自動で開く（macOS）
if command -v open &> /dev/null; then
  open "http://localhost:${LOCAL_SERVER_PORT}"
fi

# 開発サーバー起動（並列実行）
concurrently \
  --kill-others \
  --names "img,lint,vite" \
  --prefix-colors "yellow,cyan,green" \
  "node scripts/watch-images.js" \
  "onchange \"**/*.{php}\" -- npm run lint:php" \
  "vite"
