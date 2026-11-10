/**
 * @wordpress/scripts の既定 webpack 設定を拡張。
 *
 * - ソース: リポジトリ直下 /blocks（npm スクリプトで --webpack-src-dir=blocks を指定）
 * - 出力先: src/blocks（dev のテーマソース内。prod は copyStaticPlugin が release へコピー）
 *
 * package.json は "type": "module" のため ESM で記述し、
 * CommonJS の既定設定は createRequire 経由で読み込む。
 */
import path from 'path';
import { createRequire } from 'module';

const require = createRequire(import.meta.url);
const defaultConfig = require('@wordpress/scripts/config/webpack.config');

const outputPath = path.resolve(process.cwd(), 'src/blocks');

const withOutput = (config) => ({
  ...config,
  output: {
    ...config.output,
    path: outputPath,
  },
});

export default Array.isArray(defaultConfig)
  ? defaultConfig.map(withOutput)
  : withOutput(defaultConfig);
