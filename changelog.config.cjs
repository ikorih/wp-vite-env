module.exports = {
  disableEmoji: true,
  format: '{type}{scope}: {subject}',
  list: ['feat', 'fix', 'mod', 'refactor', 'perf', 'style', 'chore', 'add', 'docs'],
  maxMessageLength: 64,
  minMessageLength: 3,
  questions: ['type', 'scope', 'subject', 'body', 'breaking', 'issues', 'lerna'],
  // scope = 変更領域。「構造」軸を主にしつつ、横断的な見た目/挙動は css/js で表す。
  //
  // ＜基盤＞
  //   ''         : 横断的・全体（scope なし）
  //   開発環境   : Docker / Vite / ビルド / npm スクリプト / lint / Wordmove 等の開発・運用基盤
  //   db         : データベース（ダンプ・初期化）
  // ＜WordPress 環境（テーマ外。本体・プラグインを git 追跡しているため）＞
  //   wordpress  : WordPress 本体（コア）のバージョンアップ
  //   plugin     : プラグインの追加 / 更新 / 削除
  //              → 保守作業は chore、機能目的の追加なら feat を使う
  // ＜構造（ITCSS のレイヤーに対応）＞
  //   layout     : 共通のガワ（header / footer など）← l-
  //   page       : 各ページ固有のテンプレート（front-page / single / archive など）
  //   component  : 再利用パーツ（ボタン / カードなど）← c-
  //   functions  : functions.php・inc/（テーマ機能・WP フック・セットアップ）
  //   block      : ブロックエディタ（Gutenberg）関連
  // ＜ファイル種別（構造に紐付かない横断変更で使う）＞
  //   css        : スタイル / Tailwind（全体トークン・横断的な見た目調整など）
  //   js         : JavaScript（共通挙動・横断的なスクリプト）
  //   assets     : 画像・フォント等の静的素材
  //
  // 選び方: 特定の構造に閉じた変更は構造 scope（例: ヘッダーのCSS調整→layout）。
  //         どの構造にも属さない横断変更だけ css / js を使う（例: 全体のフォント変更→css）。
  scopes: [
    '',
    '開発環境',
    'db',
    'wordpress',
    'plugin',
    'layout',
    'page',
    'component',
    'functions',
    'block',
    'css',
    'js',
    'assets',
  ],
  // type =「変更の性質」のみを表す（領域は scope で表す）。
  // 見た目・マークアップの変更は mod/fix/feat + scope(css / layout / component …) で表現する。
  types: {
    feat: {
      description: '新機能の追加',
      value: 'feat',
    },
    fix: {
      description: 'バグ修正',
      value: 'fix',
    },
    mod: {
      description: '既存機能の変更・改善（見た目・マークアップの調整もここ）',
      value: 'mod',
    },
    refactor: {
      description: '機能変更を伴わないコード改善',
      value: 'refactor',
    },
    perf: {
      description: 'パフォーマンス改善',
      value: 'perf',
    },
    style: {
      description: 'コード整形（空白・インデント・フォーマッタ適用等、機能に影響しない）',
      value: 'style',
    },
    chore: {
      description: 'ビルド設定・開発環境の変更、WP本体/プラグインの更新・追加・削除',
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
