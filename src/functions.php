<?php

// 定数管理ファイルを読み込み（vite-helper.php より先に読み込む）
require_once __DIR__ . '/theme-config.php';

// Vite開発用アセット読み込み
require_once __DIR__ . '/inc/vite-helper.php';


/*
    inc/setup.php
	- WordPressにドキュメントタイトルを管理
	- アイキャッチ画像のサポートを有効化
	- 有効なHTML5を出力
*/
require_once __DIR__ . '/inc/setup.php';

/*
    inc/gutenberg.php
	- editor customize
  - ブロックエディターにカスタムCSSを有効化
*/
require_once __DIR__ . '/inc/gutenberg.php';
