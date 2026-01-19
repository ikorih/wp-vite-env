<?php
/**
 * Vite manifest.json からビルド済みファイルパスを取得
 *
 * @param string $entry エントリーポイント（例: 'assets/js/app.js'）
 * @return string|null ハッシュ付きファイルパス、または null
 */
function get_vite_asset( string $entry ): ?string {
  static $manifest = null;

  if ( $manifest === null ) {
    $manifest_path = THEME_DIST_DIR . '/.vite/manifest.json';
    if ( file_exists( $manifest_path ) ) {
      $manifest = json_decode( file_get_contents( $manifest_path ), true );
    } else {
      $manifest = [];
    }
  }

  if ( isset( $manifest[ $entry ]['file'] ) ) {
    return $manifest[ $entry ]['file'];
  }

  return null;
}

function enqueue_front_assets() {
  if ( THEME_IS_DEV ) {
    // 開発モード: Vite Dev Server から読み込み
    wp_enqueue_script( 'vite-client', THEME_VITE_SERVER . '/@vite/client', [], null );
    wp_enqueue_style( 'theme-style', THEME_VITE_SERVER . '/' . THEME_ENTRY_CSS, [], null );
    wp_enqueue_script( 'vite-main', THEME_VITE_SERVER . '/' . THEME_ENTRY_JS, [], null, true );

    // <head> に Vite 用の script module を追加
    add_filter( 'script_loader_tag', function ( $tag, $handle ) {
      if ( in_array( $handle, [ 'vite-client', 'vite-main' ], true ) ) {
        return str_replace( '<script ', '<script type="module" crossorigin ', $tag );
      }
      return $tag;
    }, 10, 2 );
  } else {
    // 本番モード: manifest.json からハッシュ付きファイルを取得
    $css_file = get_vite_asset( THEME_ENTRY_CSS );
    $js_file  = get_vite_asset( THEME_ENTRY_JS );

    if ( $css_file ) {
      wp_enqueue_style( 'theme-style', THEME_DIST_URI . '/' . $css_file, [], null );
    }

    if ( $js_file ) {
      wp_enqueue_script( 'theme-main', THEME_DIST_URI . '/' . $js_file, [], null, true );

      // defer属性を付ける
      add_filter( 'script_loader_tag', function ( $tag, $handle ) {
        if ( $handle === 'theme-main' ) {
          return str_replace( ' src=', ' defer src=', $tag );
        }
        return $tag;
      }, 10, 2 );
    }
  }
}

add_action( 'wp_enqueue_scripts', 'enqueue_front_assets', 20 );
