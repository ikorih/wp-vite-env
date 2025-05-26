<?php

// vite開発用 : こちらは削除しないでください。
require_once __DIR__ . '/inc/vite-helper.php';

// 定数管理ファイルを読み込み
require_once __DIR__ . '/theme-config.php';


/*
    inc/setup.php
	- WordPressにドキュメントタイトルを管理
	- アイキャッチ画像のサポートを有効化
	- 有効なHTML5を出力
*/
require_once __DIR__ . '/inc/setup.php';

/*
    lib/gutenberg.php
	- editor customize
  - ブロックエディターにカスタムCSSを有効化
*/
require get_template_directory() . '/inc/gutenberg.php';
