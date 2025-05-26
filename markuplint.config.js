export default {
  parser: {
    '\\.php$': '@markuplint/php-parser',
  },
  extends: ['markuplint:recommended'],
  rules: {
    'required-h1': false, // H1 タグは必須ではない
  },
  overrides: {
    './**/*.php': {
      rules: {
        'required-h1': false,
        'character-reference': false,
        'permitted-contents': false,
      },
      nodeRules: [
        {
          selector: 'html',
          rules: {
            'invalid-attr': false,
            'required-attr': false,
          },
        },
        {
          selector: 'head',
          rules: {
            'required-element': false,
          },
        },
        {
          selector: 'img',
          rules: {
            'required-attr': false,
          },
        },
        {
          selector: 'img',
          rules: {
            // img 要素では alt と loading のみ必須にする
            'required-attr': ['alt', 'loading'],
          },
        },
      ],
    },
  },
};
