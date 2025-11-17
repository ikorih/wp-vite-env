/**
 * ---------------------------------------------
 *  scripts/export-db.js
 * ---------------------------------------------
 *  MySQL / MariaDB 用のデータベースダンプスクリプト。
 *  Docker Compose 環境下で `database` サービス内の mysqldump を呼び出し、
 *  出力をホスト側の ./db/mysql/ フォルダに保存します。
 *
 *  ＜動作例＞
 *    node scripts/export-db.js
 *
 *  ＜動作概要＞
 *  1. .env から MySQL 接続情報を読み込む
 *  2. 当日日付（YYYY_MM_DD）でファイル名を生成
 *  3. ./db/mysql/ ディレクトリを作成（存在しない場合）
 *  4. 既存の .sql を .sql.bk にリネームしてバックアップ保持
 *  5. docker-compose exec 経由で mysqldump 実行
 *  6. STDOUT をファイルに直接ストリーム保存（メモリ溢れ防止）
 *
 *  ※ Node.js v18+ 推奨（ESMモジュール対応）
 *  ※ docker-compose v1/v2 どちらでも動作（自動検出）
 */

import { spawn } from 'child_process';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';

dotenv.config();

// ---- 環境変数チェック ----
const { MYSQL_USER, MYSQL_PASS, MYSQL_NAME } = process.env;
if (!MYSQL_USER || !MYSQL_PASS || !MYSQL_NAME) {
  console.error('❌ MYSQL_USER, MYSQL_PASS, MYSQL_NAME を .env に設定してください');
  process.exit(1);
}

// ---- docker compose コマンド検出 ----
// v2 (docker compose) と v1 (docker-compose) の両方に対応
const composeCmd = (() => {
  try {
    require('child_process').execSync('docker compose version', { stdio: 'ignore' });
    return ['docker', ['compose']];
  } catch {
    return ['docker-compose', []];
  }
})();

// ---- 日付付きファイル名を生成 ----
const now = new Date();
const yyyy = now.getFullYear();
const mm = String(now.getMonth() + 1).padStart(2, '0');
const dd = String(now.getDate()).padStart(2, '0');
const filename = `db_${yyyy}_${mm}_${dd}.sql`;

// ---- 出力ディレクトリを確認／作成 ----
const dumpDir = path.resolve(process.cwd(), 'db/mysql');
const dumpPath = path.join(dumpDir, filename);
if (!fs.existsSync(dumpDir)) {
  fs.mkdirSync(dumpDir, { recursive: true });
  console.log(`🗂️ ディレクトリ作成: ${dumpDir}`);
}

// ---- 古い .sql をバックアップ (.sql.bk にリネーム) ----
// 既存のダンプを残しておきたい場合の保険
for (const f of fs.readdirSync(dumpDir)) {
  if (f.endsWith('.sql') && !f.endsWith('.sql.bk')) {
    try {
      fs.renameSync(path.join(dumpDir, f), path.join(dumpDir, f + '.bk'));
      console.log(`⚠️ バックアップ退避: ${f} → ${f}.bk`);
    } catch (e) {
      console.warn(`⚠️ リネーム失敗: ${f}: ${e.message}`);
    }
  }
}

// ---- mysqldump 実行コマンドを組み立て ----
// 安全で高速なダンプオプションを指定
//  - MYSQL_PWD: パスワードを環境変数経由で渡し、ps出力に残さない
//  - --single-transaction: InnoDBをロックせず整合性を保つ
//  - --quick: 大規模テーブルをストリーミングで処理（メモリ節約）
//  - --lock-tables=false: グローバルロックを無効化
//  - --set-gtid-purged=OFF: GTID環境で警告を避ける
//  - --routines, --triggers, --events: 追加構造も含めて完全バックアップ
const dumpArgs = [
  ...composeCmd[1],
  'exec',
  '-T',
  'database',
  'sh',
  '-lc',
  `MYSQL_PWD="${MYSQL_PASS}" mysqldump \
    --user="${MYSQL_USER}" \
    --default-character-set=utf8mb4 \
    --single-transaction \
    --quick \
    --lock-tables=false \
    --set-gtid-purged=OFF \
    --routines --triggers --events \
    "${MYSQL_NAME}"`
];

console.log(`🗄️ 実行コマンド: ${[composeCmd[0], ...dumpArgs].join(' ')}`);

// ---- ストリームでファイルへ書き出し ----
// execではなくspawnを使用し、標準出力をそのままファイルにパイプ
// （巨大DBでもバッファオーバーフローしない）
const out = fs.createWriteStream(dumpPath, { flags: 'w' });
const cp = spawn(composeCmd[0], dumpArgs, { stdio: ['ignore', 'pipe', 'pipe'] });

// 標準出力 → SQLファイル
cp.stdout.pipe(out);

// 標準エラー → コンソールにそのまま表示
cp.stderr.on('data', (d) => process.stderr.write(d));

// ---- プロセス終了ハンドリング ----
cp.on('close', (code) => {
  out.end();
  if (code === 0) {
    console.log(`✅ ダンプ完了: ${dumpPath}`);
  } else {
    console.error(`❌ 異常終了 (code=${code})`);
    // 失敗時は中途半端なファイルを削除
    try {
      fs.unlinkSync(dumpPath);
    } catch {}
    process.exit(code || 1);
  }
});
