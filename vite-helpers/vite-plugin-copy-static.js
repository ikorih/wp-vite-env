// vite-helpers/vite-plugin-copy-static.js
import fs from 'fs/promises';
import path from 'path';
import { sync as globSync } from 'glob';

/**
 * Vite plugin to copy multiple sets of static asset files from source to destination during build,
 * with optional ignore patterns and directory structure preserved.
 *
 * @param {{ targets: { src: string, dest: string, ignore?: string[] }[] }} options
 */
export default function copyStaticPlugin(options = {}) {
  const { targets = [] } = options;

  return {
    name: 'vite-plugin-copy-static',

    async writeBundle() {
      const root = process.cwd();
      const dist = process.env.VITE_OUT_DIR || 'dist';

      for (const { src, dest, ignore = [] } of targets) {
        // glob パターンにマッチするファイルを取得（ignore があれば除外）
        const files = globSync(src, { nodir: true, ignore });
        if (!files.length) continue;

        // src にワイルドカードが含まれるか判定
        const hasGlob = src.includes('*');
        // ワイルドカード付きの場合はパターン部分を取り除く
        // そうでない場合は dirname を baseDir とする
        const baseDir = hasGlob ? src.replace(/(\*.*$)/, '').replace(/\/$/, '') : path.dirname(src);

        for (const file of files) {
          // baseDir からの相対パスを取得。
          // 結果が空文字の場合はファイル名を使う
          const rel = path.relative(baseDir, file) || path.basename(file);
          // dist/<dest>/<rel> へ書き出し
          const destPath = path.resolve(root, dist, dest, rel);

          await fs.mkdir(path.dirname(destPath), { recursive: true });
          await fs.copyFile(file, destPath);
          this.warn(`Copied static asset: ${file} → ${dest}/${rel}`);
        }
      }
    },
  };
}
