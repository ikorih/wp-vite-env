<?php
/**
 * Plugin Name: My Custom Block
 * Description: 独立した Gutenberg カスタムブロックを複数提供するプラグイン
 * Version:     0.1.0
 * Author:      Hiroki Fujikami
 */

defined( 'ABSPATH' ) || exit;

/**
 * 開発モードか判定（WP_DEBUG が true なら開発モードとみなす）
 */
if ( ! defined( 'MCB_DEV_MODE' ) ) {
    define( 'MCB_DEV_MODE', ( defined( 'WP_DEBUG' ) && WP_DEBUG ) );
    define( 'MCB_DEV_SERVER', 'http://localhost:5174' );  // Vite プラグイン用サーバーの固定ポート
}

/**
 * block.json のメタデータを開発／本番で切り替え
 */
add_filter( 'block_type_metadata', function( $metadata, $metadata_file ) {
    // block.json を直接読み込むときだけ
    if ( MCB_DEV_MODE ) {
        list( $namespace, $block_name ) = explode( '/', $metadata['name'], 2 );
        $base = rtrim( MCB_DEV_SERVER, '/' ) . "/blocks/{$block_name}";

        foreach ( [ 'script', 'editorScript', 'style', 'editorStyle' ] as $asset ) {
            if ( isset( $metadata[ $asset ] ) && strpos( $metadata[ $asset ], 'file:' ) === 0 ) {
                // file:./index.js → index.js
                $file = basename( str_replace( 'file:', '', $metadata[ $asset ] ) );
                // Vite dev server から直接ロード
                $metadata[ $asset ] = "{$base}/{$file}";
            }
        }
    }
    return $metadata;
}, 10, 2 );

/**
 * 本番モードでは dist/blocks/ 以下をスキャンして register_block_type
 */
add_action( 'init', function() {
    if ( ! MCB_DEV_MODE ) {
        $blocks = glob( __DIR__ . '/dist/blocks/*', GLOB_ONLYDIR );
        foreach ( $blocks as $block_dir ) {
            register_block_type( $block_dir );
        }
    }
});
