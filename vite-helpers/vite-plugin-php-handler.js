// vite-helpers/vite-plugin-php-handler.js

import fs from "fs/promises";
import { globSync } from "glob";
import path from "path";
import { createFilter } from "@rollup/pluginutils";

export default function phpHandlerPlugin(options = {}) {
  const { include = "**/*.php", exclude } = options;

  const filter = createFilter(include, exclude);

  return {
    name: "vite-plugin-php-handler",

    // 1. PHPファイルの変更をウォッチ対象に追加
    configureServer(server) {
      const phpFiles = globSync("src/**/*.php");
      console.log("[php-handler] Watching PHP files:", phpFiles);

      server.watcher.add(phpFiles);

      server.watcher.on("change", (file) => {
        if (file.endsWith(".php")) {
          console.log("[php-handler] Changed:", file);
          server.ws.send({ type: "full-reload", path: "*" });
        }
      });
    },

    // 2. ビルド時に <img src="..."> を置換
    async generateBundle(_, bundle) {
      const phpFiles = await findPhpFiles("src"); // 任意のディレクトリを指定

      for (const filePath of phpFiles) {
        const content = await fs.readFile(filePath, "utf-8");
        const updated = content.replace(
          /<img\s+[^>]*src=["']([^"']+)["']/g,
          (match, srcPath) => {
            // ビルド後のアセットパスに変換
            const hashed = resolveAssetPath(srcPath, bundle);
            return match.replace(srcPath, hashed);
          },
        );
        const distPath = filePath.replace(/^src\//, "dist/"); // 出力先に調整
        await fs.mkdir(path.dirname(distPath), { recursive: true });
        await fs.writeFile(distPath, updated);
      }
    },
  };
}

// PHPファイル収集のユーティリティ
import { glob } from "glob";
async function findPhpFiles(baseDir) {
  return glob.sync(`${baseDir}/**/*.php`, { nodir: true });
}

// アセットの置換ロジック例（適宜カスタマイズ）
function resolveAssetPath(src, bundle) {
  const basename = path.basename(src);
  const match = Object.values(bundle).find((item) =>
    item.fileName.includes(basename),
  );
  return match ? `/assets/${match.fileName}` : src;
}
