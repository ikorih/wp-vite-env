// vite-plugin-image-optimizer.js
import sharp from 'sharp';
import fs from 'fs/promises';
import path from 'path';
import { sync as globSync } from 'glob';

export default function imageOptimizerPlugin(options = {}) {
  const {
    outputDir = 'dist',
    supportedExts = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.avif'],
    generate = {
      inputExts: ['.jpg', '.jpeg', '.png'],
      outputExts: ['.webp', '.avif'],
    },
    jpegOptions = {},
    pngOptions = {},
    gifOptions = {},
    webpOptions = {},
    avifOptions = {},
  } = options;

  const extToFunction = {
    '.jpg': 'jpeg',
    '.jpeg': 'jpeg',
    '.png': 'png',
    '.gif': 'gif',
    '.webp': 'webp',
    '.avif': 'avif',
  };

  const extToOptions = {
    '.jpg': jpegOptions,
    '.jpeg': jpegOptions,
    '.png': pngOptions,
    '.gif': gifOptions,
    '.webp': webpOptions,
    '.avif': avifOptions,
  };

  async function optimizeFile(relPath) {
    const ext = path.extname(relPath);
    const func = extToFunction[ext];
    if (!func) {
      return;
    }
    const absPath = path.resolve(outputDir, relPath);
    const buffer = await fs.readFile(absPath);
    await sharp(buffer)
      [func](extToOptions[ext] || {})
      .toFile(absPath);
  }

  async function generateFormats(relPath) {
    const ext = path.extname(relPath);
    if (!generate.inputExts.includes(ext)) {
      return;
    }
    const basename = relPath.slice(0, -ext.length);
    const absInput = path.resolve(outputDir, relPath);
    const buffer = await fs.readFile(absInput);

    for (const outExt of generate.outputExts) {
      const func = extToFunction[outExt];
      if (!func) {
        continue;
      }
      const absOutput = path.resolve(outputDir, basename + outExt);
      await sharp(buffer)
        [func](extToOptions[outExt] || {})
        .toFile(absOutput);
    }
  }

  return {
    name: 'vite-plugin-sharp-image-optimizer',
    async writeBundle() {
      const patterns = supportedExts.map((ext) => `${outputDir}/**/*${ext}`);
      const files = patterns.flatMap((pattern) => globSync(pattern, { nodir: true }));

      for (const absPath of files) {
        const relPath = path.relative(outputDir, absPath);
        console.log(`[imageOptimizer] Processing: ${relPath}`);
        await optimizeFile(relPath);
        console.log(`[imageOptimizer] Optimized: ${relPath}`);
        // フォーマット生成設定が空でなければのみ呼び出し＆ログ出力
        if (generate.inputExts.length > 0 && generate.outputExts.length > 0) {
          await generateFormats(relPath);
          console.log(`[imageOptimizer] Formats generated for: ${relPath}`);
        }
      }
    },
  };
}
