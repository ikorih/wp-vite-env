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
import imagemin from 'imagemin';
import webp from 'imagemin-webp';
import { sync as globSync } from 'glob';

// コマンドライン引数をパース
const args = process.argv.slice(2);
const isDev = args.includes('--dev');
const isProd = args.includes('--prod') || !isDev;

// 定数
const WEBP_QUALITY = 65; // WebP 画質 (0-100)
const WEBP_DIR = 'src/assets/webp';
const SOURCE_GLOB = 'src/assets/img/**/*.{jpg,jpeg,png}';
const CACHE_FILE = path.join(WEBP_DIR, '.cache.json');

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
  await fs.ensureDir(WEBP_DIR);
  await fs.writeFile(CACHE_FILE, JSON.stringify(cache, null, 2), 'utf-8');
}

// 単一ファイル処理
async function processSingle(srcPath, cache) {
  const rel = path.relative('src/assets/img', srcPath);
  const webpDest = path.join(WEBP_DIR, rel.replace(path.extname(rel), '.webp'));

  try {
    const srcStat = await fs.stat(srcPath);

    // 変更なしならスキップ
    if (!isProd && cache[rel] === srcStat.mtimeMs) {
      console.warn(`⚠️ [WebP スキップ] 変更なし: ${rel}`);
      return { status: 'skipped' };
    }

    // 本番モードなら初回にディレクトリをクリーンアップ
    if (isProd && !cache.__cleaned) {
      console.log('🧹 [generate-images] --prod: WebP ディレクトリ初期化');
      await fs.emptyDir(WEBP_DIR);
      cache.__cleaned = true;
    }

    const buffer = await fs.readFile(srcPath);
    const webpBuf = await imagemin.buffer(buffer, { plugins: [webp({ quality: WEBP_QUALITY })] });
    await fs.ensureDir(path.dirname(webpDest));
    await fs.writeFile(webpDest, webpBuf);
    console.log(`✅ [WebP 作成] ${rel}`);

    cache[rel] = srcStat.mtimeMs;
    return { status: 'processed' };
  } catch (err) {
    console.warn(`⚠️ [WebP エラー] ${rel}: ${err.message}`);
    return { status: 'error' };
  }
}

// 全ファイル WebP 生成
async function generateAll() {
  const start = Date.now();
  const cache = await loadCache();
  const files = globSync(SOURCE_GLOB, { nodir: true });

  if (files.length === 0) {
    console.warn('⚠️ [generate-images] 対象ファイルが見つかりません');
    return;
  }

  // 並列処理
  const results = await Promise.all(files.map((file) => processSingle(file, cache)));
  await saveCache(cache);

  // サマリー
  const processedCount = results.filter((r) => r.status === 'processed').length;
  const errorCount = results.filter((r) => r.status === 'error').length;
  const elapsed = ((Date.now() - start) / 1000).toFixed(2);

  if (processedCount === 0) {
    console.warn(
      `⚠️ [generate-images] WebP 生成対象0件／総ファイル: ${files.length}／時間: ${elapsed}s`
    );
  } else {
    console.log(`🗂️ [generate-images] ${processedCount}件処理／${files.length}件中／${elapsed}s`);
  }
  if (errorCount > 0) {
    console.warn(`⚠️ [generate-images] エラー件数: ${errorCount}`);
  }
}

// 単一ファイル生成モード
async function generateSingle(singleSrc) {
  console.log(`🔄 [generate-images] 単一再生成: ${singleSrc}`);
  const cache = await loadCache();
  await processSingle(singleSrc, cache);
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
