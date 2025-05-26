<?php
// ブロックエディターのカスタムCSSを読み込む
add_action( 'enqueue_block_editor_assets', function() {
  $file_css = get_template_directory_uri() . '/dist/css/editor-style.css';
  wp_enqueue_style( 'hondacars-editor-style', $file_css, array( 'wp-edit-blocks' ) );
  wp_enqueue_style( 'hondacars-google-font', 'https://fonts.googleapis.com/css2?family=Noto+Sans+JP:wght@100..900&display=swap' );
} );
