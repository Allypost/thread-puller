module.exports = {
    root: true,

    env: {
        browser: true,
        node: true,
    },

    parserOptions: {
        ecmaVersion: 2019,
        parser: 'babel-eslint',
        ecmaFeatures: {
            impliedStrict: true,
        },
    },

    extends: [
        'eslint:recommended',
        'plugin:vue/recommended',
    ],

    // Add your custom rules here
    rules: {
        'nuxt/no-cjs-in-config': 'off',
        'vue/html-indent': [
            'error', 4,
        ],
        'vue/script-indent': [
            'error', 4,
            {
                'baseIndent': 1,
                'switchCase': 1,
            },
        ],
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
                'before': false,
                'after': true,
            },
        ],
        'comma-style': [ 'error', 'last' ],
        'computed-property-spacing': [ 'error', 'always' ],
        'dot-notation': 'error',
        'eqeqeq': [ 'error', 'always' ],
        'guard-for-in': 'error',
        /*
         'indent': [
         'error', 4,
         {
         'SwitchCase': 1,
         'VariableDeclarator': 'first',
         'FunctionExpression': { 'parameters': 'first' },
         'CallExpression': { 'arguments': 'first' },
         },
         ],
         */
        'linebreak-style': [ 'error', 'unix' ],
        'lines-between-class-members': [ 'error', 'always' ],
        'no-array-constructor': 'error',
        'no-bitwise': 'error',
        'no-mixed-operators': 'error',
        'no-multi-assign': 'error',
        'no-multiple-empty-lines': [
            'error',
            {
                'max': 2,
                'maxEOF': 1,
                'maxBOF': 1,
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
        'object-shorthand': [ 'error', 'always' ],
        'prefer-arrow-callback': 'warn',
        'prefer-const': 'warn',
        'prefer-destructuring': [
            'warn',
            {
                'array': true,
                'object': true,
            },
            {
                'enforceForRenamedProperties': false,
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
                'avoidEscape': true,
            },
        ],
        'semi': [ 'error', 'always' ],
        'space-before-blocks': [ 'warn', 'always' ],
        'space-infix-ops': 'error',
        'template-tag-spacing': [ 'error', 'never' ],
        'wrap-iife': [ 'error', 'inside' ],
        'yoda': [ 'error', 'always', { 'exceptRange': true } ],
    },
};
