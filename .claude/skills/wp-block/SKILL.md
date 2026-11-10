---
name: wp-block
description: このテーマ（Vite + Tailwind v4 + Docker のスターター）で Gutenberg カスタムブロックを追加・編集するときに使う。動的ネイティブ方式（block.json + edit.js + render.php、フロントは PHP 描画）で、エディタ JS だけ @wordpress/scripts でビルドする構成。ブロックを新規作成/改修する、block.json や render.php を触る、ビルドが通らない等の相談で参照する。
---

# WordPress カスタムブロック開発（このテーマの流儀）

## 方式：動的ネイティブ
- **フロント描画は PHP（`render.php`）**。テーマの Tailwind/BEM クラスをそのまま使える。
- **エディタUI（`edit.js`）だけ React/JSX** で書き、`@wordpress/scripts`（webpack）でビルド。
- `save` は `null`（本文には属性のみ保存 → マークアップ変更は render.php を直すだけで全既存ブロックへ反映）。
- フロントに JS は出さない（必要なら別途 viewScript を足す）。

## ディレクトリと役割
```
blocks/<name>/            ← ソース（git管理）。ここを編集する
  block.json              apiVersion 3。editorScript=file:./index.js, render=file:./render.php
  index.js                registerBlockType（edit を import、save: () => null）
  edit.js                 エディタUI（JSX）
  render.php              フロント描画（通常のPHPテンプレート）
src/blocks/<name>/        ← wp-scripts のビルド出力（gitignore）。手で触らない
release/<PRODUCTION_NAME>/blocks/<name>/  ← 本番。copyStaticPlugin がコピー
```

## dev / prod のしくみ（重要）
- 登録は `src/inc/blocks.php` が `get_theme_file_path('blocks')`（= `<theme>/blocks`）を走査して `register_block_type($dir)`。
  - dev: テーマ = `src` → `src/blocks`（wp-scripts の出力先）
  - prod: テーマ = `release/<PRODUCTION_NAME>` → `release/.../blocks`（`vite.config.js` の copy ターゲットがコピー）
- ビルド出力先は `webpack.config.js` が `src/blocks` に固定。ソース走査は npm スクリプトの `--webpack-src-dir=blocks`。

## コマンド
```bash
npm run blocks:dev     # 監視ビルド（src/blocks へ出力）。npm run dev の concurrently にも組み込み済み
npm run blocks:build   # 単発ビルド。npm run build（theme:build）が本番ビルド前に自動実行
```
`npm run dev` を動かしていれば `blocks:dev` も並走する。ブロックを足したら**エディタを再読込**（init で再登録されるため）。

## 依頼の受け口：block-drafts/
ユーザーは `block-drafts/<slug>.html` に「完成形マークアップ＋先頭コメントの仕様（block名/title/icon/editable/supports/css）」を置く。
「block-drafts の <slug> をブロック化して」「block-drafts を見て未作成のを作って」と言われたら、
そのファイルを読んで下の手順で `blocks/<slug>/` を生成する。書式は `block-drafts/README.md` 参照。
`editable` の各行が edit.js の入力UIと render.php の出力にマッピングされる（text→RichText, image→MediaUpload, url+text→リンク, repeat→複数項目, innerblocks→InnerBlocks）。

## 新しいブロックの追加手順
1. `blocks/<name>/` を作り、`sample` をコピーして中身を変える。
2. `block.json` の `name`（`<theme-namespace>/<name>`）, `title`, `icon`, `attributes` を編集。**namespace はプロジェクトに合わせて変更**（雛形は `theme/`）。
   **`category` は必ずオリジナルカテゴリー `"theme"`（`inc/blocks.php` で登録済み）**。コアの design/media は使わない。slug はプロジェクトに合わせて変更可（block.json と inc/blocks.php を揃える）。
3. `index.js` は基本そのまま（`import Edit from './edit.js'` の**拡張子は必須**）。
4. `edit.js` でエディタUIを実装。**render.php と同じクラス名**を出力すると、editor-style.css（Tailwind）でエディタも本番に近い見た目になる。
5. `render.php` でフロント描画。`get_block_wrapper_attributes()` を必ず使う。出力は `esc_html` / `wp_kses_post` でエスケープ。
6. フロントの CSS は **テーマの `src/assets/css/_modules/_c-<name>.css`** に書く（block 側に style.css を持たせない）。`style.css` へ `@import` を追加。エディタにも効かせたいものは `editor-style.css` にも `@import`。
7. `npm run dev` 実行中ならビルドは自動。エディタを再読込して確認。

## コア機能（spacing 等）を使う
- ブロックに margin/padding UI を出すには `block.json` の `supports.spacing` に加え、**テーマの `src/theme.json` で有効化が必要**（本スターターは有効化済み: margin/padding、blockGap は無効）。
  ```json
  "supports": { "spacing": { "margin": true, "padding": true } }
  ```
- `render.php` が `get_block_wrapper_attributes()` を使っていれば、フロントにもインライン spacing が自動付与される。

## theme.json（このスターターの設定）
- `settings.layout.contentSize`（初期 980px・**プロジェクトごとに変更**、`--container-width` と揃える）。
- `settings.spacing`（margin/padding 有効・blockGap 無効）。
- theme.json を置くと WP のグローバルスタイルが有効化され、フロント/エディタに layout・align 系CSSが出る点に注意。

## エディタ表示をフロントに揃える仕組み（設定済み）
- `inc/gutenberg.php`: editor-style を **`enqueue_block_assets`（is_admin）**で iframe キャンバスへ。prod は `get_vite_asset()` で manifest 解決。
- `editor-style.css`: `_base/_root-font-size.css`（rem 基準）＋ `.editor-styles-wrapper` の font-family ＋ 投稿タイトル補正。

## ハマりどころ
- **`package.json` が `"type": "module"`**:
  - `blocks/**/*.js` の相対 import は**拡張子必須**（`./edit.js`）。付け忘れると "fully specified" エラー。
  - `webpack.config.js` は ESM（`createRequire` で既定設定を読む）。
- 定義を変えたら `index.asset.php`（依存とバージョン）が再生成され、`register_block_type` が自動で読む（依存/キャッシュバスティング手書き不要）。
- 本番: `theme:build` は `blocks:build → vite build` の順（vite の copy が src/blocks を release へ運ぶため、先に blocks をビルドする）。

## 参考実装
`blocks/sample/` が最小の動作サンプル（RichText 1つ → h3 を PHP 描画）。新規ブロックの雛形として複製する。
