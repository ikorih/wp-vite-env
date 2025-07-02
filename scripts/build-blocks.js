// scripts/build-blocks.js
import { readdirSync, copyFileSync, mkdirSync, rmSync, statSync, existsSync } from 'fs';
import { promisify } from 'util';
import { exec } from 'child_process';
import path from 'path';
import chokidar from 'chokidar';

const execAsync = promisify(exec);
const pluginRoot = 'wp/plugins/my-custom-block';
const srcBlocks = path.join(pluginRoot, 'src/blocks');
const outBlocks = path.join(pluginRoot, 'dist/blocks');
const isWatch = process.argv.includes('--watch');

function copyAllAssets(srcDir, destDir, indexJsPath) {
  const entries = readdirSync(srcDir, { withFileTypes: true });

  entries.forEach((entry) => {
    const srcPath = path.join(srcDir, entry.name);
    const destPath = path.join(destDir, entry.name);

    if (entry.isDirectory()) {
      mkdirSync(destPath, { recursive: true });
      copyAllAssets(srcPath, destPath, indexJsPath);
    } else {
      const isIndexJs = indexJsPath && path.resolve(srcPath) === path.resolve(indexJsPath);
      if (!isIndexJs) {
        copyFileSync(srcPath, destPath);
        console.log(
          `✅ Copied ${path.relative(srcBlocks, srcPath)} → ${path.relative(process.cwd(), destPath)}`
        );
      }
    }
  });
}

async function buildBlock(blockName) {
  const blockSrcDir = path.join(srcBlocks, blockName);
  const entryFile = path.join(blockSrcDir, 'index.js');
  const buildDir = path.join(outBlocks, blockName);

  rmSync(buildDir, { recursive: true, force: true });
  mkdirSync(buildDir, { recursive: true });

  if (existsSync(entryFile)) {
    console.log(`\n🔧 Building JS for block "${blockName}"...`);
    try {
      await execAsync(`npx wp-scripts build ${entryFile} --output-path ${buildDir}`);
    } catch (err) {
      console.warn(`⚠️ [${blockName}] JS build failed: ${err.message}`);
    }
  } else {
    console.warn(`⚠️ No index.js found for block "${blockName}", skipping JS build.`);
  }

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
      } catch {
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

if (isWatch) {
  buildAll();
  console.log('\n👀 Watching block sources for changes...');
  chokidar.watch(`${srcBlocks}/**/*`, { ignoreInitial: true }).on('all', (event, filePath) => {
    const rel = path.relative(srcBlocks, filePath);
    const [blockName] = rel.split(path.sep);
    console.log(`\n🔄 [${event}] ${rel}, rebuilding "${blockName}"`);
    buildBlock(blockName);
  });
} else {
  buildAll();
}
