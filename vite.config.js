// vite.config.js
import { defineConfig } from 'vite';
import path from 'path';
import { globSync } from 'glob';
import dotenv from 'dotenv';
import imageOptimizerPlugin from './vite-helpers/vite-plugin-image-optimizer.js';
import copyStaticPlugin from './vite-helpers/vite-plugin-copy-static.js';
import eslintPlugin from 'vite-plugin-eslint';
import fullReload from 'vite-plugin-full-reload';

import tailwindcss from '@tailwindcss/vite';

import postcssPresetEnv from 'postcss-preset-env';

// .env からテーマ名を取得
dotenv.config();
const THEME_NAME = process.env.PRODUCTION_NAME || 'theme';
const OUTPUT_DIR = `../release/${THEME_NAME}`;

// JS と CSS ファイルを動的にエントリに追加
// キー名はファイル名のみ（パスなし）にして、output設定でパスを指定
const inputEntries = Object.fromEntries(
  [...globSync('src/assets/js/*.js'), ...globSync('src/assets/css/*.css')].map((file) => [
    path.basename(file, path.extname(file)), // ファイル名のみ（拡張子なし）
    path.resolve(__dirname, file),
  ])
);

export default defineConfig({
  root: 'src',
  plugins: [
    copyStaticPlugin({
      targets: [
        { src: 'src/**/*.php', dest: '', ignore: ['**/vite-server-config.php'] },
        { src: 'src/assets/img/**/*', dest: 'assets/img' },
        { src: 'src/assets/webp/**/*', dest: 'assets/webp' },
        { src: 'src/assets/avif/**/*', dest: 'assets/avif' },
        { src: 'src/style.css', dest: '' },
      ],
    }),
    imageOptimizerPlugin({
      outputDir: path.resolve(__dirname, OUTPUT_DIR.replace('../', '')),
      supportedExts: ['.jpg', '.jpeg', '.png', '.webp', '.avif'],
      // generateFormats は不要 → 空配列
      generate: { inputExts: [], outputExts: [] },
      jpegOptions: { quality: 80 }, // 必要に応じて
      pngOptions: { compressionLevel: 8 },
      webpOptions: { quality: 75 },
      avifOptions: { quality: 50 },
    }),
    tailwindcss(),
    eslintPlugin({
      // save 時だけ走らせる
      emitWarning: true,
      emitError: false,
      failOnError: false,
      // キャッシュ有効化で 2 回目以降は速い
      cache: true,
    }),
    fullReload(['src/**/*.php'], { delay: 100 }),
  ],
  base: './',
  publicDir: false,
  build: {
    outDir: OUTPUT_DIR,
    rollupOptions: {
      input: inputEntries,
      output: {
        // JS の出力先（ハッシュ付き）
        entryFileNames: 'assets/js/[name]-[hash].js',
        chunkFileNames: 'assets/js/[name]-[hash].js',

        // 画像・フォント・CSS などその他アセット（ハッシュ付き）
        assetFileNames: (assetInfo) => {
          const original = assetInfo.name || assetInfo.fileName || '';
          const ext = path.extname(original);

          // CSS ファイルは css/ フォルダに
          if (ext === '.css') {
            return 'assets/css/[name]-[hash][extname]';
          }

          // その他は assets/ 直下
          return 'assets/[name]-[hash][extname]';
        },
      },
    },
    assetsInlineLimit: 0, // base64 URL としてインライン化させない
    manifest: true, // マニフェストファイルを生成するかどうか
    emptyOutDir: true, // 明示的に削除を許可
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
    },
  },
  server: {
    host: true,
    strictPort: true, // error if port busy
    port: 5173, // your plugin dev port
    cors: true,
  },

  css: {
    devSourcemap: true,
    postcss: {
      plugins: [
        postcssPresetEnv({
          // Stage 2 以上の機能を有効化（デフォルト）
          stage: 2,
          features: {
            // 使用する機能
            'custom-media-queries': true, // @custom-media
            'nesting-rules': true, // CSS Nesting（ブラウザフォールバック用）
            // 無効化する機能
            'cascade-layers': false, // Tailwind CSS v4 の @layer と競合するため
          },
          // browserslist は package.json から自動読み込み
          autoprefixer: { grid: true },
        }),
      ],
    },
  },
});
