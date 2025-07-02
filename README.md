# WordPress + Vite + Docker + Tailwind 開発環境

## 📖 概要

このリポジトリは、WordPress テーマ／プラグイン開発を  
[Vite](https://vitejs.dev/)／[Docker](https://www.docker.com/)／[Tailwind CSS](https://tailwindcss.com/) で行うためのスターターキットです。

- **テーマ本体** は `src/` 以下で開発し、`dist/` にビルド
- **Gutenberg カスタムブロック（プラグイン）** は `wp/plugins/my-custom-block/src/` 以下で開発し、同ディレクトリ配下にビルド
- 画像は `scripts/generate-images.js` で WebP を生成し、ウォッチ

## ⚙️ 前提条件

- Docker がインストール済みであること
- Node.js ≥ v20
- 依存パッケージをインストール済み (`npm install`)

## 🚀 開発時のコマンド

### 1. 開発サーバーを起動

```bash
npm run dev
```

- 画像生成＆ウォッチ (`img:gen` + `img:watch`)
- `docker-compose up` → `wp theme activate development`
- Vite Dev Server（ポート: 5173）＋ プラグイン用 Vite（5174）
- BrowserSync（ポート: 3000）でプロキシ＆フルリロード

### 2. 開発サーバーを停止

```bash
npm run down
```

- サーバーを停止します

#### 完全リセット（テーマ・DB・コンテナをクリーンアップ）

```bash
npm run destroy
```

- 開発環境の全データを破棄します

## 🎁 納品時のコマンド

## 🔧 環境設定

```bash
npm run build
```

- `src/config/theme-config.php` の `THEME_IS_DEV` を `false` に切り替え
- 画像を再生成
- テーマとプラグインを一括で Vite ビルド → `dist/` 出力

以下コマンドでプレビューできます。

```bash
npm run preview

```

問題なければ、`dist/` の中身を本番環境の

### `asset_url()` ヘルパー

```php
/**
 * アセット URL を返す
 *
 * - 開発中 (THEME_IS_DEV === true) → Vite サーバー (`THEME_VITE_SERVER`) から取得
 * - 本番時 (THEME_IS_DEV === false) → テーマディレクトリの `dist/assets` から取得
 *
 * @param string $path アセットへの相対パス（例: 'css/style.css'）
 * @return string 完全なアセット URL
 */
function asset_url(string $path = ''): string {
    if (THEME_IS_DEV) {
        $base = rtrim(THEME_VITE_SERVER, '/') . '/assets';
    } else {
        $base = get_template_directory_uri() . '/assets';
    }

    if ($path === '') {
        return $base;
    }

    return $base . '/' . ltrim($path, '/');
}
```

- `asset_url()` → `/assets`（本番） or `http://...:5173/assets`（開発）
- `asset_url('css/style.css')` → `/assets/css/style.css`（本番） or `http://...:5173/assets/css/style.css`（開発）

---

## 📦 まとめ

| フロー       | コマンド          | 説明                                          |
| ------------ | ----------------- | --------------------------------------------- |
| 開発開始     | `npm run dev`     | サーバー起動／ウォッチ／フルリロード          |
| 開発停止     | `npm run down`    | サーバーの停止                                |
| 完全リセット | `npm run destroy` | サーバーの全データ破棄                        |
| 納品ビルド   | `npm run build`   | `THEME_IS_DEV=false` → 画像再生成＋Viteビルド |
