// scripts/watch-images.js
import { watch } from 'chokidar';
import { spawn } from 'child_process';

// 監視対象パターン
const watchPattern = 'src/assets/img/**/*.{jpg,jpeg,png}';

// chokidar でファイルを監視
const watcher = watch(watchPattern, {
  ignoreInitial: true,
});

function generateImages(event, path) {
  console.log(`🔄 [watch-images] Detected ${event} on ${path}. Regenerating images...`);
  const cmd = spawn('npm', ['run', 'img:gen'], { stdio: 'inherit', shell: true });
  cmd.on('close', (code) => {
    if (code === 0) {
      console.log('✅ [watch-images] Image generation complete.');
    } else {
      console.error(`❌ [watch-images] Image generation failed with code ${code}.`);
    }
  });
}

watcher
  .on('add', (file) => generateImages('add', file))
  .on('change', (file) => generateImages('change', file))
  .on('unlink', (file) => generateImages('unlink', file));

console.log(`👀 [watch-images] Watching ${watchPattern} for changes...`);
