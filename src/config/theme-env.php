<?php
/**
 * テーマ環境設定
 *
 * Docker 環境変数 THEME_IS_DEV から開発/本番モードを判定します。
 * - 開発時: THEME_IS_DEV=true  → Vite Dev Server から CSS/JS を読み込み
 * - 本番時: THEME_IS_DEV=false → ビルド済みファイルを読み込み
 */
define('THEME_IS_DEV', getenv('THEME_IS_DEV') === 'true');
