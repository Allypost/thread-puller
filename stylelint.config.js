module.exports = {
  // add your custom config here
  // https://stylelint.io/user-guide/configuration
  extends: 'stylelint-config-standard',

  plugins: [
    'stylelint-scss',
  ],

  rules: {
    'number-leading-zero': 'never',
    'rule-empty-line-before': [
      'always',
      {
        except: [ 'after-single-line-comment' ],
      },
    ],
    'block-closing-brace-empty-line-before': [
      'never',
      {
        except: [ 'after-closing-brace' ],
      },
    ],
    'selector-pseudo-class-no-unknown': [
      true,
      {
        ignorePseudoClasses: [ 'global' ],
      },
    ],
    'color-hex-case': 'lower',
    'color-hex-length': 'long',

    'at-rule-no-unknown': null,
    'scss/at-rule-no-unknown': true,

    'no-invalid-position-at-import-rule': null,
  },
};
