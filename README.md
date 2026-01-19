# WordPress + Vite + Docker + Tailwind CSS v4 開発環境

## 概要

WordPress テーマ開発を Vite / Docker / Tailwind CSS v4 で行うための開発環境です。

- **テーマソース**: `src/` で開発 → `release/{PRODUCTION_NAME}/` にビルド
- **Gutenberg カスタムブロック**: `wordpress/wp-content/plugins/my-custom-block/` で開発
- **画像最適化**: WebP / AVIF を自動生成

## 前提条件

- Docker Desktop
- Node.js >= 20
- npm

## セットアップ

```bash
# 1. 依存パッケージをインストール
npm install

# 2. 環境設定ファイルを作成
cp env .env

# 3. .env を編集（PRODUCTION_NAME など）
```

## 開発

```bash
npm run dev
```

- Docker コンテナ起動（WordPress / MySQL / phpMyAdmin）
- Vite Dev Server 起動（ポート 5173）
- 画像ウォッチ（WebP / AVIF 自動生成）
- CSS/JS は HMR、PHP 変更時は自動リロード
- ブラウザが自動で `http://localhost:8000` を開く
- **Ctrl+C で Docker・ポートも自動停止**

### アクセス先

| サービス | URL |
|----------|-----|
| 開発サイト | http://localhost:8000 |
| 管理画面 | http://localhost:8000/wp-admin |
| phpMyAdmin | http://localhost:8080 |

## ビルド・デプロイ

```bash
# 本番ビルド
npm run build

# ビルド結果をローカルで確認
npm run preview

# 本番サーバーへデプロイ
npm run wordmove:push:theme
```

ビルド出力先: `release/{PRODUCTION_NAME}/`

## 主要コマンド

| コマンド | 説明 |
|----------|------|
| `npm run dev` | 開発サーバー起動（Ctrl+C で全停止） |
| `npm run build` | 本番ビルド |
| `npm run preview` | ビルド結果をローカル確認 |
| `npm run down` | Docker 停止・ポート解放 |
| `npm run destroy` | 環境完全リセット（DB 含む） |

### データベース

| コマンド | 説明 |
|----------|------|
| `npm run db:export` | DB エクスポート |
| `npm run db:import` | DB インポート |

### デプロイ（Wordmove）

| コマンド | 説明 |
|----------|------|
| `npm run wordmove:push:theme` | テーマをデプロイ |
| `npm run wordmove:push:db` | DB をプッシュ |
| `npm run wordmove:pull:db` | DB をプル |

## ディレクトリ構成

```
├── src/                    # テーマソース（開発時マウント）
│   ├── assets/
│   │   ├── css/            # ITCSS 構成の CSS
│   │   ├── js/             # JavaScript
│   │   ├── img/            # 元画像
│   │   ├── webp/           # 自動生成 WebP
│   │   └── avif/           # 自動生成 AVIF
│   ├── inc/                # PHP インクルード
│   └── config/             # 設定ファイル
├── release/                # ビルド出力
├── wordpress/              # WordPress 本体（Docker 初回起動時に生成）
│   └── wp-content/
│       └── plugins/        # カスタムプラグイン
├── db/                     # DB ダンプ
└── config/                 # Docker 設定（php.ini, movefile）
```

## 開発/本番モードの切り替え

Docker 環境変数 `THEME_IS_DEV` で自動判定されます（手動切り替え不要）。

- `npm run dev` → 開発モード（Vite Dev Server から CSS/JS 読み込み）
- `npm run preview` → 本番モード（ビルド済みファイル読み込み）

## アセット読み込み

### 画像などの静的ファイル

```php
<img src="<?php echo esc_url(get_template_directory_uri() . '/assets/img/logo.svg'); ?>">
```

### CSS / JS

`wp_head()` で自動的に読み込まれます（`inc/vite-helper.php`）。

- 開発時: Vite Dev Server から HMR 付きで読み込み
- 本番時: `manifest.json` からハッシュ付きファイルを解決

## CSS 設計

ITCSS + BEM を採用しています。

| レイヤー | プレフィックス | 用途 |
|----------|----------------|------|
| `_config/` | - | 変数、カスタムメディアクエリ |
| `_base/` | - | リセット、基本スタイル |
| `_layout/` | `l-` | レイアウト（ヘッダー、フッター） |
| `_modules/` | `c-` | コンポーネント（ボタン、カード） |

### カスタムメディアクエリ

```css
/* _config/_custom-media.css */
@custom-media --media-tablet (min-width: 570px);
@custom-media --media-pc (min-width: 990px);

/* 使用例 */
.element {
  font-size: 14px;
  @media (--media-pc) {
    font-size: 16px;
  }
}
```

## 画像最適化

`src/assets/img/` に画像を配置すると、WebP と AVIF が自動生成されます。

```bash
# 手動で全画像を再生成
npm run img:gen:prod
```

## トラブルシューティング

### ポートが使用中の場合

```bash
npm run kill-ports
```

### 環境を完全にリセットしたい場合

```bash
npm run destroy
npm run dev
```
