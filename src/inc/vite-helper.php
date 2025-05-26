<?php
require_once get_template_directory() . '/theme-config.php';

function vite_enqueue_assets() {
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
    // 本番環境: manifest.json を読み込んで enqueue
    add_action('wp_enqueue_scripts', function () {
      $manifest_path = THEME_DIST_DIR . '/.vite/manifest.json';
      if (!file_exists($manifest_path)) {
        return;
      }

      $manifest = json_decode(file_get_contents($manifest_path), true);
      $entry = $manifest[THEME_ENTRY_JS] ?? null;
      if (!$entry) {
        return;
      }

      if (!empty($entry['css'])) {
        foreach ($entry['css'] as $i => $css) {
          wp_enqueue_style("theme-style-$i", THEME_DIST_URI . '/' . $css, [], null);
        }
      }

      if (!empty($entry['file'])) {
        wp_enqueue_script('theme-main', THEME_DIST_URI . '/' . $entry['file'], [], null, true);
      }
    });

    // defer属性を付ける（必要であれば）
    add_filter('script_loader_tag', function ($tag, $handle) {
      if ($handle === 'theme-main') {
        return str_replace(' src=', ' defer src=', $tag);
      }
      return $tag;
    }, 10, 2);
  }
}

// init フックに登録（即有効化）
add_action('init', 'vite_enqueue_assets');
