<?php

// 環境（dev か prod か）のファイルを読み込む
require_once __DIR__ . '/config/theme-env.php';

if ( THEME_IS_DEV ) {
  require_once __DIR__ . '/config/vite-server-config.php';
}

define('THEME_ENTRY_JS', 'assets/js/app.js');
define('THEME_DIST_DIR', get_template_directory() . '/../dist');
define('THEME_DIST_URI', get_template_directory_uri() . '/../dist');


/**
 * アセット URL を返す
 *
 * 開発中 (THEME_IS_DEV === true) の場合は Vite の開発サーバー (THEME_VITE_SERVER) を、
 * 本番時は WordPress テーマディレクトリの assets を返します。
 *
 * - asset_url()                 → '/assets'（本番） or 'http://…:3000/assets'（開発）
 * - asset_url( 'css/style.css') → '/assets/css/style.css'（本番） or 'http://…:3000/assets/css/style.css'（開発）
 *
 * @param string $path アセットへの相対パス（'css/style.css' のように渡す）
 * @return string 完全なアセット URL
 */
function asset_url( string $path = '' ): string {
    // ベース URL を選択
    if ( THEME_IS_DEV ) {
        // 開発中は Vite サーバーを使う
        $base = rtrim( THEME_VITE_SERVER, '/' ) . '/assets';
    } else {
        // 本番はテーマ内の assets フォルダ
        $base = get_template_directory_uri() . '/assets';
    }

    // パスを結合
    if ( $path === '' ) {
        return $base;
    }

    return $base . '/' . ltrim( $path, '/' );
}
