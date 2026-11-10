# block-drafts — ブロックのマークアップ置き場（ドラフト）

ここに「フロントで出したい HTML（＋どこを編集可能にするか）」を置くと、
それを元に Claude が動的ネイティブブロック（`blocks/<name>/`）を生成します。

## 使い方
1. `block-drafts/<slug>.html` を新規作成（`_template.html` を複製すると楽）。
2. 先頭の HTML コメントに仕様、その下に完成形のマークアップ（BEM）を書く。
3. Claude に「**block-drafts の <slug> をブロック化して**」または
   「**block-drafts を見て未作成のものを作って**」と依頼する。

## 1ファイルの書き方
```html
<!--
block: theme/feature-card        # namespace/slug（必須。namespace はプロジェクトに合わせる）
title: 特徴カード                 # エディタ表示名
icon: star                       # dashicon 名（任意）
editable:                        # 編集可能にする箇所と種類
  - img:   image (alt入力あり)
  - title: text
  - text:  text(改行可)
  - link:  url+text
supports: spacing.margin         # コア機能（任意: spacing / align:full など）
css: あとで指定                   # スタイル方針（任意）
-->
<div class="c-feature-card">
  <img class="c-feature-card__img" src="" alt="">
  <h3 class="c-feature-card__title">見出し</h3>
  <p class="c-feature-card__text">本文</p>
  <a class="c-feature-card__link" href="">詳しく</a>
</div>
```

- コメントの仕様はゆるくてOK（足りない項目は Claude から確認します）。
- `editable` の各行 = 「HTMLのどの要素を、どの型で編集可能にするか」。
  型の例: `text`（RichText）/ `image` / `url+text`（リンク）/ `select`（選択肢）/
  `repeat`（決まった項目を N 個）/ `innerblocks`（中に自由にブロックを積む）。

## 生成後の流れ（Claude 側）
`blocks/<slug>/`（block.json・edit.js・render.php）を作成 → ビルド → wp-cli で登録/描画を検証
→ 必要なら `_modules/_c-<slug>.css` を作って style.css / editor-style.css に配線。
あなたはエディタを再読込して確認するだけ。

## メモ
- このディレクトリは **ソースではなく仕様書**。ビルド対象ではない（`blocks/` とは別物）。
- 生成済みの下書きは、コメント先頭に `# done` を付けるか、そのまま参照用に残してOK。
