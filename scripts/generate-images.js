// scripts/generate-images.js
import fs from 'fs-extra';
import path from 'path';
import imagemin from 'imagemin';
import webp from 'imagemin-webp';
import avif from 'imagemin-avif';
import { sync as globSync } from 'glob';

async function generate() {
  // クリーンアップ: 古いファイルを削除（不要なPNGなどを除去）
  await fs.emptyDir('src/assets/webp');
  await fs.emptyDir('src/assets/avif');

  // 対象画像ファイルを再帰的に取得
  const files = globSync('src/assets/img/**/*.{jpg,jpeg,png}', { nodir: true });

  for (const file of files) {
    // src/assets/img 以下の相対パスを取得
    const rel = path.relative('src/assets/img', file);
    const ext = path.extname(rel);
    const basename = rel.slice(0, -ext.length);
    const buffer = await fs.readFile(file);

    // WebP 生成
    const webpDest = path.join('src/assets/webp', basename + '.webp');
    await fs.ensureDir(path.dirname(webpDest));
    const webpBuf = await imagemin.buffer(buffer, { plugins: [webp({ quality: 90 })] });
    await fs.writeFile(webpDest, webpBuf);

    // AVIF 生成
    const avifDest = path.join('src/assets/avif', basename + '.avif');
    await fs.ensureDir(path.dirname(avifDest));
    const avifBuf = await imagemin.buffer(buffer, { plugins: [avif({ quality: 90 })] });
    await fs.writeFile(avifDest, avifBuf);

    console.log(`✅ Generated: ${webpDest}`);
    console.log(`✅ Generated: ${avifDest}`);
  }
}

generate().catch((err) => {
  console.error(err);
  process.exit(1);
});
