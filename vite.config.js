// vite.config.js
import { defineConfig } from 'vite';
import path from 'path';
import { globSync } from 'glob';
import phpHandlerPlugin from './vite-helpers/vite-plugin-php-handler.js';
import imageOptimizerPlugin from './vite-helpers/vite-plugin-image-optimizer.js';
import copyStaticPlugin from './vite-helpers/vite-plugin-copy-static.js';
import eslintPlugin from 'vite-plugin-eslint';
import VitePluginBrowserSync from 'vite-plugin-browser-sync';

import tailwindcss from '@tailwindcss/vite';

import postcssPresetEnv from 'postcss-preset-env';

// JS と CSS ファイルを動的にエントリに追加
const inputEntries = Object.fromEntries(
  [...globSync('src/assets/js/*.js'), ...globSync('src/assets/css/*.css')].map((file) => [
    path.relative('src', file).replace(/\.[^.]+$/, ''), // 拡張子なし
    path.resolve(__dirname, file),
  ])
);

export default defineConfig({
  root: 'src',
  plugins: [
    phpHandlerPlugin(),
    copyStaticPlugin({
      targets: [
        { src: 'src/assets/img/**/*', dest: 'assets/img' },
        { src: 'src/assets/webp/**/*', dest: 'assets/webp' },
        { src: 'src/assets/avif/**/*', dest: 'assets/avif' },
        { src: 'src/style.css', dest: '' },
        {
          src: 'src/**/*',
          dest: '',
          ignore: ['**/*.php', '**/*.{php,jpg,jpeg,gif,png,svg,webp,avif,css,js}'],
        },
      ],
    }),
    imageOptimizerPlugin({
      outputDir: path.resolve(__dirname, 'dist'),
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
    VitePluginBrowserSync({
      dev: {
        bs: {
          proxy: 'http://localhost:8000', // wp-env の WordPress 本体
          port: 3000, // BrowserSync を 3030 で起動
          ui: { port: 3001 }, // （任意）UI ポート
          files: [
            // 変更を監視して自動リロード
            'src/**/*.php',
            'dist/assets/**/*.{css,js}',
          ],
        },
      },
    }),
  ],
  base: './',
  publicDir: false,
  build: {
    outDir: '../dist',
    rollupOptions: {
      input: inputEntries,
      output: {
        // JS の出力先（関数化して basename だけ使う）
        entryFileNames: (chunkInfo) => {
          // chunkInfo.name は "assets/js/app" のような文字列
          const base = path.basename(chunkInfo.name); // → "app"
          return `assets/js/${base}.js`;
        },
        chunkFileNames: (chunkInfo) => {
          const base = path.basename(chunkInfo.name);
          return `assets/js/${base}.js`;
        },

        // 画像・フォント・CSS などその他アセットは assetFileNames で振り分け
        assetFileNames: (assetInfo) => {
          // assetInfo.name か fileName どちらかにオリジナル名が入ります
          const original = assetInfo.name || assetInfo.fileName || '';
          const ext = path.extname(original);
          const base = path.basename(original); // 例: 'style.css'

          // CSS ファイルは css/ フォルダに
          if (ext === '.css') {
            return `assets/css/${base}`;
          }

          // その他は assets/ 直下
          return `assets/${base}`;
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
  },

  css: {
    devSourcemap: true,
    postcss: {
      plugins: [postcssPresetEnv()],
    },
  },
});
