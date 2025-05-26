// vite-plugin-browsersync.js
import browserSync from 'browser-sync';

/**
 * Vite plugin to proxy WP-env via BrowserSync for cross-device sync.
 * @param {{
 *   proxy?: string,
 *   port?: number,
 *   files?: string[],
 *   rewriteRules?: { match: RegExp, replace: string }[]
 * }} options
 */
export default function browserSyncPlugin(options = {}) {
  const { proxy = 'http://localhost:8000', port = 3000, files = [], rewriteRules = [] } = options;

  let bs;

  return {
    name: 'vite-plugin-browsersync',
    configureServer(server) {
      bs = browserSync.create();
      bs.init({
        proxy,
        port,
        ui: false,
        open: false,
        files,
        rewriteRules,
        notify: false,
      });

      server.watcher.on('change', () => {
        bs.reload();
      });
      server.httpServer.once('close', () => {
        bs.exit();
      });
    },
  };
}
