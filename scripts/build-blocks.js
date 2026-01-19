// scripts/build-blocks.js
import { readdirSync, copyFileSync, mkdirSync, rmSync, existsSync } from 'fs';
import { promisify } from 'util';
import { exec } from 'child_process';
import path from 'path';
import chokidar from 'chokidar';

const execAsync = promisify(exec);
const pluginRoot = 'wordpress/wp-content/plugins/my-custom-block';
const srcBlocks = path.join(pluginRoot, 'src/blocks');
const outBlocks = path.join(pluginRoot, 'dist/blocks');
const isWatch = process.argv.includes('--watch');

// ---- utils --------------------------------------------------------------

function copyAllAssets(srcDir, destDir, indexJsPath) {
  const entries = readdirSync(srcDir, { withFileTypes: true });

  for (const entry of entries) {
    const srcPath = path.join(srcDir, entry.name);
    const destPath = path.join(destDir, entry.name);

    if (entry.isDirectory()) {
      mkdirSync(destPath, { recursive: true });
      copyAllAssets(srcPath, destPath, indexJsPath);
    } else {
      const isIndexJs = indexJsPath && path.resolve(srcPath) === path.resolve(indexJsPath);
      // index.js は wp-scripts の成果物が出力されるのでコピーしない
      if (!isIndexJs) {
        copyFileSync(srcPath, destPath);
        console.log(
          `✅ Copied ${path.relative(srcBlocks, srcPath)} → ${path.relative(process.cwd(), destPath)}`
        );
      }
    }
  }
}

// ---- build --------------------------------------------------------------

async function buildBlock(blockName) {
  const blockSrcDir = path.join(srcBlocks, blockName);
  const entryFile = path.join(blockSrcDir, 'index.js');
  const buildDir = path.join(outBlocks, blockName);

  // 出力先をクリーン
  rmSync(buildDir, { recursive: true, force: true });
  mkdirSync(buildDir, { recursive: true });

  if (existsSync(entryFile)) {
    console.log(`\n🔧 Building JS for block "${blockName}"...`);
    try {
      // exec はバッファ制限があるので余裕を持たせる
      await execAsync(`npx wp-scripts build ${entryFile} --output-path ${buildDir}`, {
        maxBuffer: 1024 * 1024 * 64,
      });
    } catch (err) {
      console.warn(`⚠️ [${blockName}] JS build failed: ${err?.message || err}`);
    }
  } else {
    console.warn(`⚠️ No index.js found for block "${blockName}", skipping JS build.`);
  }

  // 静的アセットを配置
  copyAllAssets(blockSrcDir, buildDir, entryFile);
}

async function buildAll() {
  const blockDirs = readdirSync(srcBlocks, { withFileTypes: true })
    .filter((d) => d.isDirectory())
    .map((d) => d.name);

  if (blockDirs.length === 0) {
    console.warn('⚠️ [build-blocks] No blocks found to build.');
    return;
  }

  console.log(`🛠️ [build-blocks] Building ${blockDirs.length} blocks in parallel...`);
  const start = Date.now();

  const results = await Promise.all(
    blockDirs.map(async (name) => {
      try {
        await buildBlock(name);
        return { name, status: 'built' };
      } catch (e) {
        console.warn(`⚠️ [${name}] build failed: ${e?.message || e}`);
        return { name, status: 'error' };
      }
    })
  );

  const builtCount = results.filter((r) => r.status === 'built').length;
  const errorCount = results.filter((r) => r.status === 'error').length;
  const elapsed = ((Date.now() - start) / 1000).toFixed(2);

  console.log(
    `📦 [build-blocks] Completed: ${builtCount}/${blockDirs.length} blocks in ${elapsed}s`
  );
  if (errorCount > 0) {
    console.warn(`⚠️ [build-blocks] Errors in ${errorCount} block(s)`);
  }
}

// ---- watch (debounce + in-flight guard) ---------------------------------

// ブロックごとのデバウンス用タイマー
const timers = new Map();
// 実行中のビルドを追跡（同一ブロックの多重ビルド防止）
const inFlight = new Set();

function scheduleBuild(blockName, delay = 120) {
  clearTimeout(timers.get(blockName));
  const t = setTimeout(() => runBuild(blockName), delay);
  timers.set(blockName, t);
}

async function runBuild(blockName) {
  // 多重実行ガード
  if (inFlight.has(blockName)) {
    // 進行中なら再度スケジュール（最後の変更を拾う）
    scheduleBuild(blockName, 120);
    return;
  }
  inFlight.add(blockName);
  try {
    await buildBlock(blockName);
  } catch (e) {
    console.warn(`⚠️ [${blockName}] rebuild failed: ${e?.message || e}`);
  } finally {
    inFlight.delete(blockName);
  }
}

// ---- main ---------------------------------------------------------------

(async () => {
  await buildAll();

  if (isWatch) {
    console.log('\n👀 Watching block sources for changes...');
    const watcher = chokidar.watch([srcBlocks, `${srcBlocks}/**/*`], {
      ignoreInitial: true,
      persistent: true,
    });

    watcher.on('all', (event, filePath) => {
      // 追加・変更・削除のいずれでも、属するブロック単位で再ビルド
      const rel = path.relative(srcBlocks, filePath);
      const [blockName] = rel.split(path.sep);
      if (!blockName) return;

      console.log(`\n🔄 [${event}] ${rel} → rebuild "${blockName}"`);
      scheduleBuild(blockName);
    });
  }
})();
