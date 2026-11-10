<?php
// エディタスタイル。
// WP 6.3+ の編集キャンバスは iframe のため、enqueue_block_editor_assets だと
// キャンバス内に届かない。enqueue_block_assets（＝ブロック描画コンテキスト共通・
// エディタでは iframe 内に読み込まれる）を使い、フロントでの二重読み込みは is_admin で除外する。
add_action('enqueue_block_assets', function () {
  // フロントは style.css 側で読むのでここでは不要。エディタ（管理画面）だけに限定。
  if (!is_admin()) {
    return;
  }

  if (THEME_IS_DEV) {
    // 開発環境：Vite Dev Server の CSS を直接読み込み
    wp_enqueue_style('editor-style', THEME_VITE_SERVER . '/' . THEME_EDITOR_CSS, [], null);
  } else {
    // 本番環境：manifest からハッシュ付きファイルを解決
    $css_file = function_exists('get_vite_asset') ? get_vite_asset(THEME_EDITOR_CSS) : null;
    if ($css_file) {
      wp_enqueue_style('editor-style', THEME_DIST_URI . '/' . $css_file, [], null);
    }
  }

  // エディタキャンバス(iframe)でも本文フォントを読み込む
  wp_enqueue_style('google-font', 'https://fonts.googleapis.com/css2?family=Noto+Sans+JP:wght@100..900&display=swap');
});


// youtube埋め込みのレスポンシブ対応
add_filter('the_content','wrap_iframe');
if ( !function_exists( 'wrap_iframe' ) ):
function wrap_iframe($the_content) {
  if ( is_singular() || is_page()) {
    //YouTube
    $the_content = preg_replace('/<iframe[^>]+?(youtube\.com|jwplatform\.com|player\.vimeo\.com)[^<]+?<\/iframe>/is', '<div class="c-iframe"><div class="c-iframe__youtube">${0}</div></div>', $the_content);
    //Instagram
    $the_content = preg_replace('/<iframe[^>]+?instagram\.com[^<]+?<\/iframe>/is', '<div class="c-iframe"><div class="c-iframe__instagram">${0}</div></div>', $the_content);
  }
  return $the_content;
}
endif;

