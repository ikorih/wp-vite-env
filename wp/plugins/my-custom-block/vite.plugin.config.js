// wp/plugins/my-custom-block/vite.plugin.config.js

import { defineConfig } from 'vite';
import path from 'path';
import { sync as globSync } from 'glob';
import react from '@vitejs/plugin-react';

// 「my-custom-block」プラグイン用の Vite 設定ファイル
// JSX を Gutenberg（wp.element）で動作するようにクラシックランタイムに変換し、
// WordPress の各パッケージを外部依存に設定してバンドルから除外します。
export default defineConfig(({ command }) => {
  // serve なら開発モード、それ以外(build)は本番モード
  const isDev = command === 'serve';

  return {
    // ソースのルートディレクトリ：blocks 以下の index.jsx を検出
    root: path.resolve(__dirname, 'src'),

    // ブラウザでのベースパスを相対に設定
    base: './',

    // publicDir を無効化（テーマ側で静的ファイルを管理）
    publicDir: false,

    // 開発サーバー設定
    server: {
      host: true, // 0.0.0.0 バインドで LAN アクセスを許可
      port: 5174, // 固定ポート
      strictPort: true, // ポート使用中はエラーに
      origin: 'http://localhost:5174', // PHP 側での読み込み先と合わせる
    },

    plugins: [
      // JSX を wp.element.createElement に変換（classic ランタイム）
      react({
        jsxRuntime: 'classic',
        pragma: 'wp.element.createElement',
        pragmaFrag: 'wp.element.Fragment',
      }),
    ],

    build: {
      // 出力先ディレクトリ
      outDir: path.resolve(__dirname, 'dist/blocks'),
      emptyOutDir: true, // ビルド前にクリア

      rollupOptions: {
        // ブロックごとのエントリを自動検出
        input: Object.fromEntries(
          globSync(path.resolve(__dirname, 'src/blocks/*/index.{js,jsx}')).map((file) => {
            const name = path.basename(path.dirname(file));
            return [name, file];
          })
        ),

        // WordPress パッケージをバンドルから除外
        external: [
          '@wordpress/blocks',
          '@wordpress/i18n',
          '@wordpress/block-editor',
          '@wordpress/components',
          'wp.element',
        ],

        output: {
          // JS は blocks/<name>/index.js に出力
          entryFileNames: '[name]/index.js',
          // アセットは blocks/<name>/ 配下に配置
          assetFileNames: '[name]/[name][extname]',
        },
      },

      // 開発時のみソースマップ、本番は圧縮
      sourcemap: isDev,
      minify: !isDev,
    },
  };
});
