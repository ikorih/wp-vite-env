/**
 * generate-images.js
 *
 * 使い方:
 *   - 開発時:  node generate-images.js --dev        （既存ファイルを残しつつ、変更があれば個別再生成）
 *   - 本番ビルド時: node generate-images.js --prod   （ディレクトリを空にしてから全ファイルを再生成）
 *
 * フラグを指定しない場合はデフォルトで「本番ビルド相当」の動作となります。
 */

import fs from 'fs-extra';
import path from 'path';
import sharp from 'sharp';
import { sync as globSync } from 'glob';

// コマンドライン引数をパース
const args = process.argv.slice(2);
const isDev = args.includes('--dev');
const isProd = args.includes('--prod') || !isDev;

// 定数
const WEBP_QUALITY = 65;
const AVIF_QUALITY = 50;
const WEBP_DIR = 'src/assets/webp';
const AVIF_DIR = 'src/assets/avif';
const SOURCE_GLOB = 'src/assets/img/**/*.{jpg,jpeg,png}';
const CACHE_FILE = 'src/assets/.image-cache.json';

// キャッシュ読み込み
async function loadCache() {
  try {
    const data = await fs.readFile(CACHE_FILE, 'utf-8');
    return JSON.parse(data);
  } catch {
    return {};
  }
}

// キャッシュ保存
async function saveCache(cache) {
  await fs.writeFile(CACHE_FILE, JSON.stringify(cache, null, 2), 'utf-8');
}

// 単一ファイル処理（WebP + AVIF）
async function processSingle(srcPath, cache, cleanedDirs) {
  const rel = path.relative('src/assets/img', srcPath);
  const baseName = rel.replace(path.extname(rel), '');
  const webpDest = path.join(WEBP_DIR, baseName + '.webp');
  const avifDest = path.join(AVIF_DIR, baseName + '.avif');

  try {
    const srcStat = await fs.stat(srcPath);

    // 変更なしならスキップ
    if (!isProd && cache[rel] === srcStat.mtimeMs) {
      return { status: 'skipped', rel };
    }

    // 本番モードなら初回にディレクトリをクリーンアップ
    if (isProd) {
      if (!cleanedDirs.webp) {
        console.log('🧹 [generate-images] --prod: WebP ディレクトリ初期化');
        await fs.emptyDir(WEBP_DIR);
        cleanedDirs.webp = true;
      }
      if (!cleanedDirs.avif) {
        console.log('🧹 [generate-images] --prod: AVIF ディレクトリ初期化');
        await fs.emptyDir(AVIF_DIR);
        cleanedDirs.avif = true;
      }
    }

    // 画像を読み込み
    const image = sharp(srcPath);

    // WebP 生成
    await fs.ensureDir(path.dirname(webpDest));
    await image.clone().webp({ quality: WEBP_QUALITY }).toFile(webpDest);

    // AVIF 生成
    await fs.ensureDir(path.dirname(avifDest));
    await image.clone().avif({ quality: AVIF_QUALITY }).toFile(avifDest);

    console.log(`✅ [WebP + AVIF] ${rel}`);

    cache[rel] = srcStat.mtimeMs;
    return { status: 'processed', rel };
  } catch (err) {
    console.warn(`⚠️ [エラー] ${rel}: ${err.message}`);
    return { status: 'error', rel };
  }
}

// 全ファイル生成
async function generateAll() {
  const start = Date.now();
  const cache = await loadCache();
  const cleanedDirs = { webp: false, avif: false };
  const files = globSync(SOURCE_GLOB, { nodir: true });

  if (files.length === 0) {
    console.warn('⚠️ [generate-images] 対象ファイルが見つかりません');
    return;
  }

  console.log(`📷 [generate-images] ${files.length} ファイルを処理中...`);

  // 並列処理
  const results = await Promise.all(files.map((file) => processSingle(file, cache, cleanedDirs)));
  await saveCache(cache);

  // サマリー
  const processedCount = results.filter((r) => r.status === 'processed').length;
  const skippedCount = results.filter((r) => r.status === 'skipped').length;
  const errorCount = results.filter((r) => r.status === 'error').length;
  const elapsed = ((Date.now() - start) / 1000).toFixed(2);

  console.log(`📦 [generate-images] 完了: ${processedCount}件処理, ${skippedCount}件スキップ / ${elapsed}s`);
  if (errorCount > 0) {
    console.warn(`⚠️ [generate-images] エラー件数: ${errorCount}`);
  }
}

// 単一ファイル生成モード
async function generateSingle(singleSrc) {
  console.log(`🔄 [generate-images] 単一再生成: ${singleSrc}`);
  const cache = await loadCache();
  const cleanedDirs = { webp: false, avif: false };
  await processSingle(singleSrc, cache, cleanedDirs);
  await saveCache(cache);
}

(async () => {
  try {
    const singleArg = args.find((a) => !a.startsWith('--'));
    if (singleArg) {
      await generateSingle(singleArg);
    } else {
      await generateAll();
    }
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
})();
