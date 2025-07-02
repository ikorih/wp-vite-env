// scripts/export-db.js
/**
 *  SQLite ではなく MySQL/MariaDB の場合に、docker-compose の database サービスを使って
 *  mysqldump でダンプし、ホスト側の db/mysql ディレクトリに
 *  db_<YYYY>_<MM>_<DD>.sql というファイル名で保存するスクリプト
 *
 *  実行例:
 *    node scripts/export-db.js
 *
 *  動作フロー:
 *  1. .env を読込
 *  2. 今日の日付を YYYY_MM_DD 形式で取得し、ファイル名を決定
 *  3. db/mysql フォルダがなければ作成
 *  4. 古いダンプを .sql.bk 拡張子でリネーム（バックアップ保持）
 *  5. docker-compose exec -T database mysqldump -uUSER -pPASS DBNAME を実行
 *  6. STDOUT をファイルに書き出す
 */

import { exec } from 'child_process';
import fs from 'fs';
import path from 'path';
import { promisify } from 'util';
import dotenv from 'dotenv';

dotenv.config();

const execAsync = promisify(exec);
const { MYSQL_USER, MYSQL_PASS, MYSQL_NAME } = process.env;
if (!MYSQL_USER || !MYSQL_PASS || !MYSQL_NAME) {
  console.error(
    '❌ 環境変数が足りません: MYSQL_USER, MYSQL_PASS, MYSQL_NAME を .env に設定してください'
  );
  process.exit(1);
}

// 日付フォーマット (YYYY_MM_DD)
const now = new Date();
const yyyy = now.getFullYear();
const mm = String(now.getMonth() + 1).padStart(2, '0');
const dd = String(now.getDate()).padStart(2, '0');
const filename = `db_${yyyy}_${mm}_${dd}.sql`;

// ダンプ先ディレクトリ & ファイルパス
const dumpDir = path.resolve(process.cwd(), 'db/mysql');
const dumpPath = path.join(dumpDir, filename);
if (!fs.existsSync(dumpDir)) {
  fs.mkdirSync(dumpDir, { recursive: true });
  console.log(`🗂️ ディレクトリを作成: ${dumpDir}`);
}

// 既存の .sql ファイルを .sql.bk にリネーム（バックアップ保持）
fs.readdirSync(dumpDir)
  .filter((f) => f.endsWith('.sql') && !f.endsWith('.sql.bk'))
  .forEach((oldFile) => {
    const oldPath = path.join(dumpDir, oldFile);
    const backupPath = oldPath + '.bk';
    try {
      fs.renameSync(oldPath, backupPath);
      console.log(`⚠️ [export-db] バックアップリネーム: ${oldFile} → ${path.basename(backupPath)}`);
    } catch (err) {
      console.warn(`⚠️ [export-db] リネーム失敗: ${oldFile}: ${err.message}`);
    }
  });

// mysqldump 実行フロー
async function exportDb() {
  const dumpCmd = `docker-compose exec -T database mysqldump -u${MYSQL_USER} -p${MYSQL_PASS} ${MYSQL_NAME}`;
  console.log(`🗄️ [export-db] Running: ${dumpCmd}`);

  const child = exec(dumpCmd, { maxBuffer: 1024 * 1024 * 10 }, (error, stdout, stderr) => {
    if (error) {
      console.error(`❌ ダンプ実行中にエラー:\n${stderr || error}`);
      process.exit(1);
    }
  });

  const writeStream = fs.createWriteStream(dumpPath);
  child.stdout.pipe(writeStream);

  child.on('close', (code) => {
    if (code === 0) {
      console.log(`✅ データベースダンプ完了: ${dumpPath}`);
    } else {
      console.error(`❌ ダンププロセスが異常終了 (コード: ${code})`);
    }
  });
}

exportDb().catch((err) => {
  console.error(err);
  process.exit(1);
});
