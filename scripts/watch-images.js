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

// 監視対象パターン
const watchPattern = 'src/assets/img/**/*.{jpg,jpeg,png}';

// chokidar でファイルを監視
const watcher = watch(watchPattern, {
  ignoreInitial: true,
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

console.log(`👀 [watch-images] ${watchPattern} を監視中...`);
