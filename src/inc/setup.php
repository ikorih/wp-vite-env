<?php
// テーマの設定を行う
if ( ! function_exists( 'wp_theme_setup' ) ) {

  function wp_theme_setup() {

    // タイトルタグのサポートを追加
    add_theme_support( 'title-tag' );

    // アイキャッチ画像のサポートを追加
    add_theme_support( 'post-thumbnails' );

    // HTML5マークアップのサポートを追加
    add_theme_support( 'html5', array(
      'search-form',
      'comment-form',
      'comment-list',
      'gallery',
      'caption',
      'meta',
      'style',
      'script',
    ) );

  }
}
add_action( 'after_setup_theme', 'wp_theme_setup' );

