module.exports = {
  root: true,

  env: {
    browser: true,
    node: true,
    es2020: true,
  },

  plugins: [
    'modules-newline',
    'import',
  ],

  parserOptions: {
    parser: '@typescript-eslint/parser',
    requireConfigFile: false,
  },

  extends: [
    '@nuxtjs/eslint-config-typescript',
    'plugin:@typescript-eslint/recommended',
    'plugin:vue/recommended',
    'plugin:nuxt/recommended',
    'plugin:import/errors',
    'plugin:import/warnings',
    'plugin:import/typescript',
    'plugin:lodash-fp/recommended',
  ],

  // Add your custom rules here
  rules: {
    'nuxt/no-cjs-in-config': 'off',

    'vue/html-indent': [
      'error', 2,
    ],
    'vue/script-indent': [
      'error', 2,
      {
        baseIndent: 1,
        switchCase: 1,
      },
    ],
    'vue/no-v-html': 'off',

    'array-bracket-spacing': [ 'error', 'always' ],
    'arrow-parens': [ 'error', 'always' ],
    'arrow-spacing': 'error',
    'camelcase': [
      'error',
      {
        ignoreDestructuring: true,
      },
    ],
    'comma-dangle': [ 'error', 'always-multiline' ],
    'comma-spacing': [
      'error',
      {
        before: false,
        after: true,
      },
    ],
    'comma-style': [ 'error', 'last' ],
    'computed-property-spacing': [ 'error', 'always' ],
    'dot-notation': 'error',
    'eqeqeq': [ 'error', 'always' ],
    'guard-for-in': 'error',
    'indent': [
      'error', 2,
      {
        SwitchCase: 1,
        VariableDeclarator: 'first',
        FunctionExpression: { parameters: 'first' },
        CallExpression: { arguments: 'first' },
        ArrayExpression: 'first',
        ObjectExpression: 'first',
        flatTernaryExpressions: true,
      },
    ],
    'linebreak-style': [ 'error', 'unix' ],
    'lines-between-class-members': [ 'error', 'always' ],
    'no-array-constructor': 'error',
    'no-bitwise': 'error',
    'no-mixed-operators': 'error',
    'no-multi-assign': 'error',
    'no-multiple-empty-lines': [
      'error',
      {
        max: 2,
        maxEOF: 1,
        maxBOF: 1,
      },
    ],
    'no-console': 'warn',
    'no-nested-ternary': 'error',
    'no-new-object': 'error',
    'no-tabs': 'warn',
    'no-new-func': 'error',
    'no-new-wrappers': 'error',
    'no-return-assign': [ 'error', 'always' ],
    'no-script-url': 'error',
    'no-self-compare': 'error',
    'no-sequences': 'error',
    'no-useless-constructor': 'error',
    'object-curly-newline': [
      'error',
      {
        ObjectExpression: {
          multiline: true,
          consistent: true,
        },
        ObjectPattern: {
          multiline: true,
        },
        ImportDeclaration: 'always',
        ExportDeclaration: 'always',
      },
    ],
    'object-shorthand': [ 'error', 'always' ],
    'operator-linebreak': [
      'error', 'before', {
        overrides: {
          '=': 'after',
        },
      },
    ],
    'prefer-arrow-callback': 'warn',
    'prefer-const': 'warn',
    'prefer-destructuring': [
      'warn',
      {
        array: true,
        object: true,
      },
      {
        enforceForRenamedProperties: false,
      },
    ],
    'prefer-numeric-literals': 'error',
    'prefer-rest-params': 'error',
    'prefer-spread': 'warn',
    'prefer-template': 'warn',
    'quotes': [
      'error',
      'single',
      {
        avoidEscape: true,
      },
    ],
    'quote-props': [ 'error', 'consistent-as-needed' ],
    'space-before-blocks': [ 'warn', 'always' ],
    'space-before-function-paren': [
      'error',
      {
        anonymous: 'always',
        named: 'never',
        asyncArrow: 'always',
      },
    ],
    'spaced-comment': 'off',
    'space-infix-ops': 'error',
    'template-curly-spacing': [ 'error', 'always' ],
    'template-tag-spacing': [ 'error', 'never' ],
    'wrap-iife': [ 'error', 'inside' ],
    'yoda': [ 'error', 'always', { exceptRange: true } ],

    'modules-newline/import-declaration-newline': 'error',
    'modules-newline/export-declaration-newline': 'error',

    'import/default': 'error',
    'import/order': [
      'error', {
        alphabetize: {
          order: 'asc',
        },
      },
    ],

    'semi': 0,
    '@typescript-eslint/semi': 'error',
    '@typescript-eslint/no-var-requires': 'warn',
    '@typescript-eslint/consistent-type-definitions': [ 'error', 'type' ],
    '@typescript-eslint/member-delimiter-style': [
      'error',
      {
        multiline: {
          delimiter: 'semi',
          requireLast: true,
        },
        singleline: {
          delimiter: 'semi',
          requireLast: false,
        },
        multilineDetection: 'brackets',
      },
    ],
  },

  overrides: [
    {
      files: [ '*.vue' ],
      rules: {
        indent: 'off',
      },
    },
  ],

  settings: {
    'import/extensions': [
      '.js',
      '.vue',
    ],

    'import/resolver': {
      alias: {
        map: [
          [ '@', './' ],
        ],
        extensions: [
          '.vue',
          '.json',
          '.js',
        ],
      },
    },
  },
};
