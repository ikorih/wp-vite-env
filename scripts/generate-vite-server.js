// scripts/generate-vite-server.js
import os from 'os';
import fs from 'fs/promises';
import path from 'path';

// ネットワークインターフェイスから最初の非内部 IPv4 を取得
function getLocalIP() {
  const ifaces = os.networkInterfaces();
  for (const dev of Object.values(ifaces)) {
    for (const info of dev || []) {
      if (info.family === 'IPv4' && !info.internal) {
        return info.address;
      }
    }
  }
  return 'localhost';
}

const ip = getLocalIP();
const port = 5173; // Vite dev サーバーのポート

const content = `<?php
// このファイルは自動生成されます
// ローカル LAN IP を動的に取得してテーマ設定に渡す
define('THEME_VITE_SERVER', 'http://${ip}:${port}');
`;
const outPath = path.resolve(process.cwd(), 'src/config/vite-server-config.php');

await fs.mkdir(path.dirname(outPath), { recursive: true });
await fs.writeFile(outPath, content, 'utf-8');

console.log(`✅ THEME_VITE_SERVER を http://${ip}:${port} で生成しました`);
