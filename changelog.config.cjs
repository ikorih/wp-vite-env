module.exports = {
  disableEmoji: true,
  format: '{type}{scope}: {subject}',
  list: ['mod', 'feat', 'fix', 'style', 'markup', 'refactor', 'perf', 'chore', 'add', 'docs'],
  maxMessageLength: 64,
  minMessageLength: 3,
  questions: ['type', 'scope', 'subject', 'body', 'breaking', 'issues', 'lerna'],
  scopes: ['', 'theme', 'template', 'scss', 'js', 'plugin', 'assets', 'docker', 'gulp'],
  types: {
    mod: {
      description: '既存機能の変更・改善',
      value: 'mod',
    },
    feat: {
      description: '新機能の追加',
      value: 'feat',
    },
    fix: {
      description: 'バグ修正',
      value: 'fix',
    },
    style: {
      description: 'CSS/SCSSの変更（見た目の調整）',
      value: 'style',
    },
    markup: {
      description: 'HTML/PHPテンプレートの変更',
      value: 'markup',
    },
    refactor: {
      description: '機能変更を伴わないコード改善',
      value: 'refactor',
    },
    perf: {
      description: 'パフォーマンス改善',
      value: 'perf',
    },
    chore: {
      description: 'ビルド設定・開発環境の変更',
      value: 'chore',
    },
    add: {
      description: 'アセット追加（画像、フォント、動画等）',
      value: 'add',
    },
    docs: {
      description: 'ドキュメントの変更',
      value: 'docs',
    },
  },
};
