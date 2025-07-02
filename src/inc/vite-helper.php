<?php
require_once get_template_directory() . '/theme-config.php';

function enqueue_front_assets() {
  if (THEME_IS_DEV) {
    // 開発モード: Vite Dev Server から読み込み
    add_action('wp_enqueue_scripts', function () {
      wp_enqueue_script('vite-client', THEME_VITE_SERVER . '/@vite/client', [], null);
      wp_enqueue_script('vite-main', THEME_VITE_SERVER . '/' . THEME_ENTRY_JS, [], null, true);
    });

    // <head> に Vite 用の script module を追加（必要に応じて）
    add_filter('script_loader_tag', function ($tag, $handle) {
      if (in_array($handle, ['vite-client', 'vite-main'], true)) {
        return str_replace('<script ', '<script type="module" crossorigin ', $tag);
      }
      return $tag;
    }, 10, 2);
  } else {
    wp_enqueue_style('theme-style', THEME_DIST_URI . '/' . THEME_ENTRY_CSS, [], VERSION);
    wp_enqueue_script('theme-main', THEME_DIST_URI . '/' . THEME_ENTRY_JS, [], VERSION, true);

    // defer属性を付ける（必要であれば）
    add_filter('script_loader_tag', function ($tag, $handle) {
      if ($handle === 'theme-main') {
        return str_replace(' src=', ' defer src=', $tag);
      }
      return $tag;
    }, 10, 2);
  }
}

add_action('wp_enqueue_scripts', 'enqueue_front_assets', 20); // priority を 20 に
