/**
 * watch-images.js
 *
 * chokidar で画像フォルダを監視し、
 * 追加・変更時には「generate-images.js --dev 変更ファイルパス」を実行、
 * 削除時には対応する WebP/AVIF を削除します。
 */

import { watch } from 'chokidar';
import { spawn } from 'child_process';
import fs from 'fs-extra';
import path from 'path';

// 監視対象ディレクトリと対象拡張子
// chokidar は v4 以降で glob パターン（**/*.{jpg,...}）を廃止したため、
// ディレクトリを監視しつつ ignored 関数で拡張子を絞り込む方式を使う。
const watchDir = 'src/assets/img';
const imageExtRe = /\.(jpe?g|png)$/i;

// chokidar でファイルを監視
const watcher = watch(watchDir, {
  ignoreInitial: true,
  // ファイルかつ対象拡張子以外は無視（ディレクトリは監視して再帰的にたどる）
  ignored: (targetPath, stats) => Boolean(stats?.isFile() && !imageExtRe.test(targetPath)),
});

async function removeDerivedFiles(srcPath) {
  const rel = path.relative('src/assets/img', srcPath);
  const ext = path.extname(rel);
  const basename = rel.slice(0, -ext.length);

  const webpPath = path.join('src/assets/webp', basename + '.webp');
  const avifPath = path.join('src/assets/avif', basename + '.avif');

  try {
    await fs.remove(webpPath);
    await fs.remove(avifPath);
    console.log(`🗑️ [watch-images] 削除: ${webpPath}`);
    console.log(`🗑️ [watch-images] 削除: ${avifPath}`);
  } catch {
    // 削除失敗は無視（存在しないなど）
  }
}

function generateSingle(srcPath) {
  console.log(`🔄 [watch-images] ファイル変更検知: ${srcPath}`);
  // --dev フラグ付きで単一ファイル処理
  const cmd = spawn('node', ['scripts/generate-images.js', '--dev', srcPath], {
    stdio: 'inherit',
    shell: true,
  });
  cmd.on('close', (code) => {
    if (code === 0) {
      console.log('✅ [watch-images] 単一画像生成完了');
    } else {
      console.error(`❌ [watch-images] 画像生成に失敗しました (code: ${code})`);
    }
  });
}

watcher
  .on('add', (file) => generateSingle(file))
  .on('change', (file) => generateSingle(file))
  .on('unlink', (file) => removeDerivedFiles(file));

console.log(`👀 [watch-images] ${watchDir} 配下の画像(jpg/jpeg/png)を監視中...`);
