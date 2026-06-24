// scripts/import-db.js

/**
 *  db/mysql 以下にある .sql ファイルを選択し、
 *  docker-compose exec -T database mysql -uUSER -pPASS DBNAME < 選択ファイル
 *  という流れでインポートするスクリプト
 *
 *  実行例:
 *    node scripts/import-db.js
 *
 *  動作フロー:
 *  1. .env を読込
 *  2. db/mysql フォルダを走査し、拡張子 .sql の一覧を取得
 *  3. ファイル一覧を番号付きで表示し、どれをインポートするかユーザーにプロンプト
 *  4. 選択された SQL ファイルを読み込み、docker-compose exec -T database mysql -uUSER -pPASS DBNAME に stdin で流し込む
 */

import fs from 'fs';
import path from 'path';
import readline from 'readline';
import { spawn, execSync } from 'child_process';

// dotenv を使って .env から環境変数を読み込む
import dotenv from 'dotenv';
dotenv.config();

// ---- docker compose コマンド検出 ----
// v2 (docker compose) と v1 (docker-compose) の両方に対応
const composeCmd = (() => {
  try {
    execSync('docker compose version', { stdio: 'ignore' });
    return ['docker', ['compose']];
  } catch {
    return ['docker-compose', []];
  }
})();

// 必須環境変数のチェック
const { MYSQL_USER, MYSQL_PASS, MYSQL_NAME } = process.env;
if (!MYSQL_USER || !MYSQL_PASS || !MYSQL_NAME) {
  console.error(
    '❌ 環境変数が足りません: MYSQL_USER, MYSQL_PASS, MYSQL_NAME を .env に設定してください'
  );
  process.exit(1);
}

// SQL ファイルが置かれているディレクトリ
const dumpDir = path.resolve(process.cwd(), 'db/mysql');

// db/mysql が存在しない or ファイルがない場合
if (!fs.existsSync(dumpDir)) {
  console.error(`❌ ディレクトリが見つかりません: ${dumpDir}`);
  process.exit(1);
}

const sqlFiles = fs
  .readdirSync(dumpDir)
  .filter((f) => f.endsWith('.sql'))
  .sort((a, b) => a.localeCompare(b)); // ファイル名でソート

if (sqlFiles.length === 0) {
  console.error(`❌ SQL ファイルが見つかりません: ${dumpDir}/*.sql`);
  process.exit(1);
}

// 番号付きで一覧を出力
console.log('🎯 インポート可能な SQL ファイル一覧:');
sqlFiles.forEach((file, idx) => {
  console.log(`  [${idx}] ${file}`);
});

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

// ユーザーに何番をインポートするか入力を促す
rl.question('→ インポートするファイルの番号を入力してください: ', (answer) => {
  rl.close();
  const idx = Number(answer);
  if (Number.isNaN(idx) || idx < 0 || idx >= sqlFiles.length) {
    console.error('❌ 正しい番号を入力してください。');
    process.exit(1);
  }

  const selectedFile = sqlFiles[idx];
  const fullPath = path.join(dumpDir, selectedFile);
  console.log(`⏳ ${selectedFile} をインポート中...`);

  // docker compose exec -T -e MYSQL_PWD=... database mysql -uUSER DBNAME
  //  - MYSQL_PWD: パスワードを環境変数経由で渡し、ps出力に残さない（mysql の警告も回避）
  const importCmd = [
    ...composeCmd[1],
    'exec',
    '-T',
    '-e',
    `MYSQL_PWD=${MYSQL_PASS}`,
    'database',
    'mysql',
    `-u${MYSQL_USER}`,
    '--default-character-set=utf8mb4',
    MYSQL_NAME,
  ];
  const child = spawn(composeCmd[0], importCmd, { stdio: ['pipe', 'inherit', 'inherit'] });

  // 選択されたファイルを読み込み、stdin に流し込む
  const readStream = fs.createReadStream(fullPath);
  readStream.pipe(child.stdin);

  child.on('close', (code) => {
    if (code === 0) {
      console.log(`✅ インポート完了: ${selectedFile}`);
    } else {
      console.error(`❌ インポート時にエラーが発生しました (コード: ${code})`);
    }
  });
});
