<?php

// 環境（dev か prod か）のファイルを読み込む
require_once __DIR__ . '/config/theme-env.php';

if ( THEME_IS_DEV ) {
  require_once __DIR__ . '/config/vite-server-config.php';
}

define('THEME_ENTRY_JS', 'assets/js/app.js');
define('THEME_ENTRY_CSS', 'assets/css/style.css');
define('THEME_EDITOR_CSS', 'assets/css/editor-style.css');
define('THEME_DIST_DIR', get_template_directory());
define('THEME_DIST_URI', get_template_directory_uri());

const MEDIA_QUERIES = [
  'sp' => 'screen and (max-width: 991px)',
];
