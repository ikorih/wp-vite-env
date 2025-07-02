<?php
add_action('enqueue_block_editor_assets', function () {
  if (THEME_IS_DEV) {
    // 開発環境：Vite Dev Server の CSS を直接読み込み
    wp_enqueue_style('editor-style', THEME_VITE_SERVER . '/' . THEME_EDITOR_CSS, [], null);
  } else {
    // 本番環境
    $file_css = get_template_directory_uri() . '/' . THEME_EDITOR_CSS;
    wp_enqueue_style( 'editor-style', $file_css, array( 'wp-edit-blocks' ) );
  }
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

