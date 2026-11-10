<?php
/**
 * カスタムブロックの自動登録
 *
 * ビルド済みブロック（<theme>/blocks/<name>/block.json）を走査して register_block_type する。
 *   - dev:  テーマ = src         → src/blocks（wp-scripts の出力先）
 *   - prod: テーマ = release/<名> → release/<名>/blocks（copyStaticPlugin がコピー）
 *
 * ブロックの「ソース」はリポジトリ直下 /blocks に置き、
 * `npm run blocks:dev`（監視）/ `npm run blocks:build`（本番）で src/blocks へ出力する。
 */

/**
 * オリジナルブロック用のカテゴリーを追加（インサーターの先頭に表示）。
 * 各ブロックの block.json で "category": "theme" を指定する。
 * slug はプロジェクトに合わせて変更してよい（block.json 側も合わせる）。
 */
add_filter('block_categories_all', function ($categories) {
    array_unshift($categories, [
        'slug'  => 'theme',
        'title' => 'オリジナル',
        'icon'  => null,
    ]);
    return $categories;
});

add_action('init', function () {
    $blocks_dir = get_theme_file_path('blocks');
    if (!is_dir($blocks_dir)) {
        return;
    }

    foreach (glob($blocks_dir . '/*', GLOB_ONLYDIR) as $dir) {
        if (file_exists($dir . '/block.json')) {
            // block.json の editorScript(file:) と render(file:) を WP が解決。
            // 同階層の index.asset.php から依存とバージョンも自動反映される。
            register_block_type($dir);
        }
    }
});
