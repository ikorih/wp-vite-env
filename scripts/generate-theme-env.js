// scripts/generate-theme-env.js
import fs from 'fs/promises';
import path from 'path';

// npm script の第一引数 (e.g. "--dev" or "--prod")
const mode = process.argv[2] === '--prod' ? 'prod' : 'dev';
const flag = mode === 'dev' ? 'true' : 'false';

const content = `<?php
// このファイルは自動生成されます
// 開発時 (TRUE)、本番時 (FALSE) を切り替える
define('THEME_IS_DEV', ${flag});
`;
const outPath = path.resolve(process.cwd(), 'src/config/theme-env.php');

await fs.mkdir(path.dirname(outPath), { recursive: true });
await fs.writeFile(outPath, content, 'utf-8');

console.log(`✅ theme-env.php generated: THEME_IS_DEV = ${flag}`);
